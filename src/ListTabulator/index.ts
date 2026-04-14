import type { ListConfig, ListData } from '../types/ListParams';
import type { ItemElement, ItemChildWrapperElement } from '../types/Elements';
import { isHtmlElement } from '../utils/type-guards';
import { getCaretNodeAndOffset, getContenteditableSlice, isCaretAtStartOfInput } from '@editorjs/caret';
import { DefaultListCssClasses } from '../ListRenderer';
import type { PasteEvent } from '../types';
import type { API, BlockAPI, PasteConfig } from '@editorjs/editorjs';
import type { ListParams } from '..';
import type { DefinitionListItem } from '../types/ItemMeta';
import type { ListRenderer } from '../types/ListRenderer';
import { getItemContentElement } from '../utils/getItemContentElement';
import { focusItem } from '../utils/focusItem';
import { isLastItem } from '../utils/isLastItem';

/**
 * Class that is responsible for list tabulation
 */
export default class ListTabulator<Renderer extends ListRenderer> {
  /**
   * The Editor.js API
   */
  private api: API;

  /**
   * Is Editorjs List Tool read-only option
   */
  private readOnly: boolean;

  /**
   * Tool's configuration
   */
  private config?: ListConfig;

  /**
   * Full content of the list
   */
  private data: ListData;

  /**
   * Editor block api
   */
  private block: BlockAPI;

  /**
   * Renderer instance
   */
  private renderer: Renderer;

  /**
   * Wrapper of the whole list
   */
  private listWrapper: ItemChildWrapperElement | undefined;

  /**
   * Returns the currently focused list item, or null
   */
  private get currentItem(): ItemElement | null {
    const selection = window.getSelection();

    if (!selection) {
      return null;
    }

    let currentNode = selection.anchorNode;

    if (!currentNode) {
      return null;
    }

    if (!isHtmlElement(currentNode)) {
      currentNode = currentNode.parentNode;
    }

    if (!currentNode) {
      return null;
    }

    if (!isHtmlElement(currentNode)) {
      return null;
    }

    return currentNode.closest(`.${DefaultListCssClasses.item}`);
  }

  /**
   * Assign all passed params and renderer to relevant class properties
   * @param params - tool constructor options
   * @param renderer - renderer instance initialized in tool class
   */
  constructor({ data, config, api, readOnly, block }: ListParams, renderer: Renderer) {
    this.config = config;
    this.data = data;
    this.readOnly = readOnly;
    this.api = api;
    this.block = block;
    this.renderer = renderer;
  }

  /**
   * Renders the definition list with its items
   * @returns - filled wrapper element of the list
   */
  public render(): ItemChildWrapperElement {
    this.listWrapper = this.renderer.renderWrapper(true);

    const items = this.data.items.length
      ? this.data.items
      : [
          {
            term: '',
            description: '',
          } as DefinitionListItem,
        ];

    this.appendItems(items, this.listWrapper);

    if (!this.readOnly) {
      this.listWrapper.addEventListener(
        'keydown',
        (event) => {
          switch (event.key) {
            case 'Enter':
              if (!event.shiftKey) {
                this.enterPressed(event);
              }
              break;
            case 'Backspace':
              this.backspace(event);
              break;
          }
        },
        false
      );
    }

    return this.listWrapper;
  }

  /**
   * Saves the list data from the DOM
   * @returns - saved list data
   */
  public save(): ListData {
    const items: DefinitionListItem[] = this.listWrapper
      ? Array.from(this.listWrapper.querySelectorAll<ItemElement>(`:scope > .${DefaultListCssClasses.item}`))
        .map(el => this.renderer.getItemMeta(el))
      : [];

    return {
      style: this.data.style,
      meta: {},
      items,
    };
  }

  /**
   * On paste sanitization config
   * @returns - config that determines tags supported by paste handler
   */
  public static get pasteConfig(): PasteConfig {
    return {
      tags: ['DL', 'DT', 'DD'],
    };
  }

  /**
   * Merges another list block's data into this one
   * @param data - data of the next list block to merge
   */
  public merge(data: ListData): void {
    const items = this.block.holder.querySelectorAll<ItemElement>(`.${DefaultListCssClasses.item}`);
    const lastItem: ItemElement | undefined = items[items.length - 1];
    const lastItemContent = lastItem !== undefined ? getItemContentElement(lastItem) : null;

    if (lastItem === undefined || lastItemContent === null) {
      return;
    }

    lastItemContent.insertAdjacentHTML('beforeend', data.items[0]?.term ?? '');

    data.items.slice(1).forEach((item) => {
      this.appendItems([item], this.listWrapper!);
    });
  }

  /**
   * Handles paste of DL/DT/DD elements
   * @param event - keyboard paste event containing the pasted element
   */
  public onPaste(event: PasteEvent): void {
    const element = event.detail.data;

    switch (element.tagName) {
      case 'DL':
        this.data = this.dataFromElement(element as HTMLDListElement);
        break;
      case 'DT':
        this.data = {
          style: 'definition',
          meta: {},
          items: [
            {
              term: element.innerHTML,
              description: '',
            },
          ],
        };
        break;
      case 'DD':
        this.data = {
          style: 'definition',
          meta: {},
          items: [
            {
              term: '',
              description: element.innerHTML,
            },
          ],
        };
        break;
    }

    if (this.listWrapper) {
      this.listWrapper.innerHTML = '';
      this.appendItems(this.data.items, this.listWrapper);
    }
  }

  /**
   * Converts a <dl> element into ListData
   * @param dl - the dl element to convert
   * @returns - ListData object
   */
  private dataFromElement(dl: HTMLDListElement): ListData {
    const items: DefinitionListItem[] = [];
    const children = Array.from(dl.children).filter(el => el.tagName === 'DT' || el.tagName === 'DD');

    for (let i = 0; i < children.length; i++) {
      const el = children[i];

      if (el.tagName === 'DT') {
        const next = children[i + 1];
        const description = next?.tagName === 'DD' ? next.innerHTML : '';

        if (next?.tagName === 'DD') {
          i++;
        }
        items.push({
          term: el.innerHTML,
          description,
        });
      } else {
        items.push({
          term: '',
          description: el.innerHTML,
        });
      }
    }

    return {
      style: 'definition',
      meta: {},
      items,
    };
  }

  /**
   * Appends list items to the wrapper element
   * @param items - array of ListItem objects to render and append
   * @param wrapper - the parent element to append rendered items into
   */
  private appendItems(items: DefinitionListItem[], wrapper: ItemChildWrapperElement): void {
    items.forEach((item) => {
      const itemEl = this.renderer.renderItem(item);

      wrapper.appendChild(itemEl);
    });
  }

  /**
   * Handles Enter key press — creates a new item after the current one
   * @param event - keyboard event
   */
  private enterPressed(event: KeyboardEvent): void {
    const currentItem = this.currentItem;

    if (!currentItem) {
      return;
    }

    const currentItemContent = getItemContentElement(currentItem);

    if (!currentItemContent) {
      return;
    }

    /**
     * If Enter is pressed in an empty last item, break out of the list
     */
    if (isLastItem(currentItem) && currentItemContent.innerHTML.trim() === '') {
      this.convertLastItemToBlock();

      event.preventDefault();

      return;
    }

    const [currentNode, offset] = getCaretNodeAndOffset();
    const endingHTML = currentNode !== null ? getContenteditableSlice(currentItemContent, currentNode, offset, 'right', true) : '';

    currentItemContent.innerHTML = currentItemContent.innerHTML.replace(endingHTML, '');

    /**
     * New item is an empty pair with the ending HTML as the term
     */
    const newItem = this.renderer.renderItem({
      term: endingHTML,
      description: '',
    });

    currentItem.insertAdjacentElement('afterend', newItem);

    focusItem(newItem, true);

    event.preventDefault();
  }

  /**
   * Handles Backspace key press — merges with previous item or removes current
   * @param event - keyboard event
   */
  private backspace(event: KeyboardEvent): void {
    const currentItem = this.currentItem;

    if (!currentItem) {
      return;
    }

    const currentItemContent = getItemContentElement(currentItem);

    if (!currentItemContent) {
      return;
    }

    if (!isCaretAtStartOfInput(currentItemContent)) {
      return;
    }

    const previousItem: ItemElement | null = currentItem.previousElementSibling as ItemElement | null;

    /**
     * If there is no previous item, let the editor handle merging with the previous block
     */
    if (!previousItem) {
      return;
    }

    event.preventDefault();

    const previousItemContent = getItemContentElement(previousItem);

    if (previousItemContent === null) {
      return;
    }

    const currentContent = currentItemContent.innerHTML;

    previousItemContent.insertAdjacentHTML('beforeend', currentContent);
    currentItem.remove();
    focusItem(previousItem, false);
  }

  /**
   * Converts the last empty item into a new paragraph block
   */
  private convertLastItemToBlock(): void {
    const currentItem = this.currentItem;

    if (!currentItem) {
      return;
    }

    currentItem.remove();
    this.api.blocks.insert();
    this.api.caret.setToBlock(this.api.blocks.getCurrentBlockIndex());
  }
}

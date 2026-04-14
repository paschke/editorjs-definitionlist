import type { DefinitionListItem } from '../types/ItemMeta';
import type { ListConfig } from '../types/ListParams';
import { make, isEmpty } from '@editorjs/dom';
import { DefaultListCssClasses } from './ListRenderer';
import type { ListCssClasses, ListRendererInterface } from './ListRenderer';
import { CssPrefix } from '../styles/CssPrefix';

/**
 * CSS classes used in definition list rendering
 */
interface DefinitionListCssClasses extends ListCssClasses {
  /**
   * CSS class of the definition list wrapper
   */
  definitionList: string;
  /**
   * CSS class of a term item (<dt>)
   */
  term: string;
  /**
   * CSS class of a description item (<dd>)
   */
  description: string;
}

/**
 * Class responsible for rendering a definition list (<dl>, <dt>, <dd>)
 */
export class DefinitionListRenderer implements ListRendererInterface<DefinitionListItem> {
  /**
   * Tool's configuration
   */
  protected config?: ListConfig;

  /**
   * Is EditorJS List Tool read-only option
   */
  private readOnly: boolean;

  /**
   * Getter for all CSS classes used in definition list rendering
   */
  private static get CSS(): DefinitionListCssClasses {
    return {
      ...DefaultListCssClasses,
      definitionList: `${CssPrefix}-definition`,
      term: `${CssPrefix}__term`,
      description: `${CssPrefix}__description`,
    };
  }

  /**
   * Assign passed readonly mode and config to relevant class properties
   * @param readonly - read-only mode flag
   * @param config - user config for Tool
   */
  constructor(readonly: boolean, config?: ListConfig) {
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders the <dl> wrapper element
   * @param _isRoot - unused, definition lists have no nesting
   * @returns - created html dl element
   */
  public renderWrapper(_isRoot: boolean): HTMLDListElement {
    return make('dl', [DefinitionListRenderer.CSS.wrapper, DefinitionListRenderer.CSS.definitionList]) as HTMLDListElement;
  }

  /**
   * Renders a definition list item as a <dt>+<dd> pair wrapped in a <div>
   * @param item - DefinitionListItem containing term and description
   * @returns - created wrapper element containing the dt and dd elements
   */
  public renderItem(item: DefinitionListItem): HTMLElement {
    const itemWrapper = make('div', [DefinitionListRenderer.CSS.item]);

    const termEl = make('dt', [DefinitionListRenderer.CSS.term]);
    const termContent = make('div', DefinitionListRenderer.CSS.itemContent, {
      innerHTML: item.term,
      contentEditable: (!this.readOnly).toString(),
    });

    termEl.appendChild(termContent);

    const descEl = make('dd', [DefinitionListRenderer.CSS.description]);
    const descContent = make('div', DefinitionListRenderer.CSS.itemContent, {
      innerHTML: item.description,
      contentEditable: (!this.readOnly).toString(),
    });

    descEl.appendChild(descContent);

    itemWrapper.appendChild(termEl);
    itemWrapper.appendChild(descEl);

    return itemWrapper;
  }

  /**
   * Returns the item content — not used for paired items, returns empty string
   * @param _item - item wrapper element
   * @returns - empty string (use getItemData instead)
   */
  public getItemContent(_item: Element): string {
    return '';
  }

  /**
   * Returns a DefinitionListItem from a rendered item wrapper element
   * @param item - item wrapper element containing <dt> and <dd>
   * @returns - DefinitionListItem with term and description strings
   */
  public getItemMeta(item: Element): DefinitionListItem {
    const termContentEl = item.querySelector(`dt .${DefinitionListRenderer.CSS.itemContent}`);
    const descContentEl = item.querySelector(`dd .${DefinitionListRenderer.CSS.itemContent}`);

    const term = termContentEl && !isEmpty(termContentEl) ? termContentEl.innerHTML : '';
    const description = descContentEl && !isEmpty(descContentEl) ? descContentEl.innerHTML : '';

    return {
      term,
      description,
    };
  }

  /**
   * Returns default item — new items start with empty term and description
   */
  public composeDefaultMeta(): DefinitionListItem {
    return {
      term: '',
      description: '',
    };
  }
}

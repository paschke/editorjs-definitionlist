import type { API, BlockAPI, PasteConfig, ToolboxConfig } from '@editorjs/editorjs';
import type {
  BlockToolConstructorOptions,
  ToolConfig
} from '@editorjs/editorjs/types/tools';
import type { ListConfig, ListData } from './types/ListParams';
import type { DefinitionListItem } from './types/ItemMeta';
import type { ListRenderer } from './types/ListRenderer';
import type { PasteEvent } from './types';
import ListTabulator from './ListTabulator';
import { DefinitionListRenderer } from './ListRenderer';
import normalizeData from './utils/normalizeData';

/**
 * Build styles
 */
import './styles/list.pcss';

/**
 * Constructor Params for Editorjs DefinitionList Tool
 */
export type ListParams = BlockToolConstructorOptions<ListData, ListConfig>;

/**
 * Definition List Tool for Editor.js
 * Renders a <dl> element with <dt> (term) and <dd> (description) items
 */
export default class EditorjsList {
  /**
   * Notify core that read-only mode is supported
   */
  public static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Allow use of native Enter behavior
   */
  public static get enableLineBreaks(): boolean {
    return true;
  }

  /**
   * Get Tool toolbox settings
   */
  public static get toolbox(): ToolboxConfig {
    return [
      {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>',
        title: 'Definition List',
        data: {
          style: 'definition',
        },
      },
    ];
  }

  /**
   * On paste sanitization config. Allow only tags that are allowed in the Tool.
   * @returns - paste config object used in editor
   */
  public static get pasteConfig(): PasteConfig {
    return {
      tags: ['DL', 'DT', 'DD'],
    };
  }

  /**
   * Convert from definition list to text and back
   */
  public static get conversionConfig(): {
    /**
     * Joins all item contents into a single string
     * @param data - current list data
     * @returns - contents string formed from list data
     */
    export: (data: ListData) => string;

    /**
     * Creates a single-item definition list from a plain string
     * @param content - plain text string to import
     * @param config - tool configuration
     * @returns - list data formed from content string
     */
    import: (content: string, config: ToolConfig<ListConfig>) => ListData;
  } {
    return {
      export: (data) => {
        return data.items.map(item => `${item.term}: ${item.description}`).join(' ');
      },
      import: (content, _config) => {
        return {
          style: 'definition',
          meta: {},
          items: [
            {
              term: content,
              description: '',
            } as DefinitionListItem,
          ],
        };
      },
    };
  }

  /**
   * The Editor.js API
   */
  private api: API;

  /**
   * Is EditorJS List Tool read-only?
   */
  private readOnly: boolean;

  /**
   * Tool's configuration
   */
  private config: ListConfig | undefined;

  /**
   * Tool's data
   */
  private data: ListData;

  /**
   * Editor block api
   */
  private block: BlockAPI;

  /**
   * Class that is responsible for complete list rendering and saving
   */
  private list: ListTabulator<ListRenderer> | undefined;

  /**
   * Main wrapper element of the whole list
   */
  private listElement: HTMLElement | undefined;

  /**
   * Render plugin's main Element and fill it with saved data
   * @param params - tool constructor options
   */
  constructor({ data, config, api, readOnly, block }: ListParams) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;
    this.block = block;

    const initialData: ListData = {
      style: 'definition',
      meta: {},
      items: [],
    };

    this.data = Object.keys(data).length ? normalizeData(data) : initialData;

    this.list = new ListTabulator<DefinitionListRenderer>(
      {
        data: this.data,
        readOnly: this.readOnly,
        api: this.api,
        config: this.config,
        block: this.block,
      },
      new DefinitionListRenderer(this.readOnly, this.config)
    );
  }

  /**
   * Function that is responsible for content rendering
   * @returns rendered list wrapper with all contents
   */
  public render(): HTMLElement {
    this.listElement = this.list!.render();

    return this.listElement;
  }

  /**
   * Function that is responsible for content saving
   * @returns formatted content used in editor
   */
  public save(): ListData {
    this.data = this.list!.save();

    return this.data;
  }

  /**
   * Function that is responsible for merging two lists into one
   * @param data - data of the next standing list, that should be merged with current
   */
  public merge(data: ListData): void {
    this.list!.merge(data);
  }

  /**
   * On paste callback that is fired from Editor
   * @param event - event with pasted data
   */
  public onPaste(event: PasteEvent): void {
    this.list!.onPaste(event);
  }
}

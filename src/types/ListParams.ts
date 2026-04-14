import type { DefinitionListItem } from './ItemMeta';

/**
 * List style — definition list only
 */
export type ListDataStyle = 'definition';

/**
 * Interface that represents data of the DefinitionList tool
 */
export interface ListData {
  /**
   * Style of the list tool
   */
  style: ListDataStyle;

  /**
   * Meta information of the list block itself
   */
  meta: Record<string, never>;

  /**
   * Array of definition list items, each containing a term and description pair
   */
  items: DefinitionListItem[];
}

/**
 * Tool's configuration
 */
export interface ListConfig {
  /**
   * default list style — always 'definition'
   */
  defaultStyle?: ListDataStyle;
}

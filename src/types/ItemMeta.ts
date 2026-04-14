/**
 * A single definition list entry, consisting of exactly one term and one description
 */
export interface DefinitionListItem {
  /**
   * The term being defined (<dt>)
   */
  term: string;

  /**
   * The definition/description of the term (<dd>)
   */
  description: string;
}

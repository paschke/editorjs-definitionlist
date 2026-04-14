import type { ListData } from '../types/ListParams';

/**
 * Returns a deep clone of the passed list data.
 * No legacy format migration is needed for the definition list tool.
 * @param data - raw ListData object to clone and return
 * @returns - normalized data ready to be used by the DefinitionList tool
 */
export default function normalizeData(data: ListData): ListData {
  return structuredClone(data);
}

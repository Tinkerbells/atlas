export interface IFileSearchQuery {
  folder: string;
  pattern?: string;
  includePattern?: string[];
  excludePattern?: string[];
  maxResults?: number;
}

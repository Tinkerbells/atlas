import { createDecorator } from "@core/di/instantiation";

export interface SearchOptions {
  drive?: string;
  includeHidden?: boolean;
  limit?: number;
  fileTypes?: string[];
}

export interface SearchResult {
  uri: string;
  name: string;
  path: string;
  size: number;
  modifiedTime: number;
  isDirectory: boolean;
  drive: string;
  score: number;
}

export interface IFileSearchService {
  readonly _serviceBrand: undefined;
  search: (query: string, options?: SearchOptions) => Promise<SearchResult[]>;
}

export const IFileSearchService = createDecorator<IFileSearchService>("fileSearchService");

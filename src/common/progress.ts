export interface IProgress<T> {
  report: (item: T) => void;
}

export interface IProgressOptions {
  total?: number;
  title?: string;
}

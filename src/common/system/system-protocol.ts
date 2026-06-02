export const systemIpcChannel = "ping";

export interface ISystemQueries {
  [systemIpcChannel]: () => Promise<string>;
}

export interface ISystemEvents {
  // Пример: 'system:update-available': (version: string) => void;
}

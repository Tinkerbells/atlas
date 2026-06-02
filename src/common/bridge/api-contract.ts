import type { LogLevel } from '~/common/logger';

export interface User {
  id: string;
  name: string;
}

// Запрос-ответ (invoke/handle)
export interface IMainQueries {
  ping: () => Promise<string>;
  'logger:log': (level: LogLevel, message: string, ...args: any[]) => Promise<void>;
}

// События из Main в Renderer (send/on)
export interface IMainEvents {
  // Пример: 'download:progress': (percent: number) => void;
}

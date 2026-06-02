import type { ILoggerQueries, ILoggerEvents } from "~/common/logger/logger-protocol";
import type { ISystemQueries, ISystemEvents } from "~/common/system/system-protocol";
import type { IStorageQueries, IStorageEvents } from "~/common/storage/storage-protocol";

export type IQueries = ILoggerQueries & ISystemQueries & IStorageQueries;
export type IEvents = ILoggerEvents & ISystemEvents & IStorageEvents;

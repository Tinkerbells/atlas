import type { IFsEvents, IFsQueries } from "~/common/fs/fs-protocol";
import type { ILoggerEvents, ILoggerQueries } from "~/common/logger/logger-protocol";
import type { ISystemEvents, ISystemQueries } from "~/common/system/system-protocol";
import type { IStorageEvents, IStorageQueries } from "~/common/storage/storage-protocol";

export type IQueries = ILoggerQueries & ISystemQueries & IStorageQueries & IFsQueries;
export type IEvents = ILoggerEvents & ISystemEvents & IStorageEvents & IFsEvents;

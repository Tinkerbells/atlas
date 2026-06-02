import type { ILoggerQueries, ILoggerEvents } from "~/common/logger/logger-protocol";
import type { ISystemQueries, ISystemEvents } from "~/common/system/system-protocol";

export type IQueries = ILoggerQueries & ISystemQueries;
export type IEvents = ILoggerEvents & ISystemEvents;

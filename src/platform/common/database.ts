import type { IDisposable } from "@core/base/lifecycle";

import { createDecorator } from "@core/di/instantiation";

export interface IDatabaseService extends IDisposable {
  readonly _serviceBrand: undefined;

  /**
   * Execute a SQL statement that does not return rows.
   */
  exec: (sql: string) => void;

  /**
   * Prepare a statement for repeated execution.
   */
  prepare: <Params extends unknown[], Result>(sql: string) => IPreparedStatement<Params, Result>;

  /**
   * Run a function inside a database transaction.
   */
  transaction: <T>(fn: () => T) => T;

  /**
   * Run pending migrations.
   */
  migrate: () => void;

  /**
   * Close the database connection.
   */
  close: () => void;
}

export const IDatabaseService = createDecorator<IDatabaseService>("databaseService");

export interface IPreparedStatement<Params extends unknown[], Result> {
  run: (...params: Params) => { changes: number; lastInsertRowid: number | bigint };
  get: (...params: Params) => Result | undefined;
  all: (...params: Params) => Result[];
}

export interface IMigration {
  readonly version: number;
  readonly name: string;
  up: (db: IDatabaseService) => void;
}

import { api } from "../bridge/bridge-client";

export const storageService = {
  get: api.storage.get,
  set: api.storage.set,
  delete: api.storage.delete,
};

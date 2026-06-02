import { api } from "../bridge/bridge-client";

export const recentFilesService = {
  get: api.recentFiles.get,
  add: api.recentFiles.add,
  remove: api.recentFiles.remove,
};

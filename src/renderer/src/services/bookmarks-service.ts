import { api } from "../bridge/bridge-client";

export const bookmarksService = {
  get: api.bookmarks.get,
  add: api.bookmarks.add,
  remove: api.bookmarks.remove,
};

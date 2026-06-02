import { api } from "../bridge/bridge-client";

export const themeService = {
  get: api.theme.get,
  set: api.theme.set,
};

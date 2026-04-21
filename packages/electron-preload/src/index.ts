import { ipcRenderer } from "electron";

import { versions } from "./versions.js";
import { sha256sum } from "./node-crypto.js";

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

export { send, sha256sum, versions };

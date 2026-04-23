import { ipcRenderer } from "electron";

import { versions } from "./versions.js";
import { sha256sum } from "./node-crypto.js";
import { getHome, getNodeBinary, killProcess, spawnProcess, spawnStream } from "./node-process.js";

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

export { getHome, getNodeBinary, killProcess, send, sha256sum, spawnProcess, spawnStream, versions };

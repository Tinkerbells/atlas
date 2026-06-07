import type { RemoteSystemServer } from "~/common/messaging/service-protocols";

export class SystemRpcServer implements RemoteSystemServer {
  async ping(): Promise<string> {
    return "pong";
  }
}

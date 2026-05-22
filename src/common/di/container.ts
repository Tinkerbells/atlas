import { Container } from "inversify";

import { Services } from "./types";
import { WindowManager } from "../../main/windows";
import { LifecycleManager } from "../../main/lifecycle";

const container = new Container();

container.bind(Services.WindowManager).to(WindowManager).inSingletonScope();
container.bind(Services.LifecycleManager).to(LifecycleManager).inSingletonScope();

export { container };

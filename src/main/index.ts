import "reflect-metadata";

import type { LifecycleManager } from "./lifecycle";

import { Services } from "../common/di/types";
import { container } from "../common/di/container";

const lifecycleManager = container.get<LifecycleManager>(Services.LifecycleManager);

console.log("[Main] Starting lifecycle manager...");
lifecycleManager.start();

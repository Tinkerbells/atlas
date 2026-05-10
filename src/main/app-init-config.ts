export interface AppInitConfig {
  preload: {
    path: string;
  };

  sharedProcess: {
    path: string;
  };

  renderer:
    | {
      path: string;
    }
    | URL;
}

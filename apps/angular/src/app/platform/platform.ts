export enum OperatingSystem {
  Windows = 1,
  Macintosh = 2,
  Linux = 3,
}

export const OS: OperatingSystem = (() => {
  const platform = typeof process !== 'undefined' ? process.platform : 'unknown';

  if (platform === 'win32') {
    return OperatingSystem.Windows;
  } else if (platform === 'darwin') {
    return OperatingSystem.Macintosh;
  } else if (platform === 'linux') {
    return OperatingSystem.Linux;
  }

  return OperatingSystem.Linux;
})();

export const isWindows = OS === OperatingSystem.Windows;
export const isMacintosh = OS === OperatingSystem.Macintosh;
export const isLinux = OS === OperatingSystem.Linux;

export enum OperatingSystem {
  Windows = 1,
  Macintosh = 2,
  Linux = 3,
}

export const OS: OperatingSystem = (() => {
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win"))
      return OperatingSystem.Windows;
    if (ua.includes("mac"))
      return OperatingSystem.Macintosh;
    if (ua.includes("linux"))
      return OperatingSystem.Linux;
  }
  if (typeof process !== "undefined" && process.platform) {
    const platform = process.platform;
    if (platform === "win32")
      return OperatingSystem.Windows;
    if (platform === "darwin")
      return OperatingSystem.Macintosh;
    if (platform === "linux")
      return OperatingSystem.Linux;
  }
  return OperatingSystem.Linux;
})();

export const isWindows = OS === OperatingSystem.Windows;
export const isMacintosh = OS === OperatingSystem.Macintosh;
export const isLinux = OS === OperatingSystem.Linux;

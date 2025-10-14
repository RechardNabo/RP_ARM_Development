import configData from "@/config/default.json";

export type AppConfig = typeof configData;

export const appConfig: AppConfig = configData;

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return normalizedPath;
  }
  const base = appConfig.app?.apiBaseUrl;
  if (!base) {
    return normalizedPath;
  }
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmedBase}${normalizedPath}`;
}

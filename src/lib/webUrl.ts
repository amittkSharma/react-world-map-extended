/** `infoLink` may come from consumer code: only ever render http(s) URLs (never e.g. `javascript:`). */
export const parseWebUrl = (value: string | undefined): URL | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : undefined
  } catch {
    return undefined
  }
}

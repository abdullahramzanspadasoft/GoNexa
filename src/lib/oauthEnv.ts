/** Trim + strip wrapping quotes (common when pasting into Vercel). Remove zero-width chars. */
export function trimOAuthEnv(value: string | undefined | null): string {
  if (value == null) return "";
  let s = String(value).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s.replace(/\u200b/g, "").replace(/\r/g, "").trim();
}

/** OAuth redirect URIs must match exactly; trailing slash often breaks TikTok/Google. */
export function normalizeOAuthRedirectUri(uri: string): string {
  return trimOAuthEnv(uri).replace(/\/+$/, "");
}

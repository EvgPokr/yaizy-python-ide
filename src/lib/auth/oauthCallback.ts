export interface OAuthCallbackResult {
  token?: string;
  error?: string;
}

/**
 * Parses the OAuth callback URL.
 * The local session token arrives in the URL fragment (#token=...),
 * errors arrive as a query parameter (?error=...).
 */
export function parseOAuthCallback(
  hash: string,
  search: string
): OAuthCallbackResult {
  const searchParams = new URLSearchParams(search);
  const error = searchParams.get('error');
  if (error) {
    return { error };
  }

  const tokenMatch = hash.match(/token=([^&]+)/);
  if (!tokenMatch) {
    return { error: 'No authentication token received' };
  }

  return { token: decodeURIComponent(tokenMatch[1]) };
}

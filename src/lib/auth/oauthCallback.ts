export interface OAuthCallbackResult {
  token?: string;
  error?: string;
  redirect?: string;
}

const DEFAULT_REDIRECT = '/projects';

/**
 * Only allow same-origin relative app paths as a post-login redirect.
 * Rejects absolute URLs, protocol-relative URLs and any other host, so the
 * fragment token can never be leaked to a third-party origin.
 */
export function isSafeRedirect(path: string | undefined): string {
  const candidate = path || DEFAULT_REDIRECT;
  if (candidate.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }
  if (!/^\/[A-Za-z0-9\-._~/]*$/.test(candidate)) {
    return DEFAULT_REDIRECT;
  }
  return candidate;
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

  const redirect = isSafeRedirect(searchParams.get('redirect') ?? undefined);
  return { token: decodeURIComponent(tokenMatch[1]), redirect };
}

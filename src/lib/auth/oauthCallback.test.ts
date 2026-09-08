import { describe, expect, it } from 'vitest';

import { parseOAuthCallback } from './oauthCallback';

describe('parseOAuthCallback', () => {
  it('extracts the token from the URL fragment', () => {
    const result = parseOAuthCallback('#token=abc123', '');
    expect(result.token).toBe('abc123');
    expect(result.error).toBeUndefined();
  });

  it('decodes URI-encoded tokens', () => {
    const result = parseOAuthCallback('#token=a%20b%2Bc', '');
    expect(result.token).toBe('a b+c');
  });

  it('keeps only the token when the fragment has extra params', () => {
    const result = parseOAuthCallback('#token=abc123&extra=1', '');
    expect(result.token).toBe('abc123');
  });

  it('returns an error from the query string', () => {
    const result = parseOAuthCallback('', '?error=access_denied');
    expect(result.error).toBe('access_denied');
    expect(result.token).toBeUndefined();
  });

  it('prefers the query error over the fragment', () => {
    const result = parseOAuthCallback('#token=abc', '?error=oops');
    expect(result.error).toBe('oops');
  });

  it('returns an error when neither token nor error is present', () => {
    const result = parseOAuthCallback('', '');
    expect(result.error).toBe('No authentication token received');
  });
});

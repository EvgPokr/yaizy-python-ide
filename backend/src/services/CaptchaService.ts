/**
 * Google reCAPTCHA verification service
 */

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '';

export class CaptchaService {
  /**
   * Verify reCAPTCHA token
   */
  async verify(token: string, remoteIp?: string): Promise<boolean> {
    // If no secret key configured, skip verification (dev mode)
    if (!RECAPTCHA_SECRET) {
      console.warn('⚠️ RECAPTCHA_SECRET_KEY not configured - skipping verification');
      return true;
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET,
          response: token,
          ...(remoteIp && { remoteip: remoteIp }),
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('reCAPTCHA verification failed:', data['error-codes']);
        return false;
      }

      // Check score for v3 (optional)
      if (data.score !== undefined && data.score < 0.5) {
        console.warn('reCAPTCHA score too low:', data.score);
        return false;
      }

      return true;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }
  }
}

export const captchaService = new CaptchaService();

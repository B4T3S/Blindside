import { randomBytes } from 'node:crypto';

export class DiscordAuthService {
  getAuthorizationUrl(state) {
    const url = new URL('https://discord.com/oauth2/authorize');

    url.search = new URLSearchParams({
      client_id: process.env.OAUTH_CLIENT_ID,
      response_type: 'code',
      redirect_uri: process.env.OAUTH_REDIRECT_URI,
      scope: 'identify',
      state
    }).toString();

    return url.toString();
  }

  generateState() {
    return randomBytes(32).toString('hex');
  }

  async getUserFromCode(code) {
    const response = await fetch(process.env.OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.OAUTH_REDIRECT_URI
      })
    });

    if (!response.ok) {
      throw new Error('Discord token exchange failed');
    }

    const token = await response.json();

    const userResponse = await fetch(
      'https://discord.com/api/v10/users/@me',
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      }
    );

    if (!userResponse.ok) {
      throw new Error('Failed to retrieve Discord user');
    }

    return userResponse.json();
  }
}

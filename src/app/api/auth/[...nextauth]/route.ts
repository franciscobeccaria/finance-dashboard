import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"

// TODO: Test refresh token implementation - not yet tested in production
// This implementation should automatically refresh Google tokens when they expire
// but needs testing with actual expired tokens to verify it works correctly

// Function to refresh the Google access token
async function refreshAccessToken(token: any) {
  try {
    console.log('🔄 Refreshing Google access token...');
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to refresh token:', refreshedTokens);
      throw refreshedTokens;
    }

    console.log('✅ Token refreshed successfully');
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error('❌ Error refreshing access token:', error);
    
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET!,
  callbacks: {
    async jwt({ token, account }) {
      // Si es el primer login (el objeto 'account' existe), persistimos los tokens de Google.
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // Store expiration time
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
      }

      // Check if access token is expired and refresh it
      if (token.accessTokenExpires && Date.now() > (token.accessTokenExpires as number)) {
        console.log('🔄 Access token expired, refreshing...');
        return await refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      // Hacemos que los tokens de Google estén disponibles en el objeto de sesión.
      (session as any).accessToken = token.accessToken as string;
      (session as any).refreshToken = token.refreshToken as string;
      (session as any).error = token.error;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
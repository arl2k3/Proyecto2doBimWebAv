const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('../services/authService');
const env = require('../config/env');

function configurePassport() {
  if (!env.google.clientId || !env.google.clientSecret) {
    console.warn('⚠️ Google OAuth no configurado (GOOGLE_CLIENT_ID/SECRET vacíos)');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const result = await authService.findOrCreateOAuthUser(profile);
          done(null, result);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

module.exports = { configurePassport, passport };

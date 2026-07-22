const express = require('express');
const authController = require('../controllers/authController');
const { registerValidator, loginValidator, validateRequest } = require('../utils/validators');
const { protect } = require('../middlewares/authMiddleware');
const internalAuth = require('../../../shared/middleware/internalAuth');
const { passport } = require('../config/passport');
const env = require('../config/env');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, authController.register);
router.post('/login', loginValidator, validateRequest, authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// OAuth 2.0 / OpenID Connect (Google)
if (env.google.clientId) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${env.appUrl}/login?error=oauth` }),
    (req, res) => {
      const { token } = req.user;
      res.redirect(`${env.appUrl}/auth/callback?token=${token}`);
    }
  );
}

// Internal: other services fetch user info
router.get('/internal/users/:id', internalAuth, authController.getUserInternal);

module.exports = router;

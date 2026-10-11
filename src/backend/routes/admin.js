import { Router } from 'express';
import { DiscordAuthService } from '../service/discord_auth_service.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export function createAdminRouter(database) {
  const router = Router();
  const discord = new DiscordAuthService();

  // Start Discord login
  router.get('/login', (req, res, next) => {
    const state = discord.generateState();

    req.session.oauthState = state;

    req.session.save(error => {
      if (error) return next(error);

      res.redirect(discord.getAuthorizationUrl(state));
    });
  });

  // Handle logouts
  router.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  });

  // Discord OAuth callback
  router.get('/verify', async (req, res, next) => {
    try {
      const { code, state } = req.query;
      const expectedState = req.session.oauthState;

      delete req.session.oauthState;

      if (
        typeof code !== 'string' ||
        typeof state !== 'string' ||
        !expectedState ||
        state !== expectedState
      ) {
        return res.sendStatus(400);
      }

      const user = await discord.getUserFromCode(code);

      // Regenerate session to prevent session fixation
      req.session.regenerate(async (error) => {
        if (error) return next(error);

        req.session.userId = user.id;
        req.session.roles = await database.get_user_roles(user.id);

        req.session.save(error => {
          if (error) return next(error);

          res.redirect('/admin');
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // All following routes require authentication
  router.use(requireAuth);

  // Protected routes
  router.get('/', requireRole('role_admin'), (req, res) => {
    res.render('admin/dashboard.html.twig', { roles: req.session.roles });
  });

  // Deny unknown admin paths rather than falling through
  router.use((req, res) => {
    res.sendStatus(404);
  });

  return router;
}

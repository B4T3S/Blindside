import { Router, urlencoded } from 'express';
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
  router.get('/{:media}{/:category}{/:option}', requireRole('role_admin'), async (req, res) => {
    const selectedMedia = req.params.media;
    const selectedCategory = req.params.category;
    const selectedOption = req.params.option;

    res.render('admin/dashboard.html.twig', {
      hotReload: process.env.NODE_ENV !== 'production',
      games: await database.get_all_media(),
      categories: selectedMedia ? await database.get_all_categories(selectedMedia) : [],
      options: selectedCategory ? await database.get_all_options(selectedCategory) : [],
      selectedMedia: selectedMedia,
      selectedCategory: selectedCategory,
      selectedOption: selectedOption
    });
  });

  router.post('/media/:action{/:id}', [requireRole('role_admin'), urlencoded()], async (req, res) => {
    switch (req.params.action) {
      case "add":
        if (!req.body.name || !req.body.url) {
          throw new Error('Missing parameter "name" or "url"!');
        }

        const id = await database.add_media(req.body.name, req.body.url);
        if(!id)
          return res.redirect('/admin');

        return res.redirect(`/admin/${id}`);
      case "delete":
        database.delete_media(req.params.id);
        return res.redirect('/admin');
    }
  });

  router.post('/category/:action{/:id}', [requireRole('role_admin'), urlencoded()], async (req, res) => {
    switch (req.params.action) {
      case "add":
        if (!req.body.name || !req.body.mediaId) {
          throw new Error('Missing parameter "name" or "mediaId"!');
        }

        const id = await database.add_category(req.body.mediaId, req.body.name);
        if(!id)
            return res.redirect('/admin');

        return res.redirect(`/admin/${req.body.mediaId}/${id}`);
      case "delete":
        database.delete_category(req.params.id);
        return res.redirect('/admin');
    }
  });

  router.post('/option/:action{/:id}', [requireRole('role_admin'), urlencoded()], async (req, res) => {
    switch (req.params.action) {
      case "add":
        if (!req.body.name || !req.body.url || !req.body.categoryId) {
          throw new Error('Missing parameter "name", "url" or "categoryId"!');
        }

        const id = await database.add_option(req.body.categoryId, req.body.name, req.body.url);
        if(!id)
          return res.redirect('/admin');

        return res.redirect(`/admin/${req.body.mediaId}/${req.body.categoryId}/${id}`);
      case "delete":
        database.delete_option(req.params.id);
        return res.redirect('/admin');
    }
  });

  // Deny unknown admin paths rather than falling through
  router.use((_, res) => {
    res.sendStatus(404);
  });

  return router;
}

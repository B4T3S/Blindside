export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }

  next();
}

export function requireRole(role) {
    return (req, res, next) => {
      if (
        req.session.roles?.includes("role_admin") ||
        req.session.roles?.includes(role)
      ) {
        return next();
      }

      return res.sendStatus(403);
    };
  }

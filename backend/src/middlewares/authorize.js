// src/middlewares/authorize.js
// À utiliser APRÈS authenticate.js
// Usage : router.get("/admin-route", authenticate, authorize("ADMIN"), handler)
//         router.get("/teacher-route", authenticate, authorize("TEACHER", "ADMIN"), handler)

export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
};
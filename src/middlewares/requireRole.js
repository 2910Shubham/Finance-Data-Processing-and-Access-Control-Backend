const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    // verifyToken must run before this middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${role}.`,
      });
    }

    next();
  };
};

export default requireRole;
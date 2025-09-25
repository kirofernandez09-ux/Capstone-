const checkPermission = (requiredModule, requiredAccess) => {
  return (req, res, next) => {
    const user = req.user;
    
    // Admin has full access
    if (user.role === 'admin') {
      return next();
    }
    
    // Check if user has specific permission
    const hasPermission = user.permissions.some(permission => 
      permission.module === requiredModule && 
      (permission.access === requiredAccess || permission.access === 'full')
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { checkPermission };
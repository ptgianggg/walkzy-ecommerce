/**
 * Helper functions để kiểm tra quyền của user
 */

/**
 * Kiểm tra user có quyền cụ thể không
 * @param {Object} user - User object từ Redux state
 * @param {String} permissionCode - Mã quyền cần kiểm tra (ví dụ: "USER_CREATE" hoặc "user.create")
 * @returns {Boolean} - true nếu có quyền, false nếu không
 */
export const hasPermission = (user, permissionCode) => {
  // Super Admin có tất cả quyền
  if (user?.isAdmin) {
    return true;
  }

  // Nếu không có roleId hoặc permissions, không có quyền
  if (!user?.roleId || !user?.permissions || user.permissions.length === 0) {
    return false;
  }

  const permissions = user.permissions || [];
  
  // Kiểm tra theo format code (ví dụ: "USER_CREATE")
  if (permissions.includes(permissionCode)) {
    return true;
  }

  // Kiểm tra theo format module.action (ví dụ: "user.create")
  const [module, action] = permissionCode.split('.');
  if (module && action) {
    const fullCode = `${module.toUpperCase()}_${action.toUpperCase()}`;
    if (permissions.includes(fullCode)) {
      return true;
    }
    
    // Kiểm tra quyền manage (toàn quyền) cho module
    const manageCode = `${module.toUpperCase()}_MANAGE`;
    if (permissions.includes(manageCode)) {
      return true;
    }
  }

  return false;
};

/**
 * Kiểm tra user có ít nhất một trong các quyền không
 * @param {Object} user - User object từ Redux state
 * @param {...String} permissionCodes - Danh sách mã quyền cần kiểm tra
 * @returns {Boolean} - true nếu có ít nhất một quyền, false nếu không
 */
export const hasAnyPermission = (user, ...permissionCodes) => {
  // Super Admin có tất cả quyền
  if (user?.isAdmin) {
    return true;
  }

  return permissionCodes.some(permission => hasPermission(user, permission));
};

/**
 * Kiểm tra user có quyền truy cập module không (cần ít nhất một quyền trong module)
 * @param {Object} user - User object từ Redux state
 * @param {String} module - Tên module (ví dụ: "user", "product", "order")
 * @returns {Boolean} - true nếu có quyền truy cập module, false nếu không
 */
export const hasModuleAccess = (user, module) => {
  // Super Admin có tất cả quyền
  if (user?.isAdmin) {
    return true;
  }

  if (!user?.permissions || user.permissions.length === 0) {
    return false;
  }

  const moduleUpper = module.toUpperCase();
  const permissions = user.permissions || [];

  // Kiểm tra xem có quyền nào bắt đầu bằng module name không
  return permissions.some(perm => {
    if (typeof perm === 'string') {
      return perm.startsWith(moduleUpper + '_') || perm.startsWith(module + '.');
    }
    // Nếu perm là object
    if (perm.module === module) {
      return true;
    }
    return false;
  });
};

/**
 * Lấy danh sách permissions của user dạng array
 * @param {Object} user - User object từ Redux state
 * @returns {Array} - Array các mã quyền
 */
export const getUserPermissions = (user) => {
  if (user?.isAdmin) {
    return ['*']; // Tất cả quyền
  }

  return user?.permissions || [];
};


const PermissionFlags = require('../constants/Permissions');

class Permission {
  constructor(bits) {
    this.bits = BigInt(bits);
  }

  resolve(permission) {
    return PermissionFlags[permission];
  }

  has(permissions) {
    if (Array.isArray(permissions)) {
      return permissions.every(p => this.has(p));
    }
    permissions = this.resolve(permissions);
    return (this.bits & permissions) === permissions;
  }

  missing(permissions) {
    if (!Array.isArray(permissions)) permissions = [permissions];
    return permissions.filter(p => !this.has(p));
  }
}

module.exports = Permission;

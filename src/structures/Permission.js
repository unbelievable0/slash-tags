import { Permissions } from '../constants/Permissions.js';

class Permission {
  constructor(bits = 0n) {
    this.bits = BigInt(bits || 0);
  }

  static resolve(permission) {
    if (Array.isArray(permission)) {
      return permission.reduce((acc, p) => acc | Permission.resolve(p), 0n);
    }
    if (typeof permission === 'bigint') return permission;
    if (typeof permission === 'number') return BigInt(permission);
    if (typeof permission === 'string') {
      if (Permissions[permission]) return Permissions[permission];
      const camel = permission.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (Permissions[camel]) return Permissions[camel];
      if (/^\d+$/.test(permission)) return BigInt(permission);
    }
    return 0n;
  }

  resolve(permission) {
    return Permission.resolve(permission);
  }

  has(permissions) {
    if (Array.isArray(permissions)) {
      return permissions.every(p => this.has(p));
    }
    const resolved = this.resolve(permissions);
    if ((this.bits & Permissions.administrator) === Permissions.administrator) {
      return true;
    }
    return (this.bits & resolved) === resolved;
  }

  missing(permissions) {
    if (!Array.isArray(permissions)) permissions = [permissions];
    return permissions.filter(p => !this.has(p));
  }
}

export default Permission;

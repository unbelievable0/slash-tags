import Permission from './Permission.js';
import User from './User.js';

class Member {
  constructor(data) {
    this.permissions = new Permission(data.permissions);
    this.user = new User(data.user);
  }

  get id() {
    return this.user.id;
  }
}

export default Member;

const Permission = require('./Permission');
const User = require('./User');

class Member {
  constructor(data) {
    this.permissions = new Permission(data.permissions);
    this.user = new User(data.user);
  }

  get id() {
    return this.user.id;
  }
}

module.exports = Member;

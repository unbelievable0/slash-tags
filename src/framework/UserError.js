class UserError extends Error {
  constructor(message) {
    super();
    this.name = 'UserError';
    this.message = message;
  }
}

module.exports = UserError;

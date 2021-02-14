const { avatarURL, defaultAvatarURL } = require('../constants/Endpoints');

class User {
  constructor(data) {
    this.id = data.id;
    this.avatar = data.avatar;
    this.discriminator = data.discriminator;
    this.username = data.username;
  }

  get avatarURL() {
    return this.avatar ? avatarURL(this.id, this.avatar) : this.defaultAvatarURL;
  }

  get defaultAvatarURL() {
    return defaultAvatarURL(this.discriminator);
  }
}

module.exports = User;

import { avatarURL, defaultAvatarURL } from '../constants/Endpoints.js';

class User {
  constructor(data) {
    this.id = data.id;
    this.avatar = data.avatar;
    this.discriminator = data.discriminator;
    this.username = data.username;
  }

  get tag() {
    return this.discriminator && this.discriminator !== '0'
      ? `${this.username}#${this.discriminator}`
      : this.username;
  }

  get avatarURL() {
    return this.avatar ? avatarURL(this.id, this.avatar) : this.defaultAvatarURL;
  }

  get defaultAvatarURL() {
    return defaultAvatarURL(this.discriminator);
  }
}

export default User;

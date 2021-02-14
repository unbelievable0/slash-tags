const API_URL = 'https://discord.com/api';
const CDN_URL = 'https://cdn.discordapp.com';
const API_VERSION = 8;

const avatarURL = (userID, hash) => {
  const format = hash.startsWith('a_') ? 'gif' : 'png';
  return `${CDN_URL}/avatars/${userID}/${hash}.${format}`;
};

const defaultAvatarURL = (discriminator) => {
  return `${CDN_URL}/embed/avatars/${discriminator}.png`;
};

module.exports = {
  API_URL,
  CDN_URL,
  API_VERSION,

  avatarURL,
  defaultAvatarURL,
};

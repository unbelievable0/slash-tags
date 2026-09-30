export const API_URL = 'https://discord.com/api';
export const CDN_URL = 'https://cdn.discordapp.com';
export const API_VERSION = 10;

export function avatarURL(userID, hash) {
  const format = hash.startsWith('a_') ? 'gif' : 'png';
  return `${CDN_URL}/avatars/${userID}/${hash}.${format}`;
}

export function defaultAvatarURL(discriminator) {
  const index = discriminator ? (parseInt(discriminator, 10) % 5 || 0) : 0;
  return `${CDN_URL}/embed/avatars/${index}.png`;
}

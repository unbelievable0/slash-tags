//  @formatter:off
const bitFlag = (value) =>  BigInt(1) << BigInt(value);

module.exports = {
  createInstantInvite:     bitFlag(0),
  kickMembers:             bitFlag(1),
  banMembers:              bitFlag(2),
  administrator:           bitFlag(3),
  manageChannels:          bitFlag(4),
  manageGuild:             bitFlag(5),
  addReactions:            bitFlag(6),
  viewAuditLog:            bitFlag(7),
  prioritySpeaker:         bitFlag(8),
  stream:                  bitFlag(9),
  viewChannel:             bitFlag(10),
  sendMessages:            bitFlag(11),
  sendTTSMessages:         bitFlag(12),
  manageMessages:          bitFlag(13),
  embedLinks:              bitFlag(14),
  attachFiles:             bitFlag(15),
  readMessageHistory:      bitFlag(16),
  mentionEveryone:         bitFlag(17),
  useExternalEmojis:       bitFlag(18),
  viewGuildInsights:       bitFlag(19),
  connect:                 bitFlag(20),
  speak:                   bitFlag(21),
  muteMembers:             bitFlag(22),
  deafenMembers:           bitFlag(23),
  moveMembers:             bitFlag(24),
  useVAD:                  bitFlag(25),
  changeNickname:          bitFlag(26),
  manageNicknames:         bitFlag(27),
  manageRoles:             bitFlag(28),
  manageWebhooks:          bitFlag(29),
  manageEmojis:            bitFlag(30),
  useSlashCommands:        bitFlag(31),
};

module.exports.PermissionFlags = {
  createInstantInvite: 'Create instant invite',
  kickMembers: 'Kick members',
  banMembers: 'Ban members',
  administrator: 'Administrator',
  manageChannels: 'Manage channels',
  manageGuild: 'Manage server',
  addReactions: 'Add reactions',
  viewAuditLog: 'View audit log',
  prioritySpeaker: 'Priority speaker',
  stream: 'Go live',
  viewChannel: 'Read text channels and see voice channels',
  sendMessages: 'Send messages',
  sendTTSMessages: 'Send TTS messages',
  manageMessages: 'Manage messages',
  embedLinks: 'Embed links',
  attachFiles: 'Attach files',
  readMessageHistory: 'Read message history',
  mentionEveryone: 'Mention everyone',
  useExternalEmojis: 'Use external emojis',
  viewGuildInsights: 'View server analytics',
  connect: 'Connect',
  speak: 'Speak',
  muteMembers: 'Mute members',
  deafenMembers: 'Deafen members',
  moveMembers: 'Move members',
  useVAD: 'Use voice activity',
  changeNickname: 'Change nickname',
  manageNicknames: 'Manage nicknames',
  manageRoles: 'Manage roles',
  manageWebhooks: 'Manage webhooks',
  manageEmojis: 'Manage emojis',
  useSlashCommands: 'Use slash commands',
}

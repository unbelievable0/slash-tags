import test from 'node:test';
import assert from 'node:assert/strict';
import ApplicationCommand from '../src/structures/ApplicationCommand.js';
import ApplicationCommandOption from '../src/structures/ApplicationCommandOption.js';
import Interaction from '../src/structures/Interaction.js';
import InteractionResponse from '../src/structures/InteractionResponse.js';
import InteractionEmbedResponse from '../src/structures/InteractionEmbedResponse.js';
import Member from '../src/structures/Member.js';
import User from '../src/structures/User.js';
import Permission from '../src/structures/Permission.js';
import { InteractionResponseType, InteractionType, ApplicationCommandOptionType } from '../src/constants/Types.js';

test('User initializes and returns correct avatar URL and tag', () => {
  const userWithAvatar = new User({
    id: '123456789',
    username: 'testuser',
    discriminator: '0001',
    avatar: 'abcdef123456'
  });
  assert.equal(userWithAvatar.id, '123456789');
  assert.equal(userWithAvatar.username, 'testuser');
  assert.equal(userWithAvatar.tag, 'testuser#0001');
  assert.equal(userWithAvatar.avatarURL, 'https://cdn.discordapp.com/avatars/123456789/abcdef123456.png');

  const userDefaultAvatar = new User({
    id: '123456789',
    username: 'testuser',
    discriminator: '0005',
    avatar: null
  });
  assert.equal(userDefaultAvatar.avatarURL, 'https://cdn.discordapp.com/embed/avatars/0.png');
});

test('Member initializes with permissions and user', () => {
  const member = new Member({
    permissions: '8', // ADMINISTRATOR
    user: {
      id: '123456',
      username: 'admin',
      discriminator: '0'
    }
  });

  assert.ok(member.permissions instanceof Permission);
  assert.ok(member.permissions.has('ADMINISTRATOR'));
  assert.equal(member.permissions.has('administrator'), true);
  assert.equal(member.permissions.has('banMembers'), true); // admin has all
});

test('Permission checks bitmasks accurately without administrator', () => {
  const perm = new Permission('4'); // BAN_MEMBERS (bit 2 = 4)
  assert.equal(perm.has('banMembers'), true);
  assert.equal(perm.has('BAN_MEMBERS'), true);
  assert.equal(perm.has('kickMembers'), false);
  assert.deepEqual(perm.missing(['banMembers', 'kickMembers']), ['kickMembers']);
});

test('Permission.resolve resolves strings, numbers, BigInts, arrays, and flags', () => {
  assert.equal(Permission.resolve('manageMessages'), 8192n);
  assert.equal(Permission.resolve('MANAGE_MESSAGES'), 8192n);
  assert.equal(Permission.resolve(8192n), 8192n);
  assert.equal(Permission.resolve(8192), 8192n);
  assert.equal(Permission.resolve('8192'), 8192n);
  assert.equal(Permission.resolve(['manageMessages', 'kickMembers']), 8194n);
  assert.equal(Permission.resolve('unknownPermission'), 0n);
});

test('ApplicationCommand and ApplicationCommandOption resolve commandName and args', () => {
  const cmd = new ApplicationCommand({
    id: '123456',
    name: 'tag',
    options: [
      {
        name: 'get',
        type: ApplicationCommandOptionType.SubCommand,
        options: [
          {
            name: 'name',
            type: ApplicationCommandOptionType.String,
            value: 'my-tag'
          }
        ]
      }
    ]
  });

  assert.equal(cmd.name, 'tag');
  assert.equal(cmd.commandName, 'tag/get');
  assert.deepEqual(cmd.args, ['my-tag']);
});

test('Interaction parses member and payload correctly', () => {
  const rawInteraction = {
    id: 'int_1',
    token: 'tok_1',
    type: InteractionType.ApplicationCommand,
    guild_id: 'guild_123',
    channel_id: 'chan_456',
    data: {
      id: 'cmd_1',
      name: 'tag',
      options: []
    },
    member: {
      permissions: '8',
      user: { id: 'u1', username: 'john' }
    }
  };

  const interaction = new Interaction(rawInteraction);
  assert.equal(interaction.type, InteractionType.ApplicationCommand);
  assert.equal(interaction.guildID, 'guild_123');
  assert.equal(interaction.channelID, 'chan_456');
  assert.equal(interaction.member.user.username, 'john');
});

test('InteractionResponse and InteractionEmbedResponse format JSON correctly', () => {
  const res = new InteractionResponse({
    type: InteractionResponseType.ChannelMessageWithSource,
    content: 'hello'
  });
  const json = res.toJSON();
  assert.equal(json.type, InteractionResponseType.ChannelMessageWithSource);
  assert.equal(json.type, 4);
  assert.equal(json.data.content, 'hello');

  const ephemeralRes = new InteractionResponse()
    .setContent('error message')
    .setEphemeral();
  const ephemeralJson = ephemeralRes.toJSON();
  assert.equal(ephemeralJson.type, 4);
  assert.equal(ephemeralJson.data.flags, 64);
  assert.equal(ephemeralJson.data.content, 'error message');

  const embedRes = new InteractionEmbedResponse()
    .setTitle('Embed Title')
    .setDescription('Embed Desc')
    .setColor('Blurple')
    .addField('Field 1', 'Value 1', true);

  const embedJson = embedRes.toJSON();
  assert.equal(embedJson.type, 4);
  assert.equal(embedJson.data.embeds[0].title, 'Embed Title');
  assert.equal(embedJson.data.embeds[0].description, 'Embed Desc');
  assert.equal(embedJson.data.embeds[0].color, 5793266);
  assert.deepEqual(embedJson.data.embeds[0].fields, [{ name: 'Field 1', value: 'Value 1', inline: true }]);
});

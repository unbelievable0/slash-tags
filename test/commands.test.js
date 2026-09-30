import test from 'node:test';
import assert from 'node:assert/strict';
import Client from '../src/framework/Client.js';
import BaseCommand from '../src/framework/Command.js';
import CreateCommand from '../src/commands/tag/create.js';
import DeleteCommand from '../src/commands/tag/delete.js';
import EditCommand from '../src/commands/tag/edit.js';
import RawCommand from '../src/commands/tag/raw.js';
import ImportCommand from '../src/commands/tag/import.js';

function createMockKV() {
  const store = new Map();
  return {
    async get(key) {
      const item = store.get(key);
      return item ? item.value : null;
    },
    async put(key, value, options = {}) {
      store.set(key, { value, metadata: options.metadata || {} });
    },
    async delete(key) {
      store.delete(key);
    },
    async list({ prefix = '' } = {}) {
      const keys = [];
      for (const [k, v] of store.entries()) {
        if (k.startsWith(prefix)) {
          keys.push({ name: k, metadata: v.metadata });
        }
      }
      return { keys };
    }
  };
}

test('Tag commands lifecycle: create, raw, edit, delete', async () => {
  const mockKV = createMockKV();
  const createdDiscordCommands = [];
  const deletedDiscordCommands = [];

  const mockClient = new Client({
    APPLICATION_ID: 'app_123',
    GUILD_TAGS: mockKV
  });

  // Mock Discord REST API request handler
  mockClient.rest.request = async (method, path, options) => {
    if (method === 'post' && path.includes('/commands')) {
      const guildID = path.split('/')[3];
      createdDiscordCommands.push({ guildID, ...options.data });
      return { id: 'cmd_discord_1', ...options.data };
    }
    if (method === 'delete' && path.includes('/commands/')) {
      const parts = path.split('/');
      deletedDiscordCommands.push({ guildID: parts[3], commandID: parts[5] });
      return {};
    }
    return {};
  };

  const createCmd = new CreateCommand(mockClient);
  const rawCmd = new RawCommand(mockClient);
  const editCmd = new EditCommand(mockClient);
  const deleteCmd = new DeleteCommand(mockClient);

  // 1. Create tag
  const createRes = await createCmd.run({
    guildID: 'guild_1',
    args: ['rules', 'Server Rules', 'Rule 1: Be polite\nRule 2: Have fun']
  });
  assert.ok(createRes.toJSON().data.embeds[0].description.includes('added'));
  assert.equal(createdDiscordCommands.length, 1);
  assert.equal(createdDiscordCommands[0].name, 'rules');

  // Duplicate create fails
  const dupeRes = await createCmd.run({
    guildID: 'guild_1',
    args: ['rules', 'Server Rules', 'Duplicate']
  });
  assert.ok(dupeRes.toJSON().data.embeds[0].description.includes('already exists'));

  // 2. Raw tag
  const rawRes = await rawCmd.run({
    guildID: 'guild_1',
    args: ['rules']
  });
  assert.ok(rawRes.toJSON().data.content.includes('Rule 1: Be polite'));

  // 3. Edit tag
  const editRes = await editCmd.run({
    guildID: 'guild_1',
    args: ['rules', 'Rule 1: Updated rules']
  });
  assert.ok(editRes.toJSON().data.embeds[0].description.includes('updated'));

  // Check raw again after edit
  const rawUpdated = await rawCmd.run({
    guildID: 'guild_1',
    args: ['rules']
  });
  assert.ok(rawUpdated.toJSON().data.content.includes('Updated rules'));

  // 4. Delete tag
  const deleteRes = await deleteCmd.run({
    guildID: 'guild_1',
    args: ['rules']
  });
  assert.ok(deleteRes.toJSON().data.embeds[0].description.includes('deleted'));
  assert.equal(deletedDiscordCommands.length, 1);
  assert.equal(deletedDiscordCommands[0].commandID, 'cmd_discord_1');

  // Raw non-existent tag
  const keyAfterDelete = await mockClient.modules.tagManagement.getTagKeyFromName('guild_1', 'rules');
  assert.equal(keyAfterDelete, undefined);
});

test('Tag import command: creates missing tags, updates existing tags, and does not delete tags using bulk overwrite', async () => {
  const mockKV = createMockKV();
  const putCalls = [];
  const postCalls = [];
  const patchCalls = [];
  const deletedDiscordCommands = [];

  const discordCommandsStore = new Map();
  // Seed source guild commands in Discord
  discordCommandsStore.set('source_guild', [
    { id: 'cmd_src_shared', name: 'shared_tag', description: 'Updated Shared Description' },
    { id: 'cmd_src_new', name: 'new_tag', description: 'New Tag Description' }
  ]);
  // Seed target guild commands in Discord
  discordCommandsStore.set('target_guild', [
    { id: 'cmd_tgt_shared', name: 'shared_tag', description: 'Old Shared Description' },
    { id: 'cmd_tgt_keep', name: 'keep_tag', description: 'Tag to keep' }
  ]);

  // Seed source guild tag contents in KV
  await mockKV.put('source_guild:cmd_src_shared', 'Shared Tag Content From Source', {
    metadata: { name: 'shared_tag' }
  });
  await mockKV.put('source_guild:cmd_src_new', 'New Tag Content From Source', {
    metadata: { name: 'new_tag' }
  });

  // Seed target guild tag contents in KV
  await mockKV.put('target_guild:cmd_tgt_shared', 'Old Shared Content in Target', {
    metadata: { name: 'shared_tag' }
  });
  await mockKV.put('target_guild:cmd_tgt_keep', 'Keep Tag Content in Target', {
    metadata: { name: 'keep_tag' }
  });

  const mockClient = new Client({
    APPLICATION_ID: 'app_123',
    GUILD_TAGS: mockKV
  });

  let nextCmdId = 100;
  mockClient.rest.request = async (method, path, options) => {
    // GET /applications/{appId}/guilds/{guildId}/commands
    if (method === 'get' && path.includes('/commands')) {
      const guildID = path.split('/')[3];
      return discordCommandsStore.get(guildID) || [];
    }
    // PUT /applications/{appId}/guilds/{guildId}/commands
    if (method === 'put' && path.includes('/commands')) {
      const guildID = path.split('/')[3];
      putCalls.push({ guildID, path, data: options.data });
      const result = (options.data || []).map(cmd => ({
        id: cmd.id || `cmd_created_${nextCmdId++}`,
        ...cmd
      }));
      discordCommandsStore.set(guildID, result);
      return result;
    }
    // POST /applications/{appId}/guilds/{guildId}/commands
    if (method === 'post' && path.includes('/commands')) {
      const guildID = path.split('/')[3];
      postCalls.push({ guildID, ...options.data });
      const newCmd = { id: `cmd_created_${nextCmdId++}`, ...options.data };
      const current = discordCommandsStore.get(guildID) || [];
      current.push(newCmd);
      discordCommandsStore.set(guildID, current);
      return newCmd;
    }
    // PATCH /applications/{appId}/guilds/{guildId}/commands/{commandId}
    if (method === 'patch' && path.includes('/commands/')) {
      const parts = path.split('/');
      const guildID = parts[3];
      const commandID = parts[5];
      patchCalls.push({ guildID, commandID, ...options.data });
      return { id: commandID, ...options.data };
    }
    // DELETE /applications/{appId}/guilds/{guildId}/commands/{commandId}
    if (method === 'delete' && path.includes('/commands/')) {
      const parts = path.split('/');
      deletedDiscordCommands.push({ guildID: parts[3], commandID: parts[5] });
      return {};
    }
    return {};
  };

  const importCmd = new ImportCommand(mockClient);
  const rawCmd = new RawCommand(mockClient);

  // Run import from source_guild into target_guild
  const res = await importCmd.run({
    guildID: 'target_guild',
    args: ['source_guild']
  });

  const resJson = res.toJSON ? res.toJSON() : res;
  assert.ok(resJson.data.embeds[0].description.includes('imported 2 tags'));

  // Verify bulk overwrite PUT was called once and no individual POST or PATCH was called
  assert.equal(putCalls.length, 1);
  assert.equal(putCalls[0].guildID, 'target_guild');
  assert.equal(putCalls[0].path, 'applications/app_123/guilds/target_guild/commands');
  assert.equal(postCalls.length, 0, 'Should not use individual POST requests');
  assert.equal(patchCalls.length, 0, 'Should not use individual PATCH requests');

  // Verify payload sent to PUT
  const putData = putCalls[0].data;
  assert.equal(putData.length, 3);
  assert.deepEqual(putData.find(c => c.name === 'shared_tag'), {
    id: 'cmd_tgt_shared',
    name: 'shared_tag',
    description: 'Updated Shared Description'
  });
  assert.deepEqual(putData.find(c => c.name === 'keep_tag'), {
    id: 'cmd_tgt_keep',
    name: 'keep_tag',
    description: 'Tag to keep'
  });
  assert.deepEqual(putData.find(c => c.name === 'new_tag'), {
    name: 'new_tag',
    description: 'New Tag Description'
  });

  // 1. Check that new_tag was created in target_guild
  const newTagKey = await mockClient.modules.tagManagement.getTagKeyFromName('target_guild', 'new_tag');
  assert.ok(newTagKey, 'new_tag should exist in target_guild');
  const newTagRaw = await rawCmd.run({
    guildID: 'target_guild',
    args: ['new_tag']
  });
  assert.ok(newTagRaw.toJSON().data.content.includes('New Tag Content From Source'));

  // 2. Check that shared_tag was updated in target_guild
  const sharedTagRaw = await rawCmd.run({
    guildID: 'target_guild',
    args: ['shared_tag']
  });
  assert.ok(sharedTagRaw.toJSON().data.content.includes('Shared Tag Content From Source'));

  // 3. Check that keep_tag was NOT deleted in target_guild
  const keepTagRaw = await rawCmd.run({
    guildID: 'target_guild',
    args: ['keep_tag']
  });
  assert.ok(keepTagRaw.toJSON().data.content.includes('Keep Tag Content in Target'));
  assert.equal(deletedDiscordCommands.length, 0, 'No tags should be deleted during import');
});

test('TagManagement bulkOverwriteGuildCommands performs PUT to guild commands endpoint', async () => {
  let captured = null;
  const mockClient = new Client({
    APPLICATION_ID: 'app_123'
  });
  mockClient.rest.request = async (method, path, options) => {
    captured = { method, path, options };
    return [{ id: 'cmd_1', name: 'tag1' }];
  };

  const res = await mockClient.modules.tagManagement.bulkOverwriteGuildCommands('guild_xyz', [
    { name: 'tag1', description: 'desc1' }
  ]);

  assert.deepEqual(res, [{ id: 'cmd_1', name: 'tag1' }]);
  assert.equal(captured.method, 'put');
  assert.equal(captured.path, 'applications/app_123/guilds/guild_xyz/commands');
  assert.deepEqual(captured.options.data, [{ name: 'tag1', description: 'desc1' }]);
});

test('Tag import command: handles empty source guild gracefully and returns 0', async () => {
  const mockKV = createMockKV();
  let putCalled = false;
  const mockClient = new Client({
    APPLICATION_ID: 'app_123',
    GUILD_TAGS: mockKV
  });
  mockClient.rest.request = async (method) => {
    if (method === 'get') return [];
    if (method === 'put') putCalled = true;
    return [];
  };

  const importCmd = new ImportCommand(mockClient);
  const res = await importCmd.run({
    guildID: 'target_guild',
    args: ['empty_source_guild']
  });

  const resJson = res.toJSON ? res.toJSON() : res;
  assert.ok(resJson.data.embeds[0].description.includes('imported 0 tags'));
  assert.equal(putCalled, false, 'PUT should not be called if source has no commands');
});

test('Tag import command: validates guild_id argument', async () => {
  const mockClient = new Client();
  const importCmd = new ImportCommand(mockClient);
  const res = await importCmd.run({
    guildID: 'target_guild',
    args: []
  });

  const resJson = res.toJSON ? res.toJSON() : res;
  assert.ok(resJson.data.embeds[0].description.includes('valid guild ID'));
});

test('TagManagement createTag creates Discord command and KV entry', async () => {
  const mockKV = createMockKV();
  const createdDiscordCommands = [];

  const mockClient = new Client({
    APPLICATION_ID: 'app_123',
    GUILD_TAGS: mockKV
  });

  mockClient.rest.request = async (method, path, options) => {
    if (method === 'post' && path.includes('/commands')) {
      const guildID = path.split('/')[3];
      createdDiscordCommands.push({ guildID, ...options.data });
      return { id: 'cmd_created_123', ...options.data };
    }
    return {};
  };

  const created = await mockClient.modules.tagManagement.createTag(
    'guild_abc',
    'my_tag',
    'My Description',
    'Line 1\\nLine 2'
  );

  assert.equal(created.id, 'cmd_created_123');
  assert.equal(createdDiscordCommands.length, 1);
  assert.equal(createdDiscordCommands[0].name, 'my_tag');
  assert.equal(createdDiscordCommands[0].description, 'My Description');

  const key = await mockClient.modules.tagManagement.getTagKeyFromName('guild_abc', 'my_tag');
  assert.equal(key, 'guild_abc:cmd_created_123');

  const content = await mockClient.modules.tagManagement.getTagKV(key);
  assert.equal(content, 'Line 1\nLine 2');
});

test('Command properly sets and serializes default_member_permissions', () => {
  const mockClient = new Client();
  const Command = BaseCommand;

  const cmdWithPermissions = new Command(mockClient, {
    name: 'test_cmd',
    description: 'A test command',
    default_member_permissions: '8192'
  });
  assert.equal(cmdWithPermissions.default_member_permissions, '8192');
  assert.equal(cmdWithPermissions.toJSON().default_member_permissions, '8192');

  const cmdWithAdminOnly = new Command(mockClient, {
    name: 'admin_only',
    description: 'Admin command',
    default_member_permissions: '0'
  });
  assert.equal(cmdWithAdminOnly.default_member_permissions, '0');
  assert.equal(cmdWithAdminOnly.toJSON().default_member_permissions, '0');

  const cmdWithoutPermissions = new Command(mockClient, {
    name: 'no_perms',
    description: 'Public command'
  });
  assert.equal(cmdWithoutPermissions.default_member_permissions, undefined);
  assert.equal(cmdWithoutPermissions.toJSON().default_member_permissions, undefined);
});

test('CommandStore commandList includes default_member_permissions for /tag command', async () => {
  const mockClient = new Client();
  // Wait a tick for dynamic imports in CommandStore constructor if any
  await new Promise(resolve => setTimeout(resolve, 50));

  const commandList = mockClient.commandStore.commandList();
  const tagCmd = commandList.find(c => c.name === 'tag');

  assert.ok(tagCmd, 'tag command should be registered');
  assert.equal(tagCmd.name, 'tag');
  assert.equal(tagCmd.default_member_permissions, '8192');
  assert.ok(Array.isArray(tagCmd.options));
  assert.equal(tagCmd.options.length, 5);

  // Subcommands should not have default_member_permissions
  for (const option of tagCmd.options) {
    assert.equal(option.default_member_permissions, undefined);
  }
});

test('Dispatcher dispatches commands directly without manual in-app permission checks and defers /tag command', async () => {
  const mockKV = createMockKV();
  const patchedMessages = [];
  const mockClient = new Client({
    APPLICATION_ID: 'app_123',
    GUILD_TAGS: mockKV
  });
  mockClient.rest.request = async (method, path, options) => {
    if (method.toLowerCase() === 'patch' && path.includes('/messages/@original')) {
      patchedMessages.push({ path, data: options.data });
      return { ok: true };
    }
    return {};
  };
  await new Promise(resolve => setTimeout(resolve, 50));

  const interactionData = {
    id: 'int_1',
    token: 'tok_1',
    type: 2,
    guild_id: 'guild_1',
    data: {
      id: 'cmd_tag',
      name: 'tag',
      options: [
        {
          name: 'raw',
          type: 1,
          options: [{ name: 'name', type: 3, value: 'nonexistent' }]
        }
      ]
    },
    member: {
      permissions: '0', // No permissions at all
      user: { id: 'u1', username: 'standard_user' }
    }
  };

  let waitedPromise = null;
  const ctx = {
    waitUntil(promise) {
      waitedPromise = promise;
    }
  };

  const response = await mockClient.dispatcher.onInteractionReceived(interactionData, ctx);
  assert.equal(response.type, 5); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE

  assert.ok(waitedPromise, 'ctx.waitUntil was called');
  await waitedPromise;

  assert.equal(patchedMessages.length, 1);
  assert.equal(patchedMessages[0].path, 'webhooks/app_123/tok_1/messages/@original');
  assert.equal(patchedMessages[0].data.content, '```\nnull```');
});

test('Dispatcher deferred /tag handles errors and patches original message with error', async () => {
  const mockKV = createMockKV();
  const patchedMessages = [];
  const mockClient = new Client({
    APPLICATION_ID: 'app_123',
    GUILD_TAGS: mockKV
  });
  mockClient.rest.request = async (method, path, options) => {
    if (method.toLowerCase() === 'patch' && path.includes('/messages/@original')) {
      patchedMessages.push({ path, data: options.data });
      return { ok: true };
    }
    return {};
  };
  await new Promise(resolve => setTimeout(resolve, 50));

  const interactionData = {
    id: 'int_1',
    token: 'tok_1',
    type: 2,
    guild_id: 'guild_1',
    data: {
      id: 'cmd_tag',
      name: 'tag',
      options: [
        {
          name: 'delete',
          type: 1,
          options: [{ name: 'name', type: 3, value: 'unknown_tag' }]
        }
      ]
    },
    member: {
      permissions: '8192',
      user: { id: 'u1', username: 'admin' }
    }
  };

  let waitedPromise = null;
  const ctx = {
    waitUntil(promise) {
      waitedPromise = promise;
    }
  };

  const response = await mockClient.dispatcher.onInteractionReceived(interactionData, ctx);
  assert.equal(response.type, 5); // Deferred upfront

  assert.ok(waitedPromise);
  await waitedPromise;

  assert.equal(patchedMessages.length, 1);
  assert.equal(patchedMessages[0].path, 'webhooks/app_123/tok_1/messages/@original');
  assert.match(patchedMessages[0].data.content, /Unknown tag\./);
});

test('Dispatcher does not defer custom tags (guild commands)', async () => {
  const mockKV = createMockKV();
  await mockKV.put('guild_1:cmd_custom_1', 'Hello custom tag!');

  const mockClient = new Client({
    APPLICATION_ID: 'app_123',
    GUILD_TAGS: mockKV
  });
  await new Promise(resolve => setTimeout(resolve, 50));

  const interactionData = {
    id: 'int_1',
    token: 'tok_1',
    type: 2,
    guild_id: 'guild_1',
    data: {
      id: 'cmd_custom_1',
      name: 'customtag',
      options: []
    },
    member: {
      permissions: '0',
      user: { id: 'u1', username: 'user' }
    }
  };

  let waitUntilCalled = false;
  const ctx = {
    waitUntil() {
      waitUntilCalled = true;
    }
  };

  const response = await mockClient.dispatcher.onInteractionReceived(interactionData, ctx);
  assert.equal(waitUntilCalled, false);
  const json = response.toJSON ? response.toJSON() : response;
  assert.equal(json.type, 4); // Immediate CHANNEL_MESSAGE_WITH_SOURCE
  assert.equal(json.data.content, 'Hello custom tag!');
});

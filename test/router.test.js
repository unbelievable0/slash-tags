import test from 'node:test';
import assert from 'node:assert/strict';
import APIRouter from '../src/router/APIRouter.js';
import APIResponse from '../src/router/APIResponse.js';
import { InteractionType, InteractionResponseType } from '../src/constants/Types.js';

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

test('APIRouter returns 404 for unknown routes', async () => {
  const router = new APIRouter();
  const req = new Request('https://worker.test/unknown-route', { method: 'GET' });
  const res = new APIResponse();

  const response = await router.route(req, res);
  assert.equal(response.status, 404);
  const data = await response.json();
  assert.equal(data.error, 'Not Found');
});

test('APIRouter responds to Ping interaction when authorized', async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' },
    true,
    ['sign', 'verify']
  ).catch(async () => {
    return await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );
  });

  const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyHex = Buffer.from(rawPublicKey).toString('hex');

  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify({ type: InteractionType.Ping });

  const signatureData = new TextEncoder().encode(timestamp + body);
  const signature = await crypto.subtle.sign(
    keyPair.privateKey.algorithm.name,
    keyPair.privateKey,
    signatureData
  );
  const signatureHex = Buffer.from(signature).toString('hex');

  const router = new APIRouter({ PUBLIC_KEY: publicKeyHex });
  const req = new Request('https://worker.test/', {
    method: 'POST',
    headers: {
      'x-signature-ed25519': signatureHex,
      'x-signature-timestamp': timestamp,
      'content-type': 'application/json'
    },
    body
  });
  const res = new APIResponse();

  const response = await router.route(req, res);
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.deepEqual(json, { type: InteractionResponseType.Pong });
});

test('APIRouter executes custom tag interaction', async () => {
  const mockKV = createMockKV();
  await mockKV.put('guild_123:cmd_tag_1', 'Hello from custom tag!', { metadata: { name: 'greet' } });

  const env = {
    APPLICATION_ID: 'app_123',
    GUILD_TAGS: mockKV
  };

  const router = new APIRouter(env);

  // Directly test dispatcher for tag invocation
  const interactionData = {
    id: 'int_1',
    token: 'tok_1',
    type: InteractionType.ApplicationCommand,
    guild_id: 'guild_123',
    data: {
      id: 'cmd_tag_1',
      name: 'greet',
      options: []
    },
    member: {
      permissions: '8',
      user: { id: 'u1', username: 'tester' }
    }
  };

  const result = await router.client.dispatcher.onInteractionReceived(interactionData);
  const json = result.toJSON ? result.toJSON() : result;

  assert.equal(json.data.content, 'Hello from custom tag!');
});

test('APIRouter handles error in dispatcher with valid Discord response type 4', async () => {
  const router = new APIRouter();
  const userErrorRes = router.client.dispatcher.handleError({ name: 'UserError', message: 'Invalid argument provided' });
  const userJson = userErrorRes.toJSON();
  assert.equal(userJson.type, 4);
  assert.equal(userJson.data.flags, 64);
  assert.match(userJson.data.content, /Invalid argument provided/);

  const unexpectedErrorRes = router.client.dispatcher.handleError(new Error('Network error'));
  const unexpectedJson = unexpectedErrorRes.toJSON();
  assert.equal(unexpectedJson.type, 4);
  assert.equal(unexpectedJson.data.flags, 64);
  assert.match(unexpectedJson.data.content, /An unexpected error occurred/);
});

test('APIRouter handles requests on subpaths (e.g. /slash-tags-dev tunnel route)', async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' },
    true,
    ['sign', 'verify']
  ).catch(async () => {
    return await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );
  });

  const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyHex = Buffer.from(rawPublicKey).toString('hex');

  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify({ type: InteractionType.Ping });

  const signatureData = new TextEncoder().encode(timestamp + body);
  const signature = await crypto.subtle.sign(
    keyPair.privateKey.algorithm.name,
    keyPair.privateKey,
    signatureData
  );
  const signatureHex = Buffer.from(signature).toString('hex');

  const router = new APIRouter({ PUBLIC_KEY: publicKeyHex });

  // Test POST /slash-tags-dev
  const postReq = new Request('https://worker.test/slash-tags-dev', {
    method: 'POST',
    headers: {
      'x-signature-ed25519': signatureHex,
      'x-signature-timestamp': timestamp,
      'content-type': 'application/json'
    },
    body
  });
  const postRes = new APIResponse();
  const postResponse = await router.route(postReq, postRes);
  assert.equal(postResponse.status, 200);
  const postJson = await postResponse.json();
  assert.deepEqual(postJson, { type: InteractionResponseType.Pong });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';

test('Worker fetch handles 404 for unknown endpoint', async () => {
  const req = new Request('https://worker.test/nonexistent', { method: 'GET' });
  const env = {
    APPLICATION_ID: 'app_123',
    PUBLIC_KEY: 'abc'
  };

  const res = await worker.fetch(req, env, {});
  assert.equal(res.status, 404);
  const json = await res.json();
  assert.equal(json.error, 'Not Found');
});

test('Worker fetch handles invalid signature authorization', async () => {
  const req = new Request('https://worker.test/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ type: 1 })
  });
  const env = {
    APPLICATION_ID: 'app_123',
    PUBLIC_KEY: 'abc'
  };

  const res = await worker.fetch(req, env, {});
  assert.equal(res.status, 401);
  const json = await res.json();
  assert.equal(json.error, 'Unauthorized');
});

test('Worker fetch logs request details and response body', async () => {
  const originalLog = global.log;
  const logs = [];
  global.log = (...args) => {
    logs.push(args);
  };

  try {
    const req = new Request('https://worker.test/test-path', { method: 'GET' });
    const res = await worker.fetch(req, {}, {});
    assert.equal(res.status, 404);
    const json = await res.json();
    assert.equal(json.error, 'Not Found');

    assert.equal(logs.length, 2);
    assert.deepEqual(logs[0], ['Request received:', 'GET', 'https://worker.test/test-path']);
    assert.deepEqual(logs[1], ['Response body:', { error: 'Not Found' }]);
  } finally {
    global.log = originalLog;
  }
});

test('Worker fetch defers /tag command and passes promise to ctx.waitUntil', async () => {
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

  const interactionData = {
    id: 'int_fetch_1',
    token: 'tok_fetch_1',
    type: 2,
    guild_id: 'guild_1',
    data: {
      id: 'cmd_tag',
      name: 'tag',
      options: [
        {
          name: 'raw',
          type: 1,
          options: [{ name: 'name', type: 3, value: 'welcome' }]
        }
      ]
    },
    member: {
      permissions: '8192',
      user: { id: 'u1', username: 'admin' }
    }
  };

  const body = JSON.stringify(interactionData);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signatureData = new TextEncoder().encode(timestamp + body);
  const signature = await crypto.subtle.sign(
    keyPair.privateKey.algorithm.name,
    keyPair.privateKey,
    signatureData
  );
  const signatureHex = Buffer.from(signature).toString('hex');

  const req = new Request('https://worker.test/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-signature-ed25519': signatureHex,
      'x-signature-timestamp': timestamp
    },
    body
  });

  const store = new Map();
  store.set('guild_1:welcome', { value: 'Welcome to server!', metadata: { name: 'welcome' } });

  const env = {
    APPLICATION_ID: 'app_123',
    PUBLIC_KEY: publicKeyHex,
    GUILD_TAGS: {
      async get(key) { return store.get(key)?.value || null; },
      async put(key, value, opt = {}) { store.set(key, { value, metadata: opt.metadata || {} }); },
      async delete(key) { store.delete(key); },
      async list({ prefix = '' } = {}) {
        const keys = [];
        for (const [k, v] of store.entries()) {
          if (k.startsWith(prefix)) keys.push({ name: k, metadata: v.metadata });
        }
        return { keys };
      }
    }
  };

  let waitedPromise = null;
  const ctx = {
    waitUntil(promise) {
      waitedPromise = promise;
    }
  };

  const originalFetch = global.fetch;
  const outboundRequests = [];
  global.fetch = async (url, options) => {
    outboundRequests.push({ url: url.toString(), options });
    return new Response(JSON.stringify({ id: 'msg_1' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  try {
    const res = await worker.fetch(req, env, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.type, 5); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    assert.ok(waitedPromise, 'ctx.waitUntil was provided with the background execution promise');

    await waitedPromise;
    assert.equal(outboundRequests.length, 1);
    assert.ok(outboundRequests[0].url.includes('/webhooks/app_123/tok_fetch_1/messages/@original'));
    assert.equal(outboundRequests[0].options.method, 'PATCH');
    const patchedData = JSON.parse(outboundRequests[0].options.body);
    assert.equal(patchedData.content, '```\nWelcome to server!```');
  } finally {
    global.fetch = originalFetch;
  }
});

test('Worker fetch does not defer custom tag commands', async () => {
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

  const interactionData = {
    id: 'int_fetch_2',
    token: 'tok_fetch_2',
    type: 2,
    guild_id: 'guild_1',
    data: {
      id: 'cmd_tag_id_123',
      name: 'help',
      options: []
    },
    member: {
      permissions: '0',
      user: { id: 'u1', username: 'user' }
    }
  };

  const body = JSON.stringify(interactionData);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signatureData = new TextEncoder().encode(timestamp + body);
  const signature = await crypto.subtle.sign(
    keyPair.privateKey.algorithm.name,
    keyPair.privateKey,
    signatureData
  );
  const signatureHex = Buffer.from(signature).toString('hex');

  const req = new Request('https://worker.test/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-signature-ed25519': signatureHex,
      'x-signature-timestamp': timestamp
    },
    body
  });

  const store = new Map();
  store.set('guild_1:cmd_tag_id_123', { value: 'Help content', metadata: { name: 'help' } });

  const env = {
    APPLICATION_ID: 'app_123',
    PUBLIC_KEY: publicKeyHex,
    GUILD_TAGS: {
      async get(key) { return store.get(key)?.value || null; },
      async put(key, value, opt = {}) { store.set(key, { value, metadata: opt.metadata || {} }); },
      async delete(key) { store.delete(key); },
      async list({ prefix = '' } = {}) {
        const keys = [];
        for (const [k, v] of store.entries()) {
          if (k.startsWith(prefix)) keys.push({ name: k, metadata: v.metadata });
        }
        return { keys };
      }
    }
  };

  let waitUntilCalled = false;
  const ctx = {
    waitUntil() {
      waitUntilCalled = true;
    }
  };

  const res = await worker.fetch(req, env, ctx);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.type, 4); // Immediate CHANNEL_MESSAGE_WITH_SOURCE
  assert.equal(json.data.content, 'Help content');
  assert.equal(waitUntilCalled, false);
});

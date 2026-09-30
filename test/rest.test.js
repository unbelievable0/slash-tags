import test from 'node:test';
import assert from 'node:assert/strict';
import DiscordAPIError from '../src/rest/DiscordAPIError.js';
import HTTPError from '../src/rest/HTTPError.js';
import RequestHandler from '../src/rest/RequestHandler.js';
import APIRequest from '../src/rest/APIRequest.js';
import routeBuilder from '../src/rest/routeBuilder.js';

test('DiscordAPIError flattens nested errors and formats message', () => {
  const rawError = {
    message: 'Invalid Form Body',
    code: 50035,
    errors: {
      name: {
        _errors: [{ code: 'STRING_TYPE_TOO_LONG', message: 'Must be 32 or fewer in length.' }]
      }
    }
  };

  const err = new DiscordAPIError('/applications/123/commands', rawError, 'POST', 400);
  assert.equal(err.name, 'DiscordAPIError');
  assert.equal(err.code, 50035);
  assert.equal(err.httpStatus, 400);
  assert.equal(err.method, 'POST');
  assert.ok(err.message.includes('Must be 32 or fewer in length.'));
});

test('HTTPError records status, method, and path', () => {
  const err = new HTTPError('Service Unavailable', 'HTTPError', 503, 'GET', '/guilds/123');
  assert.equal(err.name, 'HTTPError');
  assert.equal(err.code, 503);
  assert.equal(err.method, 'GET');
  assert.equal(err.path, '/guilds/123');
});

test('routeBuilder constructs nested endpoint URLs and invokes request', async () => {
  let captured = null;
  const mockManager = {
    request(method, path, options) {
      captured = { method, path, options };
      return Promise.resolve({ ok: true });
    }
  };

  const api = routeBuilder(mockManager);
  await api.applications('app_id').guilds('guild_id').commands('cmd_id').delete();

  assert.deepEqual(captured, {
    method: 'delete',
    path: 'applications/app_id/guilds/guild_id/commands/cmd_id',
    options: { data: undefined, query: undefined }
  });
});

test('RequestHandler builds correct URL with versioning', () => {
  const handler = new RequestHandler(null, {
    apiURL: 'https://discord.com/api',
    apiVersion: 10
  });

  assert.equal(handler.baseURL, 'https://discord.com/api/v10');
});

test('APIRequest does not set body or content-type for GET or HEAD requests', () => {
  const handler = new RequestHandler({ env: { BOT_TOKEN: 'test_token' } });
  
  const getReq = new APIRequest(handler, 'get', 'applications/123/guilds/456/commands', { data: { dummy: 'data' } });
  assert.equal(getReq.body, undefined);
  assert.equal(getReq.headers['Content-Type'], undefined);
  assert.equal(getReq.headers.Authorization, 'Bot test_token');

  const headReq = new APIRequest(handler, 'head', 'applications/123', {});
  assert.equal(headReq.body, undefined);
  assert.equal(headReq.headers['Content-Type'], undefined);
});

test('APIRequest sets body and content-type for POST/PATCH/PUT requests when data is present', () => {
  const handler = new RequestHandler({ env: { BOT_TOKEN: 'test_token' } });
  
  const postReq = new APIRequest(handler, 'post', 'applications/123/guilds/456/commands', { data: { name: 'tag_name' } });
  assert.equal(postReq.body, JSON.stringify({ name: 'tag_name' }));
  assert.equal(postReq.headers['Content-Type'], 'application/json');
});

test('APIRequest send performs fetch successfully without GET body error', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  let fetchedUrl = null;
  let fetchedOptions = null;

  globalThis.fetch = async (url, options) => {
    // Mimic real fetch behavior: verify that GET request does not have a body property passed as body content
    if ((options.method === 'GET' || options.method === 'HEAD') && options.body !== undefined) {
      throw new TypeError('Request with a GET or HEAD method cannot have a body.');
    }
    fetchedUrl = url;
    fetchedOptions = options;
    return new Response(JSON.stringify([{ id: '1', name: 'cmd' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const handler = new RequestHandler({ env: { BOT_TOKEN: 'test_token' } });
  const result = await handler.api.applications('app_id').guilds('guild_id').commands().get();

  assert.deepEqual(result, [{ id: '1', name: 'cmd' }]);
  assert.equal(fetchedOptions.method, 'GET');
  assert.equal(fetchedOptions.body, undefined);
});

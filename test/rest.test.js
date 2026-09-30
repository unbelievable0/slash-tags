import test from 'node:test';
import assert from 'node:assert/strict';
import DiscordAPIError from '../src/rest/DiscordAPIError.js';
import HTTPError from '../src/rest/HTTPError.js';
import RequestHandler from '../src/rest/RequestHandler.js';
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
    options: { data: {}, query: {} }
  });
});

test('RequestHandler builds correct URL with versioning', () => {
  const handler = new RequestHandler(null, {
    apiURL: 'https://discord.com/api',
    apiVersion: 10
  });

  assert.equal(handler.baseURL, 'https://discord.com/api/v10');
});

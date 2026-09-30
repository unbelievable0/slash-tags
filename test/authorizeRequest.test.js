import test from 'node:test';
import assert from 'node:assert/strict';
import authorizeRequest from '../src/router/authorizeRequest.js';

test('authorizeRequest returns false when headers are missing', async () => {
  const req = new Request('https://worker.test', {
    method: 'POST',
    body: JSON.stringify({ type: 1 })
  });

  const authorized = await authorizeRequest(req, 'dummy_key');
  assert.equal(authorized, false);
});

test('authorizeRequest correctly verifies Ed25519 signatures', async () => {
  // Generate an Ed25519 keypair using Web Crypto
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
  const body = JSON.stringify({ type: 1 });

  const signatureData = new TextEncoder().encode(timestamp + body);
  const signature = await crypto.subtle.sign(
    keyPair.privateKey.algorithm.name,
    keyPair.privateKey,
    signatureData
  );
  const signatureHex = Buffer.from(signature).toString('hex');

  const validReq = new Request('https://worker.test', {
    method: 'POST',
    headers: {
      'x-signature-ed25519': signatureHex,
      'x-signature-timestamp': timestamp
    },
    body
  });

  const isAuthorized = await authorizeRequest(validReq, publicKeyHex);
  assert.equal(isAuthorized, true);

  const invalidReq = new Request('https://worker.test', {
    method: 'POST',
    headers: {
      'x-signature-ed25519': signatureHex,
      'x-signature-timestamp': timestamp
    },
    body: JSON.stringify({ type: 2 }) // Changed body -> invalid signature
  });

  const isInvalidAuthorized = await authorizeRequest(invalidReq, publicKeyHex);
  assert.equal(isInvalidAuthorized, false);
});

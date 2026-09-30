const encoder = new TextEncoder();

/**
 * @param {any} req
 * @param {string} [key]
 * @returns {Promise<boolean>}
 */
export default async function authorizeRequest(req, key) {
  const signatureHex = req.headers?.get?.('X-Signature-Ed25519') || req.headers?.get?.('x-signature-ed25519');
  const timestamp = req.headers?.get?.('X-Signature-Timestamp') || req.headers?.get?.('x-signature-timestamp');
  const publicKeyHex = key || (typeof PUBLIC_KEY !== 'undefined' ? PUBLIC_KEY : null);

  if (!signatureHex || !timestamp || !publicKeyHex) {
    return false;
  }

  let rawBody = req.rawBody;
  if (typeof rawBody !== 'string') {
    if (typeof req.clone === 'function') {
      try {
        rawBody = await req.clone().text();
      } catch {
        rawBody = '';
      }
    } else {
      rawBody = '';
    }
  }

  try {
    const signature = hex2bin(signatureHex);
    const publicKey = await getPublicKey(publicKeyHex);
    if (!publicKey) return false;

    const data = encoder.encode(timestamp + rawBody);
    return await crypto.subtle.verify(
      publicKey.algorithm.name,
      publicKey,
      signature,
      data,
    );
  } catch {
    return false;
  }
}

function hex2bin(hex = '') {
  if (!hex || typeof hex !== 'string') return new Uint8Array(0);
  const cleanHex = hex.trim();
  const buf = new Uint8Array(Math.ceil(cleanHex.length / 2));
  for (let i = 0; i < buf.length; i++) {
    buf[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return buf;
}

async function getPublicKey(publicKeyHex) {
  if (!publicKeyHex) return null;
  const keyData = hex2bin(publicKeyHex);
  try {
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' },
      false,
      ['verify'],
    );
  } catch {
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
  }
}

const nacl = require('tweetnacl');

/**
 * Authorize requests using Ed25519 signature
 * @param req
 * @returns {boolean}
 */
module.exports = (req) => {
  const signature = req.headers.get('X-Signature-Ed25519');
  const timestamp = req.headers.get('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    return false;
  }

  return nacl.sign.detached.verify(
    Buffer.from(timestamp + req.rawBody),
    Buffer.from(signature, 'hex'),
    Buffer.from(PUBLIC_KEY, 'hex'),
  );
};

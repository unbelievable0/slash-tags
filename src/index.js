const APIRouter = require('./router/APIRouter');
const APIResponse = require('./router/APIResponse');

const router = new APIRouter();

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handle all incoming requests
 * @param req
 * @returns {Promise<Response>}
 */
async function handleRequest(req) {
  const res = new APIResponse();
  try {
    return await router.route(req, res);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Handle some errors before sending 500 Internal Server Error
 * @param error
 * @param req
 * @param res
 * @returns {Promise<Response>}
 */
async function handleError(error, req, res) {
  if (error.message === 'Unexpected end of JSON input') {
    return res.status(400).json({ error: 'Malformed JSON please check your rest body' });
  } else {
    console.error(error.stack);
    return res.status(500).json({ error: 'Unknown error' });
  }
}

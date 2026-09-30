import APIRouter from './router/APIRouter.js';
import APIResponse from './router/APIResponse.js';

const router = new APIRouter();

export default {
  async fetch(request, env = {}, ctx) {
    if (typeof log === 'function') {
      log('Request received:', request.method, request.url);
    }
    const res = new APIResponse();
    let response;
    try {
      response = await router.route(request, res, env, ctx);
    } catch (error) {
      response = await handleError(error, request, res);
    }

    if (typeof log === 'function' && response) {
      try {
        const cloned = response.clone();
        const contentType = cloned.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const body = await cloned.json();
          log('Response body:', body);
        } else {
          const body = await cloned.text();
          log('Response body:', body);
        }
      } catch {
        // Ignore errors during logging of response body
      }
    }

    return response;
  },
};

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

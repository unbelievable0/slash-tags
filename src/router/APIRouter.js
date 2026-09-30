import Client from '../framework/Client.js';
import authorizeRequest from './authorizeRequest.js';

const Method = method => req => req.method.toLowerCase() === method.toLowerCase();
const Post = Method('post');
const Get = Method('get');

const Path = pattern => req => {
  const url = new URL(req.url);
  const path = url.pathname;
  if (pattern instanceof RegExp) {
    return pattern.test(path);
  }
  if (typeof pattern === 'string') {
    if (pattern === '*' || pattern === '/*') return true;
    const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    const normalizedPattern = pattern.length > 1 && pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
    if (normalizedPath === normalizedPattern) return true;
    if (normalizedPattern !== '/' && (normalizedPath.endsWith(normalizedPattern) || normalizedPath.endsWith(`${normalizedPattern}/`))) {
      return true;
    }
  }
  return false;
};

class APIRouter {
  constructor(env = {}) {
    this.env = env;
    this.routes = [];
    this.client = new Client(env);
    this.registerRoutes();
  }

  setEnv(env = {}) {
    this.env = env;
    this.client.env = env;
  }

  /**
   * Register api routes
   */
  registerRoutes() {
    this.get(/(?:^|\/)update-commands\/?$/, async (req, res) => {
      //  TODO: Add some sort of auth
      const result = await this.client.commandStore.updateGlobalCommandList();
      return res.json(result);
    });

    this.post('*', async (req, res) => {
      const publicKey = this.env?.PUBLIC_KEY || this.client.env?.PUBLIC_KEY;
      if (!publicKey) {
        console.warn('PUBLIC_KEY is not defined in environment bindings (env.PUBLIC_KEY is missing). Rejecting request with 401.');
      }
      if (!await authorizeRequest(req, publicKey)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.json(await this.client.dispatcher.onInteractionReceived(req.data, req.ctx));
    });
  }

  handle(conditions, handler) {
    this.routes.push({ conditions, handler });
    return this;
  }

  get(url, handler) {
    return this.handle([Get, Path(url)], handler);
  }

  post(url, handler) {
    return this.handle([Post, Path(url)], handler);
  }

  /**
   * Handler when a route is requested
   * @param req
   * @param res
   * @param {object} [env]
   * @param {object} [ctx]
   * @returns {Promise<null|any|AuthenticatorResponse>}
   */
  async route(req, res, env, ctx) {
    if (env) {
      this.setEnv(env);
    }
    const route = this.resolve(req);

    if (route) {
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.rawBody = await req.text();
        if (req.rawBody) {
          req.data = JSON.parse(req.rawBody);
        }
      }

      req.ctx = ctx;
      await route.handler(req, res);
      return res.response;
    }

    return res
      .status(404)
      .json({ error: 'Not Found' });
  }

  resolve(req) {
    return this.routes.find(r => {
      if (!r.conditions || (Array.isArray(r) && !r.conditions.length)) {
        return true;
      }

      if (typeof r.conditions === 'function') {
        return r.conditions(req);
      }

      return r.conditions.every(c => c(req));
    });
  }
}

export default APIRouter;

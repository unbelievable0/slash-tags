const Client = require('../framework/Client');
const authorizeRequest = require('./authorizeRequest');

const Method = method => req => req.method.toLowerCase() === method.toLowerCase();
const Post = Method('post');
const Get = Method('get');

const Path = regExp => req => {
  const url = new URL(req.url);
  const path = url.pathname;
  const match = path.match(regExp) || [];
  return match[0] === path;
};

class APIRouter {
  constructor() {
    this.routes = [];
    this.client = new Client();
    this.registerRoutes();
  }

  /**
   * Register api routes
   */
  registerRoutes() {
    this.post('/', async (req, res) => {
      if (!await authorizeRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.json(await this.client.dispatcher.onInteractionReceived(req.data));
    });

    this.get('/update-commands', async (req, res) => {
      //  TODO: Add some sort of auth
      const result = await this.client.commandStore.updateGlobalCommandList();
      return res.json(result);
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
   * @returns {Promise<null|any|AuthenticatorResponse>}
   */
  async route(req, res) {
    const route = this.resolve(req);

    if (route) {
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.rawBody = await req.text();
        if (req.rawBody) {
          req.data = JSON.parse(req.rawBody);
        }
      }

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

module.exports = APIRouter;

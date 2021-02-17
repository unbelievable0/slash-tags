const { API_URL, API_VERSION } = require('../constants/Endpoints');
const APIRequest = require('./APIRequest');
const HTTPError = require('./HTTPError');
const DiscordAPIError = require('./DiscordAPIError');
const routeBuilder = require('./routeBuilder');

class RequestHandler {

  /**
   * @param {object} [options]
   * @param {string} [options.apiURL]
   * @param {number} [options.apiVersion]
   */
  constructor(options = {}) {
    const baseURL = options.apiURL || API_URL;
    const version = options.apiVersion || API_VERSION;
    this.baseURL = `${baseURL}/v${version}`;
  }

  /**
   * @returns {api}
   */
  get api() {
    return routeBuilder(this);
  }

  async request(method, path, options = {}) {
    const request = new APIRequest(this, method, path, options);
    const res = await request.send();

    if (res.ok) {
      return this.parseResponse(res);
    }

    //  Handle 4xx responses
    if (res.status >= 400 && res.status < 500) {
      let data;
      try {
        data = await this.parseResponse(res);
      } catch (err) {
        throw new HTTPError(err.message, err.constructor.name, err.status, request.method, request.path);
      }

      throw new DiscordAPIError(request.path, data, request.method, res.status);
    }

    //  Throw an error for other status codes
    throw new HTTPError(res.statusText, res.constructor.name, res.status, request.method, request.path);
  }

  parseResponse(res) {
    if (res.headers.get('content-type').includes('application/json')) {
      return res.json();
    }
    return res.buffer();
  }

}

module.exports = RequestHandler;

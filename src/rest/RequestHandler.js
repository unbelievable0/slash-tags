import { API_URL, API_VERSION } from '../constants/Endpoints.js';
import APIRequest from './APIRequest.js';
import HTTPError from './HTTPError.js';
import DiscordAPIError from './DiscordAPIError.js';
import routeBuilder from './routeBuilder.js';

class RequestHandler {

  /**
   * @param {any} [client]
   * @param {object} [options]
   * @param {string} [options.apiURL]
   * @param {number} [options.apiVersion]
   */
  constructor(client, options = {}) {
    if (client && !client.env && (client.apiURL || client.apiVersion)) {
      options = client;
      client = null;
    }
    this.client = client;
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
    if (res.headers.get('content-type')?.includes('application/json')) {
      return res.json();
    }
    return null;
  }

}

export default RequestHandler;

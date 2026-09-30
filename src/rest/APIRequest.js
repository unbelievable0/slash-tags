class APIRequest {

  constructor(requestHandler, method, path, options = {}) {
    this.requestHandler = requestHandler;
    this.method = method;
    this.path = path;
    this.options = options;
  }

  get url() {
    let url = new URL(`${this.requestHandler.baseURL}/${this.path}`);
    if (this.options.query) {
      Object.keys(this.options.query).forEach(key => {
        url.searchParams.append(key, this.options.query[key]);
      });
    }
    return url;
  }

  get botToken() {
    return this.requestHandler?.client?.env?.BOT_TOKEN || (typeof BOT_TOKEN !== 'undefined' ? BOT_TOKEN : '');
  }

  get headers() {
    let headers = {};

    if (this.options.auth !== false && this.botToken) headers.Authorization = `Bot ${this.botToken}`;
    if (this.options.data) headers['Content-Type'] = 'application/json';
    if (this.options.reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(this.options.reason);
    if (this.options.headers) headers = { ...headers, ...this.options.headers };

    return headers;
  }

  get body() {
    if (this.options.data) {
      return JSON.stringify(this.options.data);
    }
  }

  async send() {
    return fetch(this.url.toString(), {
      method: this.method ? this.method.toUpperCase() : 'GET',
      headers: this.headers,
      body: this.body,
    });
  }
}

export default APIRequest;

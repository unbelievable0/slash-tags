class APIResponse {

  constructor() {
    this.statusCode = 200;
    this.response = null;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(obj) {
    return this.send(JSON.stringify(obj));
  }

  send(body) {
    if (this.response) {
      throw new Error('Response already set');
    }
    this.response = new Response(body, {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.response;
  }
}

module.exports = APIResponse;

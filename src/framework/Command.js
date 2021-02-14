class Command {
  constructor(api, options = {}) {
    this._api = api;
    Object.keys(options).forEach(key => this[key] = options[key]);
  }

  get api() {
    return this._api;
  }
}

module.exports = Command;

/**
 * @type {InteractionResponse}
 */
module.exports.InteractionResponse = require('../structures/InteractionResponse');

/**
 * @type {InteractionEmbedResponse}
 */
module.exports.InteractionEmbedResponse = require('../structures/InteractionEmbedResponse');

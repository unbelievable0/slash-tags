class Command {
  constructor(api, options = {}) {
    this._api = api;
    this.name = options.name;
    this.type = options.type;
    this.description = options.description;
    this.options = options.options;
  }

  get api() {
    return this._api;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      description: this.description,
      options: this.options,
    };
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

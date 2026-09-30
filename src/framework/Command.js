import InteractionResponse from '../structures/InteractionResponse.js';
import InteractionEmbedResponse from '../structures/InteractionEmbedResponse.js';
import UserError from './UserError.js';

class Command {
  static InteractionResponse = InteractionResponse;
  static InteractionEmbedResponse = InteractionEmbedResponse;
  static UserError = UserError;

  constructor(client, options = {}) {
    this.client = client;
    this.name = options.name;
    this.type = options.type;
    this.description = options.description;
    this.options = options.options;
    this.default_member_permissions = options.default_member_permissions;
    this.defer = Boolean(options.defer);
  }

  get api() {
    return this.client.api;
  }

  toJSON() {
    const json = {
      name: this.name,
      description: this.description,
    };
    if (this.type !== undefined) json.type = this.type;
    if (this.options !== undefined) json.options = this.options;
    if (this.default_member_permissions !== undefined) {
      json.default_member_permissions = this.default_member_permissions;
    }
    return json;
  }
}

export default Command;

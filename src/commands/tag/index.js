const BaseCommand = require('../../framework/Command');

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'tag',
      description: 'Manage available tags in this server',
      options: [],
    });
  }
}

module.exports = Command;

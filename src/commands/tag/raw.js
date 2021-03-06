const BaseCommand = require('../../framework/Command');
const { ApplicationCommandOptionType } = require('../../constants/Types');

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'raw',
      description: 'Show the raw content of a tag',
      type: ApplicationCommandOptionType.SubCommand,
      permissions: ['manageMessages'],
      options: [
        {
          name: 'name',
          description: 'Tag name',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });
  }

  async _run({ args: [content] }) {

  }
}

module.exports = Command;

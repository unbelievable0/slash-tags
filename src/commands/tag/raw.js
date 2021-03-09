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

  async run({ guildID, args: [name] }) {
    const key = await this.client.modules.tagManagement.getTagKeyFromName(guildID, name);
    const content = await this.client.modules.tagManagement.getTagKV(key);

    return new Command.InteractionResponse()
      .setContent(`\`\`\`\n${content}\`\`\``);
  }
}

module.exports = Command;

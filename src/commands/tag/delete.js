const BaseCommand = require('../../framework/Command');
const { ApplicationCommandOptionType } = require('../../constants/Types');

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'delete',
      description: 'Delete an existing tag',
      type: ApplicationCommandOptionType.SubCommand,
      permissions: ['manageGuild'],
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

  async run(context) {
    await this.deleteCommand(context);
    return new Command.InteractionEmbedResponse()
      .setDescription('Tag deleted successfully!')
      .setEmoji('check')
      .setColor('green');
  }

  async deleteCommand({ guildID, args: [name] }) {
    const key = await this.client.modules.tagManagement.getTagKeyFromName(guildID, name);
    if (!key) {
      throw new Command.UserError('Unknown tag.');
    }

    const commandID = key.split(':')[1];
    await this.client.modules.tagManagement.deleteTagKV(key);
    await this.client.modules.tagManagement.deleteGuildCommand(guildID, commandID);
  }
}

module.exports = Command;

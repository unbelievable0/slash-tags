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
    if (await this.deleteCommand(context)) {
      return Command.InteractionEmbedResponse()
        .setDescription('Tag deleted successfully!')
        .setEmoji('check')
        .setColor('green');
    } else {
      return Command.InteractionEmbedResponse()
        .setDescription('Unknown tag.')
        .setEmoji('xmark')
        .setColor('red');
    }
  }

  async deleteCommand({ guildID, args: [name] }) {
    const key = await this.findCommandKey(guildID, name);
    if (!key) return;

    const commandID = key.split(':')[1];
    await this.api
      .applications(APPLICATION_ID)
      .guilds(guildID)
      .commands(commandID)
      .delete();

    await GUILD_TAGS.delete(key);
    return true;
  }

  async findCommandKey(guildID, name) {
    const { keys } = await GUILD_TAGS.list({ prefix: `${guildID}:` });
    const key = keys.find(key => key.metadata.name === name);
    if (key) {
      return key.name;
    }
  }
}

module.exports = Command;

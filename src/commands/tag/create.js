const BaseCommand = require('../../framework/Command');
const { ApplicationCommandOptionType } = require('../../constants/Types');

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'create',
      description: 'Create a new tag',
      type: ApplicationCommandOptionType.SubCommand,
      permissions: ['manageGuild'],
      options: [
        {
          name: 'name',
          description: 'Tag name',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'description',
          description: 'Command description',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'content',
          description: 'Content the tag should respond with (can be JSON)',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });
  }

  async run(context) {
    const { guildID, args: [name] } = context;
    if (await this.client.modules.tagManagement.getTagKeyFromName(guildID, name)) {
      return new Command.InteractionEmbedResponse()
        .setDescription(`A command with this name already exists.\nUse \`/tag edit ${name}\` to update it.`)
        .setEmoji('xmark')
        .setColor('red');
    }

    await this.createCommand(context);

    return new Command.InteractionEmbedResponse()
      .setDescription(`Command \`/${name}\` added.`)
      .setEmoji('check')
      .setColor('green');
  }

  async createCommand({ guildID, args: [name, description, content] }) {
    ({ content } = this.client.modules.tagManagement.validateInput({ name, description, content }));

    const command = await this.client.modules.tagManagement.createGuildCommand(guildID, name, description);
    await this.client.modules.tagManagement.createTagKV(guildID, command.id, name, content);
  }
}

module.exports = Command;

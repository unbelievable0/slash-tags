const BaseCommand = require('../../framework/Command');
const { ApplicationCommandOptionType } = require('../../constants/Types');

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'create',
      description: 'Create or edit an existing tag',
      type: ApplicationCommandOptionType.SubCommand,
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

  async _run(context) {
    await this.createCommand(context);
    return {
      data: {
        content: 'Tag created successfully!',
      },
    };
  }

  async createCommand({ guildID, args: [name, description, content] }) {
    const command = await this.api.applications(APPLICATION_ID).guilds(guildID).commands()
      .post({ name, description });

    await GUILD_TAGS.put(`${guildID}:${command.id}`, content, { metadata: { name } });
  }
}

module.exports = Command;

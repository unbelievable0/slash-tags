import BaseCommand from '../../framework/Command.js';
import { ApplicationCommandOptionType } from '../../constants/Types.js';

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'edit',
      description: '⚙️ Edit an existing tag',
      type: ApplicationCommandOptionType.SubCommand,
      defer: true,
      options: [
        {
          name: 'name',
          description: 'Tag name',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'value',
          description: 'Updated tag content',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });
  }

  async run(context) {
    const { guildID, args: [name] } = context;
    const key = await this.client.modules.tagManagement.getTagKeyFromName(guildID, name);
    if (!key) {
      return new Command.InteractionEmbedResponse()
        .setDescription(`A command with this name doesn't exist.`)
        .setEmoji('xmark')
        .setColor('red');
    }

    await this.updateCommand(context, key.split(':')[1]);

    return new Command.InteractionEmbedResponse()
      .setDescription(`Command \`/${name}\` updated.`)
      .setEmoji('check')
      .setColor('green');
  }

  async updateCommand({ guildID, args: [name, content] }, commandID) {
    ({ content } = this.client.modules.tagManagement.validateInput({ name, content }));

    await this.client.modules.tagManagement.createTagKV(guildID, commandID, name, content);
  }
}

export default Command;

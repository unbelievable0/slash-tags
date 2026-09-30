import BaseCommand from '../../framework/Command.js';
import { ApplicationCommandOptionType } from '../../constants/Types.js';

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'raw',
      description: 'Show the raw content of a tag',
      type: ApplicationCommandOptionType.SubCommand,
      defer: true,
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

export default Command;

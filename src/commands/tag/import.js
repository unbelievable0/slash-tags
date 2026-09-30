import BaseCommand from '../../framework/Command.js';
import { ApplicationCommandOptionType } from '../../constants/Types.js';

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'import',
      description: 'Import tags from another server',
      type: ApplicationCommandOptionType.SubCommand,
      defer: true,
      options: [
        {
          name: 'guild_id',
          description: 'Guild ID to import tags from',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });
  }

  async run(context) {
    const { guildID, args: [sourceGuildID] } = context;
    if (!sourceGuildID) {
      return new Command.InteractionEmbedResponse()
        .setDescription('Please provide a valid guild ID.')
        .setEmoji('xmark')
        .setColor('red');
    }

    const count = await this.importCommands(context, sourceGuildID);

    return new Command.InteractionEmbedResponse()
      .setDescription(`Successfully imported ${count} tag${count === 1 ? '' : 's'}.`)
      .setEmoji('check')
      .setColor('green');
  }

  async importCommands({ guildID }, sourceGuildID) {
    const sourceCommands = await this.client.modules.tagManagement.getGuildCommands(sourceGuildID);
    if (!Array.isArray(sourceCommands) || sourceCommands.length === 0) {
      return 0;
    }

    let count = 0;
    for (const cmd of sourceCommands) {
      const { name, description = 'Tag command' } = cmd;
      let content = await this.client.modules.tagManagement.getTagKV(`${sourceGuildID}:${cmd.id}`);
      if (content == null) {
        const sourceKey = await this.client.modules.tagManagement.getTagKeyFromName(sourceGuildID, name);
        if (sourceKey) {
          content = await this.client.modules.tagManagement.getTagKV(sourceKey);
        }
      }

      if (content == null) {
        content = '';
      }

      ({ content } = this.client.modules.tagManagement.validateInput({ name, description, content }));

      const existingKey = await this.client.modules.tagManagement.getTagKeyFromName(guildID, name);
      if (existingKey) {
        const commandID = existingKey.split(':')[1];
        await this.client.modules.tagManagement.createTagKV(guildID, commandID, name, content);
        if (typeof this.client.modules.tagManagement.editGuildCommand === 'function') {
          await this.client.modules.tagManagement.editGuildCommand(guildID, commandID, name, description).catch(() => {
          });
        }
      } else {
        await this.client.modules.tagManagement.createTag(guildID, name, description, content);
      }
      count++;
    }

    return count;
  }
}

export default Command;

import BaseCommand from '../../framework/Command.js';
import { ApplicationCommandOptionType } from '../../constants/Types.js';

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'import',
      description: '⚙️ Import tags from another server',
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

  get tagManagement() {
    return this.client.modules.tagManagement;
  }

  async run(context) {
    const { args: [sourceGuildID] } = context;
    if (!sourceGuildID) {
      return new Command.InteractionEmbedResponse()
        .setDescription('Please provide a valid guild ID.')
        .setEmoji('xmark')
        .setColor('red');
    }

    const count = await this.importTags(context, sourceGuildID);

    return new Command.InteractionEmbedResponse()
      .setDescription(`Successfully imported ${count} tag${count === 1 ? '' : 's'}.`)
      .setEmoji('check')
      .setColor('green');
  }

  async importTags({ guildID }, sourceGuildID) {
    const sourceCommands = await this.tagManagement.getGuildCommands(sourceGuildID);
    if (!sourceCommands?.length) {
      return 0;
    }

    const importedTags = new Map(
      await Promise.all(
        sourceCommands.map(async (cmd) => {
          const content = await this.fetchTagContent(sourceGuildID, cmd);
          const description = cmd.description || 'Tag command';
          const validated = this.tagManagement.validateInput({ name: cmd.name, description, content });
          return [cmd.name, validated];
        })
      )
    );

    const targetCommands = (await this.tagManagement.getGuildCommands(guildID)) ?? [];
    const seenNames = new Set();

    const commandsToPut = targetCommands.map((targetCmd) => {
      seenNames.add(targetCmd.name);
      const imported = importedTags.get(targetCmd.name);
      return imported
        ? { ...targetCmd, name: imported.name, description: imported.description }
        : targetCmd;
    });

    for (const [name, imported] of importedTags) {
      if (!seenNames.has(name)) {
        commandsToPut.push({
          name: imported.name,
          description: imported.description,
        });
      }
    }

    const resultCommands = await this.tagManagement.bulkOverwriteGuildCommands(guildID, commandsToPut);

    await Promise.all(
      (resultCommands ?? [])
        .filter((cmd) => importedTags.has(cmd.name))
        .map(async (cmd) => {
          const imported = importedTags.get(cmd.name);
          const existingKey = await this.tagManagement.getTagKeyFromName(guildID, cmd.name);
          if (existingKey && existingKey !== `${guildID}:${cmd.id}`) {
            await this.tagManagement.deleteTagKV(existingKey);
          }
          await this.tagManagement.createTagKV(guildID, cmd.id, cmd.name, imported.content);
        })
    );

    return importedTags.size;
  }

  async fetchTagContent(guildID, cmd) {
    const directContent = await this.tagManagement.getTagKV(`${guildID}:${cmd.id}`);
    if (directContent != null) {
      return directContent;
    }

    const fallbackKey = await this.tagManagement.getTagKeyFromName(guildID, cmd.name);
    return (fallbackKey && await this.tagManagement.getTagKV(fallbackKey)) ?? '';
  }
}

export default Command;

const { InteractionType, InteractionResponseType } = require('../constants/Types');
const { Interaction, ApplicationCommand, InteractionResponse, InteractionEmbedResponse } = require('../structures');
const { PermissionFlags } = require('../constants/Permissions');
const { Parser } = require('../modules');

class Dispatcher {

  constructor(client) {
    this.client = client;
  }

  async onInteractionReceived(data) {
    const interaction = new Interaction(data);
    switch (interaction.type) {
      case InteractionType.Ping:
        return {
          type: InteractionResponseType.Pong,
        };

      case InteractionType.ApplicationCommand:
        return this.onApplicationCommandReceived(interaction)
          .catch(this.handleError);

      default:
        console.log(`Unknown interaction type "${interaction.type}" received`);
        return {};
    }
  }

  async onApplicationCommandReceived(interaction) {
    //  Ignore commands in DMs
    if (!interaction.guildID) {
      return new InteractionResponse()
        .setContent('Commands can only be used in a server.')
        .setEmoji('xmark');
    }

    const applicationCommand = new ApplicationCommand(interaction.data);
    const context = {
      ...interaction,
      args: applicationCommand.args,
    };

    //  Check for a global command
    const command = this.client.commandStore.get(applicationCommand.commandName);
    if (command) {

      //  Basic permission check
      const missingPermissions = context.member.permissions.missing(command.permissions);
      if (missingPermissions.length) {
        const permissionString = missingPermissions.map(p => PermissionFlags[p]).join(', ');
        return new InteractionResponse()
          .setContent(`You do not have permission to use this command.\nMissing: \`${permissionString}\``)
          .setEmoji('xmark')
          .setEphemeral();
      }

      //  Run the command
      return (await command.run(context))
        || new InteractionEmbedResponse()
          .setDescription('Missing response')
          .setColor('red');
    }

    //  Check for a custom tag
    const tag = await GUILD_TAGS.get(`${interaction.guildID}:${applicationCommand.id}`);
    if (tag) {
      return new InteractionResponse(new Parser(context, tag).result());
    }
  }

  /**
   * Handle errors executing commands
   * @param error
   * @returns {InteractionResponse}
   */
  handleError(error) {
    if (error.name === 'UserError') {
      return new InteractionResponse()
        .channelMessage()
        .setContent(error.message)
        .setEmoji('xmark')
        .setEphemeral();
    } else {
      console.error(error.stack);
      return new InteractionResponse()
        .channelMessage()
        .setContent('An unexpected error occurred executing this command.')
        .setEmoji('xmark')
        .setEphemeral();
    }
  }
}

module.exports = Dispatcher;

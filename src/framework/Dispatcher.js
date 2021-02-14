const { InteractionType, InteractionResponseType } = require('../constants/Types');
const { Interaction, ApplicationCommand, InteractionResponse, InteractionEmbedResponse } = require('../structures');
const RequestHandler = require('../rest/RequestHandler');
const CommandStore = require('./CommandStore');

class Dispatcher {

  constructor() {
    this.rest = new RequestHandler();
    this.commandStore = new CommandStore(this);
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
    const applicationCommand = new ApplicationCommand(interaction.data);
    const context = {
      ...interaction,
      args: applicationCommand.args,
    };

    //  Check for a global command
    const command = this.commandStore.get(applicationCommand.commandName);
    if (command) {
      return (await command.run(context))
        || new InteractionEmbedResponse()
          .setDescription('Missing response')
          .setColor('red');
    }

    //  Check for a custom tag
    const customCommand = await GUILD_TAGS.get(`${interaction.guildID}:${applicationCommand.id}`);
    if (customCommand) {
      return new InteractionEmbedResponse()
        .setDescription(customCommand)
        .setColor('blue');
    }
  }

  /**
   * Handle errors executing commands
   * @param error
   * @returns {InteractionResponse}
   */
  handleError(error) {
    console.error(error.stack);
    return new InteractionResponse()
      .channelMessage()
      .setContent('An unexpected error occurred executing this command.')
      .setEmoji('xmark')
      .setEphemeral();
  }
}

module.exports = Dispatcher;

import { InteractionResponseType, InteractionType } from '../constants/Types.js';
import { ApplicationCommand, Interaction, InteractionEmbedResponse, InteractionResponse } from '../structures/index.js';
import { Parser } from '../modules/index.js';

class Dispatcher {

  constructor(client) {
    this.client = client;
    this.handleError = this.handleError.bind(this);
  }

  async onInteractionReceived(data, ctx) {
    const interaction = new Interaction(data);
    switch (interaction.type) {
      case InteractionType.Ping:
        return {
          type: InteractionResponseType.Pong,
        };

      case InteractionType.ApplicationCommand:
        return this.onApplicationCommandReceived(interaction, ctx)
          .catch(this.handleError);

      default:
        console.log(`Unknown interaction type "${interaction.type}" received`);
        return {};
    }
  }

  async onApplicationCommandReceived(interaction, ctx) {
    // Ignore commands in DMs
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

    // Check for a global command
    const command = this.client.commandStore.get(applicationCommand.commandName);
    if (command) {
      if (command.defer) {
        const promise = this.executeCommandDeferred(command, context, interaction);
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(promise);
        }
        return {
          type: InteractionResponseType.DeferredChannelMessageWithSource,
        };
      }

      // Run the command
      return (await command.run(context))
        || new InteractionEmbedResponse()
          .setDescription('Missing response')
          .setColor('red');
    }

    // Check for a custom tag
    const key = `${interaction.guildID}:${applicationCommand.id}`;
    const tag = await this.client.modules.tagManagement.getTagKV(key);
    if (tag) {
      return new InteractionResponse(new Parser(context, tag).result());
    }
  }

  async executeCommandDeferred(command, context, interaction) {
    let response;
    try {
      response = (await command.run(context))
        || new InteractionEmbedResponse()
          .setDescription('Missing response')
          .setColor('red');
    } catch (error) {
      response = this.handleError(error);
    }

    try {
      const applicationId = interaction.applicationID
        || this.client.applicationId
        || this.client.env?.APPLICATION_ID
        || (typeof APPLICATION_ID !== 'undefined' ? APPLICATION_ID : undefined);

      const payload = typeof response?.toJSON === 'function' ? response.toJSON().data : (response?.data || response);

      await this.client.api
        .webhooks(applicationId)(interaction.token)
        .messages('@original')
        .patch(payload);
    } catch (err) {
      console.error('Failed to send deferred interaction response:', err);
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
        .setContent(error.message)
        .setEmoji('xmark')
        .setEphemeral();
    } else {
      console.error(error.stack);
      return new InteractionResponse()
        .setContent('An unexpected error occurred executing this command.')
        .setEmoji('xmark')
        .setEphemeral();
    }
  }
}

export default Dispatcher;

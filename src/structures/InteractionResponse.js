const { InteractionResponseType, MessageFlags } = require('../constants/Types');
const { resolveEmoji } = require('../constants/Emojis');

class InteractionResponse {
  constructor() {
    this.type = InteractionResponseType.ChannelMessageWithSource;
    this.flags = 0;
    this.content = null;
  }

  /**
   * Set the type to ChannelMessage
   * @returns {InteractionResponse}
   */
  channelMessage() {
    this.type = InteractionResponseType.ChannelMessage;
    return this;
  }

  /**
   * Set the message content
   * @param {string} content
   * @returns {InteractionResponse}
   */
  setContent(content) {
    this.content = content;
    return this;
  }

  /**
   * Set this response as ephemeral
   * @returns {InteractionResponse}
   */
  setEphemeral() {
    this.flags = this.flags | MessageFlags.Ephemeral;
    this.channelMessage();
    return this;
  }

  /**
   * Set the emoji to place at the beginning of the content
   * This should be called after InteractionResponse.setContent()
   * @param {string} emoji
   * @returns {InteractionEmbedResponse}
   */
  setEmoji(emoji) {
    this.content = `${resolveEmoji(emoji)} ${this.content || ''}`;
    return this;
  }

  toJSON() {
    const result = {
      type: this.type,
      data: {},
    };
    if (this.flags) result.data.flags = this.flags;
    if (this.content) result.data.content = this.content;
    return result;
  }
}

module.exports = InteractionResponse;

const { InteractionResponseType, MessageFlags } = require('../constants/Types');
const { resolveEmoji } = require('../constants/Emojis');

class InteractionResponse {
  constructor(data = {}) {
    this.type = data.type || InteractionResponseType.ChannelMessageWithSource;
    this.flags = data.flags || 0;
    this.content = data.content || null;

    if (data.embed) {
      this.embeds = [data.embed];
    } else if (data.embeds) {
      this.embeds = data.embeds;
    }
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
      data: { allowed_mentions: { parse: [] } },
    };

    if (this.flags) result.data.flags = this.flags;
    if (this.content) result.data.content = this.content;
    if (this.embeds) result.data.embeds = this.embeds;

    return result;
  }
}

module.exports = InteractionResponse;

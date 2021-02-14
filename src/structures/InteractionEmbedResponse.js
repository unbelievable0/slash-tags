const InteractionResponse = require('./InteractionResponse');
const User = require('./User');
const { resolveColor } = require('../constants/Colors');
const { resolveEmoji } = require('../constants/Emojis');

class InteractionEmbedResponse extends InteractionResponse {
  constructor(data) {
    super();
    this.embed = data || {};
  }

  /**
   * Set the embed title
   * @param {string} title
   * @returns {InteractionEmbedResponse}
   */
  setTitle(title) {
    this.embed.title = title;
    return this;
  }

  /**
   * Set the author from a string or User
   * @param {User|string} author
   * @param {string} [iconURL]
   * @returns {InteractionEmbedResponse}
   */
  setAuthor(author, iconURL) {
    if (author instanceof User) {
      this.embed.author = {
        name: author.username,
        icon_url: author.avatarURL,
      };
    } else {
      this.embed.author = {
        name: author,
        icon_url: iconURL,
      };
    }
    return this;
  }

  /**
   * Set the embed description
   * @param {string} description
   * @returns {InteractionEmbedResponse}
   */
  setDescription(description) {
    this.embed.description = description;
    return this;
  }

  /**
   * Add a field to the embed
   * @param {string} name
   * @param {string} value
   * @param {boolean} [inline]
   * @returns {InteractionEmbedResponse}
   */
  addField(name, value, inline = false) {
    if (Array.isArray(this.embed.fields)) {
      this.embed.fields.push({ name, value, inline });
    } else {
      this.embed.fields = [{ name, value, inline }];
    }
    return this;
  }

  /**
   * Set the
   * @param color
   * @returns {InteractionEmbedResponse}
   */
  setColor(color) {
    this.embed.color = color;
    return this;
  }

  /**
   * Set the emoji to place at the beginning of the description
   * This should be called after InteractionEmbedResponse.setDescription()
   * @param {string} emoji
   * @returns {InteractionEmbedResponse}
   */
  setEmoji(emoji) {
    this.embed.description = `${resolveEmoji(emoji)} ${this.embed.description || ''}`;
    return this;
  }

  toJSON() {
    const embed = {};

    //  Add all properties that don't require parsing
    this.properties.forEach(key => embed[key] = this.embed[key]);

    if (this.embed.color) {
      embed.color = resolveColor(this.embed.color);
    }

    const result = super.toJSON();
    result.data.embeds = [embed];
    return result;
  }

  get properties() {
    return Object.keys(this.embed)
      .filter(key => !['color'].includes(key));
  }
}

module.exports = InteractionEmbedResponse;

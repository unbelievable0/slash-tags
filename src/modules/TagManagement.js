const UserError = require('../framework/UserError');

class TagManagement {

  constructor(client) {
    this.client = client;
    this.api = client.api;
  }

  /**
   * Get the KV key for a tag from the name
   * @param guildID
   * @param name
   * @returns {Promise<*>}
   */
  async getTagKeyFromName(guildID, name) {
    const { keys } = await GUILD_TAGS.list({ prefix: `${guildID}:` });
    const key = keys.find(key => key.metadata.name === name);
    if (key) {
      return key.name;
    }
  }

  /**
   * Create a KV tag
   * @param guildID
   * @param commandID
   * @param commandName
   * @param content
   * @returns {*}
   */
  createTagKV(guildID, commandID, commandName, content) {
    return GUILD_TAGS.put(`${guildID}:${commandID}`, content, { metadata: { name: commandName } });
  }

  /**
   * Delete a value from the KV
   * @param key
   * @returns {*}
   */
  deleteTagKV(key) {
    return GUILD_TAGS.delete(key);
  }

  /**
   * Get a value from the KV
   * @param key
   * @returns {*}
   */
  getTagKV(key) {
    return GUILD_TAGS.get(key);
  }

  /**
   * Create the slash command in Discord
   * @param guildID
   * @param commandName
   * @param commandDescription
   * @returns {Promise<any>}
   */
  createGuildCommand(guildID, commandName, commandDescription) {
    return this.api.applications(APPLICATION_ID).guilds(guildID).commands()
      .post({
        name: commandName,
        description: commandDescription,
      })
      .catch(err => {
        if (err.name === 'DiscordAPIError') {
          throw new UserError(err.message);
        } else {
          throw err;
        }
      });
  }

  /**
   * Delete the slash command in Discord
   * @param guildID
   * @param commandID
   * @returns {*}
   */
  deleteGuildCommand(guildID, commandID) {
    return this.api
      .applications(APPLICATION_ID)
      .guilds(guildID)
      .commands(commandID)
      .delete();
  }

  /**
   * Validate and parse the command name, description and content
   * @param name
   * @param description
   * @param content
   * @returns {{name, description, content}}
   */
  validateInput({ name, description, content } = {}) {
    //  command name length
    if (name && name.length > 32) {
      throw new UserError('Name cannot be greater than 32 characters.');
    }

    //  command description length
    if (description && description.length > 100) {
      throw new UserError('Description cannot be greater than 100 characters.');
    }

    //  replace all escaped new lines with an actual new line
    content = this.parseContent(content);

    return { name, description, content };
  }

  /**
   * Convert escaped new lines to actual ones
   * @param content
   * @returns {string|*}
   */
  parseContent(content) {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object') {
        return content;
      }
    } catch (e) {
    }

    return content.replace(/\\n/gm, '\n');
  }
}

module.exports = TagManagement;

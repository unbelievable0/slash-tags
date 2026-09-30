import UserError from '../framework/UserError.js';

class TagManagement {

  constructor(client) {
    this.client = client;
  }

  get api() {
    return this.client.api;
  }

  get kv() {
    return this.client.env?.GUILD_TAGS || (typeof GUILD_TAGS !== 'undefined' ? GUILD_TAGS : undefined);
  }

  get applicationId() {
    return this.client.env?.APPLICATION_ID || (typeof APPLICATION_ID !== 'undefined' ? APPLICATION_ID : undefined);
  }

  /**
   * Get the KV key for a tag from the name
   * @param guildID
   * @param name
   * @returns {Promise<*>}
   */
  async getTagKeyFromName(guildID, name) {
    const kv = this.kv;
    if (!kv) return null;
    const { keys } = await kv.list({ prefix: `${guildID}:` });
    const key = keys.find(key => key.metadata?.name === name);
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
    if (!this.kv) return null;
    return this.kv.put(`${guildID}:${commandID}`, content, { metadata: { name: commandName } });
  }

  /**
   * Delete a value from the KV
   * @param key
   * @returns {*}
   */
  deleteTagKV(key) {
    if (!this.kv) return null;
    return this.kv.delete(key);
  }

  /**
   * Get a value from the KV
   * @param key
   * @returns {*}
   */
  getTagKV(key) {
    if (!this.kv || !key) return null;
    return this.kv.get(key);
  }

  /**
   * Get all slash commands in Discord for a guild
   * @param guildID
   * @returns {Promise<any>}
   */
  getGuildCommands(guildID) {
    return this.api
      .applications(this.applicationId)
      .guilds(guildID)
      .commands()
      .get()
      .catch(err => {
        if (err.name === 'DiscordAPIError') {
          throw new UserError(err.message);
        } else {
          throw err;
        }
      });
  }

  /**
   * Create the slash command in Discord
   * @param guildID
   * @param commandName
   * @param commandDescription
   * @returns {Promise<any>}
   */
  createGuildCommand(guildID, commandName, commandDescription) {
    return this.api.applications(this.applicationId).guilds(guildID).commands()
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
   * Create a slash command and KV entry for a tag
   * @param guildID
   * @param name
   * @param description
   * @param content
   * @returns {Promise<any>}
   */
  async createTag(guildID, name, description, content) {
    ({ content } = this.validateInput({ name, description, content }));

    const command = await this.createGuildCommand(guildID, name, description);
    await this.createTagKV(guildID, command.id, name, content);
    return command;
  }

  /**
   * Edit a slash command in Discord
   * @param guildID
   * @param commandID
   * @param commandName
   * @param commandDescription
   * @returns {Promise<any>}
   */
  editGuildCommand(guildID, commandID, commandName, commandDescription) {
    return this.api
      .applications(this.applicationId)
      .guilds(guildID)
      .commands(commandID)
      .patch({
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
      .applications(this.applicationId)
      .guilds(guildID)
      .commands(commandID)
      .delete();
  }

  /**
   * Bulk overwrite guild application commands in Discord
   * @param guildID
   * @param commands
   * @returns {Promise<any>}
   */
  bulkOverwriteGuildCommands(guildID, commands) {
    return this.api
      .applications(this.applicationId)
      .guilds(guildID)
      .commands()
      .put(commands)
      .catch(err => {
        if (err.name === 'DiscordAPIError') {
          throw new UserError(err.message);
        } else {
          throw err;
        }
      });
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
      // ignore
    }

    return content.replace(/\\n/gm, '\n');
  }
}

export default TagManagement;

const UserError = require('../framework/UserError');

class TagManagement {

  constructor(client) {
    this.client = client;
  }

  createTagKV(guildID, commandID, commandName, content) {
    return GUILD_TAGS.put(`${guildID}:${commandID}`, content, { metadata: { name: commandName } });
  }

  deleteTagKV(key) {
    return GUILD_TAGS.delete(key);
  }

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

  deleteGuildCommand(guildID, commandID) {
    return this.api
      .applications(APPLICATION_ID)
      .guilds(guildID)
      .commands(commandID)
      .delete();
  }

  validateInput(name, description, content) {
    //  command name length
    if (name.length > 32) {
      throw new UserError('Name cannot be greater than 32 characters.');
    }

    //  command description length
    if (description.length > 100) {
      throw new UserError('Description cannot be greater than 100 characters.');
    }

    //  command content structure (if an object)
  }
}

module.exports = TagManagement;

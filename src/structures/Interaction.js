import Member from './Member.js';

class Interaction {
  constructor(data) {
    this.id = data.id;
    this.applicationID = data.application_id;
    this.type = data.type;
    this.data = data.data;
    this.guildID = data.guild_id;
    this.channelID = data.channel_id;
    this.member = data.member ? new Member(data.member) : null;
    this.token = data.token;
    this.version = data.version;
  }
}

export default Interaction;

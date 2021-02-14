// @formatter:off
module.exports = {
  InteractionType: {
    Ping:               1,
    ApplicationCommand: 2,
  },

  InteractionResponseType: {
    Pong:                     1,
    Acknowledge:              2,
    ChannelMessage:           3,
    ChannelMessageWithSource: 4,
    AcknowledgeWithSource:    5,
  },

  MessageFlags: {
    CrossPosted:            1 << 0,
    IsCrossPost:            1 << 1,
    SuppressEmbeds:         1 << 2,
    SourceMessageDeleted:   1 << 3,
    Urgent:                 1 << 4,
    HasThread:              1 << 5,
    Ephemeral:              1 << 6,
  },

  ApplicationCommandOptionType: {
    SubCommand:         1,
    SubCommandGroup:    2,
    String:             3,
    Integer:            4,
    Boolean:            5,
    User:               6,
    Channel:            7,
    Role:               8,
  },
};

// @formatter:off
export const InteractionType = {
  Ping:               1,
  ApplicationCommand: 2,
};

export const InteractionResponseType = {
  Pong:                                 1,
  ChannelMessageWithSource:             4,
  DeferredChannelMessageWithSource:     5,
  DeferredUpdateMessage:                6,
  UpdateMessage:                        7,
  ApplicationCommandAutocompleteResult: 8,
  Modal:                                9,
  PremiumRequired:                      10,
};

export const MessageFlags = {
  CrossPosted:            1 << 0,
  IsCrossPost:            1 << 1,
  SuppressEmbeds:         1 << 2,
  SourceMessageDeleted:   1 << 3,
  Urgent:                 1 << 4,
  HasThread:              1 << 5,
  Ephemeral:              1 << 6,
};

export const ApplicationCommandOptionType = {
  SubCommand:         1,
  SubCommandGroup:    2,
  String:             3,
  Integer:            4,
  Boolean:            5,
  User:               6,
  Channel:            7,
  Role:               8,
};

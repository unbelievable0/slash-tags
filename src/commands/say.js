const BaseCommand = require('../framework/Command');
const { Colors } = require('../constants/Colors');
const { ApplicationCommandOptionType } = require('../constants/Types');

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'say',
      description: 'Make me say something 😳',
      options: [
        {
          name: 'message',
          description: ' ',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'colour',
          description: 'Choose the embed colour',
          type: ApplicationCommandOptionType.String,
          choices: Object.keys(Colors).map(color => ({
            name: color.charAt(0).toUpperCase() + color.slice(1),
            value: color,
          })),
          required: false,
        },
      ],
    });
  }

  async run({ member, args: [content, color] }) {
    return new Command.InteractionEmbedResponse()
      .setAuthor(member.user)
      .setDescription(content)
      .setColor(color || 'blue');
  }
}

module.exports = Command;

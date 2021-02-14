const { ApplicationCommandOptionType } = require('../constants/Types');
const ApplicationCommandOption = require('./ApplicationCommandOption');

class ApplicationCommand {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    if (data.options) this.options = data.options.map(option => new ApplicationCommandOption(option));
  }

  /**
   * Convert the args into an array of values
   * @returns {[]}
   */
  get args() {
    let args = [];
    let options = this.options;
    while (options) {
      for (let option of options) {
        if (option.hasOwnProperty('value')) {
          args.push(option.value);
        }
      }
      options = options[0].options;
    }

    return args;
  }

  /**
   * Get the command name, including sub commands in the format "command/subcommand"
   * @returns {string}
   */
  get commandName() {
    let name = this.name;

    let options = this.options;
    while (options) {
      const isSubCommand = [
        ApplicationCommandOptionType.SubCommand,
        ApplicationCommandOptionType.SubCommandGroup,
      ].includes(options[0].type);

      if (isSubCommand) {
        name = `${name}/${options[0].name}`;
      }

      options = options[0].options;
    }

    return name;
  }
}

module.exports = ApplicationCommand;

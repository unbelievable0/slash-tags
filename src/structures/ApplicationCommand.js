import { ApplicationCommandOptionType } from '../constants/Types.js';
import ApplicationCommandOption from './ApplicationCommandOption.js';

export default class ApplicationCommand {
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
    while (Array.isArray(options) && options.length > 0) {
      for (let option of options) {
        if (option && Object.prototype.hasOwnProperty.call(option, 'value')) {
          args.push(option.value);
        }
      }
      options = options[0]?.options;
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
    while (Array.isArray(options) && options.length > 0) {
      const first = options[0];
      const isSubCommand = first && [
        ApplicationCommandOptionType.SubCommand,
        ApplicationCommandOptionType.SubCommandGroup,
      ].includes(first.type);

      if (isSubCommand) {
        name = `${name}/${first.name}`;
      }

      options = first?.options;
    }

    return name;
  }
}

const GlobalCommands = require('../constants/GlobalCommands');

class CommandStore extends Map {
  constructor(dispatcher) {
    super();
    this.dispatcher = dispatcher;
    this.registerGlobalCommands(GlobalCommands);
  }

  get api() {
    return this.dispatcher.rest.api;
  }

  registerGlobalCommands(commands, route) {
    const updateRoute = (name) => route ? `${route}/${name}` : name;

    commands.forEach(command => {
      if (typeof command === 'object' && command !== null) {
        Object.keys(command)
          .forEach(key => {
            this.registerGlobalCommands(command[key], updateRoute(key));
          });
      } else {
        this.registerGlobalCommand(updateRoute(command));
      }
    });
  }

  registerGlobalCommand(route) {
    const Command = require(`../commands/${route}`);
    route = route.replace(/\/index$/, '');
    this.set(route, new Command(this.api));
  }

  commandList() {
    //  Bit of a hacky way to construct the command list
    const result = [];
    for (let key of [...this.keys()]) {
      const route = key.split('/');
      const command = this.get(key).toJSON();

      if (route.length === 1) {
        result.push(command);
      } else if (route.length === 2) {
        result.find(c => c.name === route[0]).options.push(command);
      }
    }

    return result;
  }

  /**
   * Update the global commands
   * @returns {Promise<*>}
   */
  async updateGlobalCommandList() {
    return this.api
      .applications(APPLICATION_ID)
      .commands()
      .put(this.commandList());
  }
}

module.exports = CommandStore;

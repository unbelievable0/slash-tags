const Dispatcher = require('../framework/Dispatcher');
const RequestHandler = require('../rest/RequestHandler');
const CommandStore = require('./CommandStore');
const TagManagement = require('../modules/TagManagement');

class Client {
  constructor() {
    this.dispatcher = new Dispatcher(this);
    this.rest = new RequestHandler();
    this.commandStore = new CommandStore(this);

    this.modules = {
      tagManagement: new TagManagement(this),
    };
  }

  get api() {
    return this.rest.api;
  }

}

module.exports = Client;

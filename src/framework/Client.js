import Dispatcher from '../framework/Dispatcher.js';
import RequestHandler from '../rest/RequestHandler.js';
import CommandStore from './CommandStore.js';
import TagManagement from '../modules/TagManagement.js';

class Client {
  constructor(env = {}) {
    this.env = env;
    this.dispatcher = new Dispatcher(this);
    this.rest = new RequestHandler(this);
    this.commandStore = new CommandStore(this);

    this.modules = {
      tagManagement: new TagManagement(this),
    };
  }

  get api() {
    return this.rest.api;
  }

  get applicationId() {
    return this.env?.APPLICATION_ID || (typeof APPLICATION_ID !== 'undefined' ? APPLICATION_ID : undefined);
  }
}

export default Client;

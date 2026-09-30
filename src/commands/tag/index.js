import BaseCommand from '../../framework/Command.js';
import { Permissions } from '../../constants/Permissions.js';

class Command extends BaseCommand {
  constructor(...args) {
    super(...args, {
      name: 'tag',
      description: 'Manage available tags in this server',
      default_member_permissions: Permissions.manageMessages.toString(),
      defer: true,
      options: [],
    });
  }
}

export default Command;

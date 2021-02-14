//  Used to define the command structure because fs can't be used in cf workers :)
module.exports = [
  {
    tag: ['index', 'create', 'delete', 'raw'],
  },
  'say',
];

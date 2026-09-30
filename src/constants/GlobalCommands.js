// Used to define the command structure because fs can't be used in cf workers :)
export default [
  {
    tag: ['index', 'create', 'edit', 'delete', 'raw', 'import'],
  },
];

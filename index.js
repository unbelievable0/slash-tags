const util = require('util');
global.log = (value) => {
  console.log(util.inspect(value, false, null, true));
};

require('./src/index');

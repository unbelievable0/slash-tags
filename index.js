import util from 'util';
import worker from './src/index.js';

global.log = (...values) => {
  console.log(...values.map(val => typeof val === 'string' ? val : util.inspect(val, { colors: true, depth: null, compact: false })));
};

export default worker;

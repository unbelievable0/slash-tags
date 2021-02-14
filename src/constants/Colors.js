const Colors = {
  blue: 240116,
  red: 15684432,
  green: 6732650,
  yellow: 16771899,
  orange: 16747777,
  pink: 16716914,
  blank: 3553599,
};

module.exports = {
  Colors,
  resolveColor: (color) => {
    return Colors[color] || parseInt(color.replace('#', ''), 16);
  },
};

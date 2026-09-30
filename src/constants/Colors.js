export const Colors = {
  blue: 240116,
  red: 15684432,
  green: 6732650,
  yellow: 16771899,
  orange: 16747777,
  pink: 16716914,
  blurple: 5793266,
  white: 16777215,
  black: 0,
  blank: 3553599,
};

export function resolveColor(color) {
  if (typeof color === 'number') return color;
  if (typeof color !== 'string') return 0;
  const name = color.toLowerCase().replace(/[^a-z]/g, '');
  if (Colors[name] !== undefined) return Colors[name];
  const hex = color.replace('#', '');
  return parseInt(hex, 16) || 0;
}

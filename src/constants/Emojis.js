export const Emojis = {
  xmark: '333039150255177728',
  check: '333039150175617036',
};

export function resolveEmoji(name) {
  const id = Emojis[name];
  return id ? `<:${name}:${id}>` : '';
}

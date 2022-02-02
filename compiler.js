function wrap(tag, inner) {
  return `<${tag}>${inner}</${tag}>`;
}

module.exports = function compiler({ type, payload }) {
  switch (type) {
    case 'DOCUMENT':
      return payload.blocks.map(compiler).join('');
    case 'LINE':
      return '<hr>';
    case 'LINEBREAK':
      return '<br>';
    case 'TITLE':
      return wrap(
        `h${payload.level}`,
        payload.children.map(compiler).join('').trim()
      );
    case 'PARAGRAPH':
      return wrap(
        'p',
        payload.children
          .filter((child, i) =>
            !(i === payload.children.length-1 &&
              child.type === 'LINEBREAK'))
          .map(compiler)
          .join('')
          .trim()
      );
    case 'WORD':
    default:
      return payload.value;
  }
};

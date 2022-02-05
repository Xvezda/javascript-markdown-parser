function buildAttributes(attrs) {
  const result = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return result && ' ' +  result;
}

function wrap(tag, inner, attrs = {}) {
  return `<${tag}${buildAttributes(attrs)}>${inner}</${tag}>`;
}

module.exports = function compiler({ type, payload }) {
  switch (type) {
    case 'DOCUMENT':
      return payload.blocks.map(compiler).join('');
    case 'LINE':
      return '<hr>';
    case 'LINE_BREAK':
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
              child.type === 'LINE_BREAK'))
          .map(compiler)
          .join('')
          .trim()
      );
    case 'LINK':
      return wrap(
        'a',
        payload.children.map(compiler).join(''),
        {href: payload.address}
      );
    case 'WORD':
    default:
      return payload.value;
  }
};

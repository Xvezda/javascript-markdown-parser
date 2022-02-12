const assert = require('assert');

function buildAttributes(attrs) {
  const result = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return result && ' ' +  result;
}

function wrap(tag, inner, attrs = {}) {
  return `<${tag}${buildAttributes(attrs)}>${inner}</${tag}>`;
}

function compileChildren(children) {
  return children
    .filter((child, i) =>
      !(i === children.length-1 && child.type === 'LINE_BREAK'))
    .map(compiler)
    .join('')
    .trim();
}

function compiler({ type, payload }) {
  switch (type) {
    case 'DOCUMENT':
      return compileChildren(payload.blocks);
    case 'LINE':
      return '<hr>';
    case 'LINE_BREAK':
      return '<br>';
    case 'TITLE':
      assert(
        1 <= payload.level && payload.level <= 6,
        'level of title must be between 1 to 6'
      );
      return wrap(`h${payload.level}`, compileChildren(payload.children));
    case 'PARAGRAPH':
      return wrap('p', compileChildren(payload.children));
    case 'LINK':
      return wrap(
        'a',
        compileChildren(payload.children),
        {href: payload.address}
      );
    case 'IMAGE':
      return `
        <img src="${payload.url}" alt="${payload.alt}">
      `.trim();
    case 'WORD':
    default:
      return payload.value;
  }
};
module.exports = compiler;

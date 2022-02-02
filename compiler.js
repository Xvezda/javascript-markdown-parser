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
      return '<br>'.repeat(payload.count);
    case 'TITLE':
      return wrap(`h${payload.level}`, payload.content.trim());
    case 'SENTENCE':
      return wrap('p', payload.value.replace(/\s/g, ' '));
  }
};

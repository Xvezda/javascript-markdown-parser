function getType(token) {
  if (token === '#') {
    return 'SHARP';
  } else if (token === '-') {
    return 'DASH';
  } else if (token === '=') {
    return 'EQUAL';
  } else if (/ +/.test(token)) {
    return 'SPACE';
  } else if (/\n+/.test(token)) {
    return 'LINE_BREAK';
  } else if (token === '(') {
    return 'OPEN_PAREN';
  } else if (token === ')') {
    return 'CLOSE_PAREN';
  } else if (token === '[') {
    return 'OPEN_BRACKET';
  } else if (token === ']') {
    return 'CLOSE_BRACKET';
  } else {
    return 'WORD';
  }
}

module.exports = function lexer(tokens) {
  return tokens.map(token => ({
    type: getType(token),
    payload: {
      value: token
    }
  }));
};


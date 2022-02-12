function getType(token) {
  if (token === '#') {
    return 'SHARP';
  } else if (token === '-') {
    return 'DASH';
  } else if (token === '=') {
    return 'EQUAL';
  } else if (token === '!') {
    return 'BANG';
  } else if (/ +/.test(token)) {
    return 'SPACE';
  } else if (/\n+/.test(token)) {
    return 'LINE_BREAK';
  } else if (token === '(') {
    return 'OPEN_PAREN';
  } else if (token === ')') {
    return 'CLOSE_PAREN';
  } else if (token === '[') {
    return 'OPEN_BRACK';
  } else if (token === ']') {
    return 'CLOSE_BRACK';
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


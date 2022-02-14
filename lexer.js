function getType(token) {
  if (/ +/.test(token)) {
    return 'SPACE';
  } else if (/\n+/.test(token)) {
    return 'LINE_BREAK';
  }
  switch (token) {
    case '#':
      return 'SHARP';
    case '-':
      return 'DASH';
    case '=':
      return 'EQUAL';
    case '!':
      return 'BANG';
    case '(':
      return 'OPEN_PAREN';
    case ')':
      return 'CLOSE_PAREN';
    case '[':
      return 'OPEN_BRACK';
    case ']':
      return 'CLOSE_BRACK';
    case '`':
      return 'BACKTICK';
    default:
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


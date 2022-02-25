function getType(token) {
  if (/ +/.test(token)) {
    return 'SPACE';
  }
  switch (token) {
    case '*':
      return 'ASTERISK';
    case '#':
      return 'SHARP';
    case '-':
      return 'DASH';
    case '_':
      return 'UNDERSCORE';
    case '=':
      return 'EQUAL';
    case '!':
      return 'BANG';
    case '(':
      return 'LEFT_PARENTHESIS';
    case ')':
      return 'RIGHT_PARENTHESIS';
    case '[':
      return 'LEFT_BRACKET';
    case ']':
      return 'RIGHT_BRACKET';
    case '<':
      return 'LEFT_CHEVRON';
    case '>':
      return 'RIGHT_CHEVRON';
    case '`':
      return 'BACKTICK';
    case '\n':
      return 'LINE_BREAK';
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


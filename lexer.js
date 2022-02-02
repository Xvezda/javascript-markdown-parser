function getType(token) {
  if (/\#+/.test(token)) {
    return 'TITLE';
  } else if (/\-{3,}/.test(token)) {
    return 'LINE';
  } else if (/ +/.test(token)) {
    return 'SPACE';
  } else if (/\n+/.test(token)) {
    return 'LINEBREAK';
  } else {
    return 'WORD';
  }
}

module.exports = function lexer(tokens) {
  return tokens.map(token => ({ type: getType(token), value: token }));
};


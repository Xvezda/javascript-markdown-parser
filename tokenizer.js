module.exports = function tokenizer(text) {
  return text.match(
    /[\#\-\=\*\(\)\[\]\!]| +|\n+|[^\s\!-\-\[-`]+/g);
};

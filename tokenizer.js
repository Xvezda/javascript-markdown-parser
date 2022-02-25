module.exports = function tokenizer(text) {
  return text.match(/[-_=*#!`<>()\[\]\n]| +|[^\s\!-\-\[-`]+/g);
};

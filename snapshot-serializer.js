const prettier = require('prettier');

module.exports = {
  test: function (val) {
    return typeof val === 'string';
  },
  serialize: function (val) {
    return prettier.format(val, { parser: 'html' }).trim();
  }
};

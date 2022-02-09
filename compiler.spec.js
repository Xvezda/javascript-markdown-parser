const tokenizer = require('./tokenizer.js');
const lexer = require('./lexer.js');
const parser = require('./parser.js');
const compiler = require('./compiler.js');

const md = `\
# hello world
## hi

foobar
---
egg
ham
spam

link to [Google](http://google.com)
`;

test('마크다운 변환', () => {
  const tokens = lexer(tokenizer(md));
  const ast = parser(tokens);
  const html = compiler(ast);

  expect(html).toMatchSnapshot();
});

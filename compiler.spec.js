const tokenizer = require('./tokenizer.js');
const lexer = require('./lexer.js');
const parser = require('./parser.js');
const compiler = require('./compiler.js');

function mdToHtml(md) {
  const tokens = lexer(tokenizer(md));
  const ast = parser(tokens);
  const html = compiler(ast);
  return html;
}

test('복합 마크다운 변환', () => {
  const md = `\
# hello world
## hi

foobar
---
egg
ham
spam

link to [Google](http://google.com)`;

  expect(mdToHtml(md)).toMatchSnapshot();
});

test('제목 변환', () => {
  expect(mdToHtml('# foo')).toMatch('<h1>foo</h1>');
  expect(mdToHtml('## foo')).toMatch('<h2>foo</h2>');
  expect(mdToHtml('### foo')).toMatch('<h3>foo</h3>');
  expect(mdToHtml('#### foo')).toMatch('<h4>foo</h4>');
  expect(mdToHtml('##### foo')).toMatch('<h5>foo</h5>');
  expect(mdToHtml('###### foo')).toMatch('<h6>foo</h6>');

  const h1 = `\
foo
===
`;
  expect(mdToHtml(h1)).toMatch('<h1>foo</h1>')

  const h2 = `\
foo
---
`;
  expect(mdToHtml(h2)).toMatch('<h2>foo</h2>');
});

test('줄바꿈', () => {
  const br = `\
foo
bar
`;
  expect(mdToHtml(br)).toMatchSnapshot();

  const p = `\
foo

bar
`;
  expect(mdToHtml(p)).toMatchSnapshot();
});

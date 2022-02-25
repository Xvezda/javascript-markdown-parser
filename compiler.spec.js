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

const markdown = (strings, ...args) =>
  mdToHtml(
    strings[0] + strings
      .slice(1)
      .reduce((acc, s, i) => acc + args[i] + s, ''));

test('복합 마크다운 변환', () => {
  expect(markdown`\
# hello world
## hi

foobar
---
egg
ham
spam

link to [Google](http://google.com)`).toMatchSnapshot();
});

test('제목 변환', () => {
  expect(markdown`# foo`).toMatch('<h1>foo</h1>');
  expect(markdown`## foo`).toMatch('<h2>foo</h2>');
  expect(markdown`### foo`).toMatch('<h3>foo</h3>');
  expect(markdown`#### foo`).toMatch('<h4>foo</h4>');
  expect(markdown`##### foo`).toMatch('<h5>foo</h5>');
  expect(markdown`###### foo`).toMatch('<h6>foo</h6>');

  const h1 = markdown`\
foo
===
`;
  expect(h1).toMatch('<h1>foo</h1>')

  const h2 = markdown`\
foo
---
`;
  expect(h2).toMatch('<h2>foo</h2>');
});

test('올바르지 않은 제목 문법 처리', () => {
  const noSpace = markdown`#foo`;
  expect(noSpace).toMatchSnapshot();

  const invalidLine = markdown`\
foo
---=
`
  expect(invalidLine).toMatchSnapshot();

  const spaceBetween = markdown`\
foo
--- -
`;
  expect(spaceBetween).toMatchSnapshot();

  const levelSeven = markdown`${'#'.repeat(7)} foo`;
  expect(levelSeven).toMatchSnapshot();
});

test('줄바꿈', () => {
  const br = markdown`\
foo
bar
`;
  expect(br).toMatchSnapshot();

  const p = markdown`\
foo

bar
`;
  expect(p).toMatchSnapshot();

  const nop = markdown`\



foo
`;
  expect(nop).toMatchSnapshot();
});

test('링크', () => {
  expect(markdown`[google](https://www.google.com)`).toMatchSnapshot();
});

test('링크 예외 처리', () => {
  expect(markdown`[]()`).toMatch('<a href=""></a>');
  expect(markdown`[] ()`).toMatch('[] ()');
});

test('이미지', () => {
  expect(markdown`![random image](https://unsplash.it/100)`)
    .toMatchSnapshot();
});

test('이미지 예외 처리', () => {
  expect(markdown`![]()`).toMatch('<img src="" alt="">');
  expect(markdown`![] ()`).toMatch('![] ()');
  expect(markdown`! []()`).toMatch('! <a href=""></a>');
  expect(markdown`! [] ()`).toMatch('! [] ()');
});

test('인라인 코드', () => {
  expect(markdown`\`foo\``).toMatch('<code>foo</code>');

  expect(markdown`\`<b>foo</b>\``)
    .toMatch('<code>&lt;b&gt;foo&lt;/b&gt;</code>');
});

test('인라인 코드 예외 처리', () => {
  expect(markdown`\`\`foo\`\``).toMatch('<code>foo</code>');
  expect(markdown`\`\`foo\``).toMatch('``foo`');
  expect(markdown`\`foo\`\``).toMatch('`foo``');
  expect(markdown`\`foo\`\`bar\`baz\``).toMatch('<code>foo``bar</code>baz`');
  expect(markdown`\`\`foo\`\`bar\`baz\``)
    .toMatch('<code>foo</code>bar<code>baz</code>');
});

test('코드 블럭', () => {
  let code = markdown`\
\`\`\`
foo
\`\`\`
`;
  expect(code).toMatch(`\
<pre><code>foo</code></pre>`);

  code = markdown`\
\`\`\`
foo
bar
\`\`\`
`;
  expect(code).toMatch(`\
<pre><code>foo
bar</code></pre>`);

  code = markdown`\
\`\`\`
foo
<>
bar
\`\`\`
`;
  expect(code).toMatch(`\
<pre><code>foo
&lt;&gt;
bar</code></pre>`);

  code = markdown`\
\`\`\`


foo
\`\`\`
`;
  expect(code).toMatch(`\
<pre><code>

foo</code></pre>`);
});

test('가로줄', () => {
  expect(markdown`---`).toBe('<hr>');
  expect(markdown` - - -`).toBe('<hr>');
  expect(markdown`- - -`).toBe('<hr>');
  expect(markdown`  -  - -  `).toBe('<hr>');
  expect(markdown`-  -- -  - `).toBe('<hr>');
  expect(markdown`***`).toBe('<hr>');
  expect(markdown`  ***`).toBe('<hr>');
  expect(markdown`* * *`).toBe('<hr>');
  expect(markdown` *   * **   *`).toBe('<hr>');
});

test('가로줄 예외 처리', () => {
  expect(markdown`**`).toMatch('**');
  expect(markdown`--`).toMatch('--');
  expect(markdown`**-`).toMatch('**-');
  expect(markdown`***-`).toMatch('***-');
  // TODO:
  // expect(markdown`* - *`)
  // expect(markdown`- - - *`)
  // expect(markdown`* * * * -`)
});

test('이탤릭 스타일 텍스트', () => {
  expect(markdown`*hello*`).toMatch('<em>hello</em>');
  expect(markdown`_hello_`).toMatch('<em>hello</em>');
});

test('이탤릭 스타일 텍스트 예외 처리', () => {
  expect(markdown`foo*bar*`).toMatch('foo<em>bar</em>');
  expect(markdown`foo_bar_`).toMatch('foo_bar_');
  expect(markdown`foo _bar_`).toMatch('foo <em>bar</em>');
  expect(markdown`*foo *`).toMatch('*foo *');
  expect(markdown`_foo _`).toMatch('_foo _');
  expect(markdown`*foo bar*`).toMatch('<em>foo bar</em>');
  expect(markdown`_foo bar_`).toMatch('<em>foo bar</em>');
  expect(markdown`*foo*bar*`).toMatch('<em>foo</em>bar*');
  expect(markdown`_foo_bar_`).toMatch('<em>foo_bar</em>');
  expect(markdown`_ _`).toMatch('_ _');
  // TODO:
  // expect(markdown`* *`)
});

test('인용문', () => {
  expect(markdown`> foo`).toBe('<blockquote><p>foo</p></blockquote>');
});

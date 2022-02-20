function peek(tokens, index) {
  if (!tokens[index]) {
    return {
      type: 'END',
      payload: {
        value: null
      }
    }
  }
  return tokens[index];
}

const skip = condition => (tokens, index) => {
  let i;
  for (
    i = index;
    i < tokens.length &&
    (typeof condition === 'function' ?
    condition(tokens, i) :
    tokens[i].type === condition);
    ++i
  );
  return i;
};

const skipWhitespace = skip((tokens, i) =>
  tokens[i].type === 'SPACE' || tokens[i].type === 'LINE_BREAK');

function handleLine(tokens, index) {
  const nonSpaceIdx = (tokens, i) => skip('SPACE')(tokens, i);

  let i = nonSpaceIdx(tokens, index+1);
  if (peek(tokens, i).type === 'DASH') {
    i = nonSpaceIdx(tokens, i+1);
    if (peek(tokens, i).type === 'DASH') {
      return [
        { type: 'LINE' },
        skipWhitespace(tokens, i+1)
      ];
    }
  }
  return [null, index];
}

function handleTitle(tokens, index) {
  let i = index;
  if (tokens[i].type !== 'SHARP') {
    return [null, index];
  }

  for (; i < tokens.length; ++i) {
    if (tokens[i].type !== 'SHARP')
      break;
  }
  if (tokens[i].type !== 'SPACE') {
    return [null, index];
  }

  const level = i - index;
  if (6 < level) {
    return [null, index];
  }

  const children = [];
  for (; i < tokens.length; ++i) {
    if (tokens[i].type === 'LINE_BREAK') {
      break;
    }
    children.push(tokens[i]);
  }
  return [
    {
      type: 'TITLE',
      payload: {
        level,
        children,
      }
    },
    skipWhitespace(tokens, i)
  ];
}

function handleCode(tokens, index) {
  const children = [];

  let i = index;
  if (
    tokens[i].type === 'BACKTICK' &&
    peek(tokens, i+1).type === 'BACKTICK' &&
    peek(tokens, i+2).type === 'BACKTICK' &&
    peek(tokens, i+3).type === 'LINE_BREAK'
  ) {
    for (i = i + 4; i < tokens.length; ++i) {
      if (
        tokens[i].type === 'LINE_BREAK' &&
        peek(tokens, i+1).type === 'BACKTICK' &&
        peek(tokens, i+2).type === 'BACKTICK' &&
        peek(tokens, i+3).type === 'BACKTICK'
      ) {
        i += 4;
        break;
      }
      children.push(tokens[i]);
    }
  } else {
    return [null, index];
  }

  return [
    {
      type: 'CODE',
      payload: {
        children,
      }
    },
    i,
  ];
}

function handleLink(tokens, index) {
  const children = [];

  let i;
  for (i = index + 1; i < tokens.length; ++i) {
    if (tokens[i].type === 'CLOSE_BRACK') {
      ++i;
      break;
    }
    children.push(tokens[i]);
  }

  if (tokens[i].type !== 'OPEN_PAREN') {
    return [null, index];
  }
  ++i;

  let address = '';
  for (; i < tokens.length; ++i) {
    if (tokens[i].type === 'CLOSE_PAREN') {
      ++i;
      break;
    }
    address += tokens[i].payload.value;
  }

  return [
    {
      type: 'LINK',
      payload: {
        address,
        children: handleInline(children),
      }
    },
    i
  ];
}

function handleInlineCode(tokens, index) {
  const children = [];
  const skipBacktick = skip('BACKTICK');

  const count = skipBacktick(tokens, index) - index;
  let i = index + count;

  while (i < tokens.length) {
    if (tokens[i].type === 'BACKTICK') {
      const skipIdx = skipBacktick(tokens, i);
      if (count !== skipIdx - i) {
        children.push(...tokens.slice(i, skipIdx));
        i = skipIdx;
        continue;
      }

      return [
        {
          type: 'INLINE_CODE',
          payload: {
            code: children
              .map(child => child.payload.value)
              .join(''),
          }
        },
        skipIdx,
      ];
    }
    children.push(tokens[i]);
    ++i;
  }
  return [null, i];
}

function handleInline(tokens) {
  const children = [];
  for (let i = 0; i < tokens.length;) {
    switch (tokens[i].type) {
      case 'BANG': {
        if (peek(tokens, i+1).type === 'OPEN_BRACK') {
          const [link, index] = handleLink(tokens, i+1);
          if (!link) {
            children.push(tokens[i]);
            ++i;
            continue;
          }
          children.push({
            type: 'IMAGE',
            payload: {
              url: link.payload.address,
              alt: link.payload.children
                .map(({ payload }) => payload.value).join(''),
            },
          });
          i = index;
        }
        break;
      }
      case 'OPEN_BRACK': {
        const [link, index] = handleLink(tokens, i);
        if (!link) {
          children.push(tokens[i]);
          ++i;
          continue;
        }
        children.push(link);
        i = index;
        break;
      }
      case 'BACKTICK': {
        const [code, index] = handleInlineCode(tokens, i);
        if (!code) {
          children.push(...tokens.slice(i, index));
          i = index;
          continue;
        }
        children.push(code);
        i = index;
        break;
      }
      default:
        children.push(tokens[i]);
        ++i;
        break;
    }
  }
  return children;
}

function handleWord(tokens, index) {
  const children = [];
  let i;
  for (i = index; i < tokens.length; ++i) {
    if (tokens[i].type === 'LINE_BREAK') {
      if (
        peek(tokens, i+1).type === 'EQUAL' ||
        peek(tokens, i+1).type === 'DASH'
      ) {
        const type = peek(tokens, i+1).type;
        const skipped = skip(type)(tokens, i+1);
        if (tokens[skipped].type === 'LINE_BREAK') {
          return [
            {
              type: 'TITLE',
              payload: {
                level: ({'EQUAL': 1, 'DASH': 2})[type],
                children: handleInline(children),
              }
            },
            skipWhitespace(tokens, skipped),
          ];
        }
      }
    }
    if (
      tokens[i].type === 'LINE_BREAK' &&
      peek(tokens, i+1).type === 'LINE_BREAK' ||
      tokens[i].type === 'LINE'
    ) {
      break;
    }
    children.push(tokens[i]);
  }

  return [
    {
      type: 'PARAGRAPH',
      payload: {
        children: handleInline(children),
      }
    },
    skipWhitespace(tokens, i),
  ];
}

function parser(tokens) {
  const blocks = [];
  for (let i = 0; i < tokens.length; ) {
    const token = tokens[i];
    switch (token.type) {
      case 'DASH': {
        const [line, index] = handleLine(tokens, i);
        if (line) {
          blocks.push(line);
          i = index;
          continue;
        }
        // fallthrough
      }
      case 'SHARP': {
        const [block, index] = handleTitle(tokens, i);
        if (block) {
          blocks.push(block);
          i = index;
          continue;
        }
        // fallthrough
      }
      case 'BACKTICK': {
        const [block, index] = handleCode(tokens, i);
        if (block) {
          blocks.push(block);
          i = index;
          continue;
        }
        // fallthrough
      }
      case 'BANG':
      case 'OPEN_BRACK':
      case 'WORD': {
        const [block, index] = handleWord(tokens, i);
        blocks.push(block);
        i = index;
        continue;
      }
      case 'SPACE': {
        i = skip('SPACE')(tokens, i);
        continue;
      }
      case 'LINE_BREAK':
        i = skipWhitespace(tokens, i);
        break;
      default:
        throw new Error(
          `unexpected token: ${i}:${token.type}:${token.payload.value}`);
    }
  }

  return {
    type: 'DOCUMENT',
    payload: {
      blocks,
    }
  };
}
module.exports = parser;

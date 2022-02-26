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

const nonSpaceIdx = (tokens, i) => skip('SPACE')(tokens, i);

function handleLine(tokens, index) {
  const token = peek(tokens, index);
  let i = nonSpaceIdx(tokens, index+1);
  if (peek(tokens, i).type === token.type) {
    i = nonSpaceIdx(tokens, i+1);
    if (peek(tokens, i).type === token.type) {
      const skipPattern = skip((tokens, i) =>
        tokens[i].type === 'SPACE' || tokens[i].type === token.type);

      i = skipPattern(tokens, i);
      if (
        peek(tokens, i).type === 'LINE_BREAK' ||
        peek(tokens, i).type === 'END'
      ) {
        return [
          { type: 'LINE' },
          skipWhitespace(tokens, i+1)
        ];
      }
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
  if (peek(tokens, i).type !== 'SPACE') {
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
    if (tokens[i].type === 'RIGHT_BRACKET') {
      ++i;
      break;
    }
    children.push(tokens[i]);
  }

  if (peek(tokens, i).type !== 'LEFT_PARENTHESIS') {
    return [null, index];
  }
  ++i;

  let address = '';
  for (; i < tokens.length; ++i) {
    if (tokens[i].type === 'RIGHT_PARENTHESIS') {
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

function handleItalic(tokens, index) {
  /**
   * ASTERISK: Lazy
   * UNDERSCORE: Greedy
   */
  const type = tokens[index].type;
  if (
    type === 'UNDERSCORE' &&
    peek(tokens, index-1).type !== 'SPACE' &&
    peek(tokens, index-1).type !== 'END'
  ) {
    return [null, index+1];
  }
  const skipNonType = skip((tokens, i) =>
    tokens[i].type !== type && tokens[i].type !== 'LINE_BREAK');
  const skippedIdx = (() => {
    let idx = skipNonType(tokens, index+1);
    if (type === 'ASTERISK') {
      return idx;
    }

    do {
      const nextIdx = skipNonType(tokens, idx+1);
      const nextToken = peek(tokens, nextIdx);
      if (
        nextToken.type === 'LINE_BREAK' ||
        nextToken.type === 'END'
      ) {
        break;
      }
      idx = skipNonType(tokens, idx+1);
    } while (true);

    return idx;
  })();

  if (
    peek(tokens, skippedIdx).type === 'LINE_BREAK' ||
    peek(tokens, skippedIdx).type === 'END' ||
    peek(tokens, skippedIdx-1).type === 'SPACE'
  ) {
    return [null, skippedIdx+1];
  }
  const children = tokens.slice(index+1, skippedIdx);
  return [
    {
      type: 'ITALIC',
      payload: {
        children,
      }
    },
    skippedIdx + 1,
  ];
}

function handleStyledText(tokens, index) {
  const type = tokens[index].type;
  const skipType = skip(type);

  const skippedIdx = skipType(tokens, index);
  const count = skippedIdx - index;
  switch (count) {
    case 1:
      return handleItalic(tokens, index);
    // TODO: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#styling-text
    default:
      return [null, skippedIdx];
  }
}

function handleInline(tokens) {
  const children = [];
  for (let i = 0; i < tokens.length;) {
    switch (tokens[i].type) {
      case 'BANG': {
        if (peek(tokens, i+1).type === 'LEFT_BRACKET') {
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
        } else {
          children.push(tokens[i]);
          ++i;
        }
        break;
      }
      case 'LEFT_BRACKET': {
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
      case 'UNDERSCORE':
      case 'ASTERISK': {
        const [text, index] = handleStyledText(tokens, i);
        if (!text) {
          children.push(...tokens.slice(i, index));
          i = index;
          continue;
        }
        children.push(text);
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
      if (peek(tokens, i+1).type === 'LINE_BREAK')
        break;

      if (
        peek(tokens, i+1).type === 'EQUAL' ||
        peek(tokens, i+1).type === 'DASH'
      ) {
        const type = peek(tokens, i+1).type;
        const skipped = skip(type)(tokens, i+1);
        if (peek(tokens, skipped).type === 'LINE_BREAK') {
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
        const skipLinePattern = skip((tokens, i) =>
          tokens[i].type === type || tokens[i].type === 'SPACE');
        const isLine = (tokens, i) =>
          peek(tokens, skipLinePattern(tokens, i)).type === 'LINE_BREAK';

        if (isLine(tokens, skipped))
          break;
      }
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

function handleBlockquote(tokens, index) {
  const [block, i] = handleWord(tokens, index+1);
  return [
    {
      type: 'BLOCKQUOTE',
      payload: {
        children: [block],
      }
    },
    i,
  ];
}

function parser(tokens) {
  const blocks = [];
  for (let i = 0; i < tokens.length; ) {
    const token = tokens[i];
    switch (token.type) {
      case 'LINE_BREAK':
        i = skipWhitespace(tokens, i);
        continue;
      case 'SPACE': {
        i = skip('SPACE')(tokens, i);
        continue;
      }
      case 'RIGHT_CHEVRON': {
        const [block, index] = handleBlockquote(tokens, i+1);
        blocks.push(block);
        i = index;
        continue;
      }
      case 'ASTERISK':
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
      case 'LEFT_BRACKET':
      case 'WORD':
      default: {
        const [block, index] = handleWord(tokens, i);
        blocks.push(block);
        i = index;
      }
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

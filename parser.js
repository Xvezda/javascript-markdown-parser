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

function skipWhitespace(tokens, index) {
  let i;
  for (
    i = index;
    peek(tokens, i).type === 'SPACE' ||
    peek(tokens, i).type === 'LINE_BREAK';
    ++i
  );
  return i;
}

function handleTitle(tokens, index) {
  const children = [];
  let i;
  for (i = index + 1; i < tokens.length; ++i) {
    if (tokens[i].type === 'LINE_BREAK') {
      break;
    }
    children.push(tokens[i]);
  }
  return [
    {
      type: 'TITLE',
      payload: {
        level: tokens[index].payload.value.length,
        children,
      }
    },
    skipWhitespace(tokens, i)
  ];
}

function handleLink(tokens, index) {
  const children = [];

  let i;
  for (i = index + 1; i < tokens.length; ++i) {
    if (tokens[i].type === 'CLOSE_BRACKET') {
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

function handleInline(tokens) {
  const children = [];
  for (let i = 0; i < tokens.length; ++i) {
    switch (tokens[i].type) {
      case 'OPEN_BRACKET':
        const [link, index] = handleLink(tokens, i);
        if (!link) {
          children.push(tokens[i]);
          ++i;
          continue;
        }
        children.push(link);
        i = index;
        break;
      default:
        children.push(tokens[i]);
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
      if (peek(tokens, i+1).type === 'LINE') {
        return [
          {
            type: 'TITLE',
            payload: {
              level: 2,
              children: handleInline(children),
            }
          },
          skipWhitespace(tokens, i + 2),
        ];
      }
    }
    if (
      tokens[i].type === 'LINE_BREAK' &&
      tokens[i].payload.value.length > 1 ||
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
      case 'TITLE': {
        const [block, index] = handleTitle(tokens, i);
        blocks.push(block);
        i = index;
        continue;
      }
      case 'LINE':
        blocks.push({ type: 'LINE' });
        i = skipWhitespace(tokens, i+1);
        continue;
      case 'SPACE':
      case 'WORD': {
        const [block, index] = handleWord(tokens, i);
        blocks.push(block);
        i = index;
        continue;
      }
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

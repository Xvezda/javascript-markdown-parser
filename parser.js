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

function handleTitle(tokens, index) {
  let i;
  for (i = index; i < tokens.length; ++i) {
    if (tokens[i].type !== 'SHARP')
      break;
  }
  if (tokens[i].type !== 'SPACE') {
    return [null, index];
  }
  const level = i - index;
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
      case 'BANG': {
        if (peek(tokens, i+1).type === 'OPEN_BRACKET') {
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
      case 'OPEN_BRACKET': {
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
      if (
        peek(tokens, i+1).type === 'EQUAL' ||
        peek(tokens, i+1).type === 'DASH'
      ) {
        const type = peek(tokens, i+1).type;
        i = skip(type)(tokens, i+1);
        return [
          {
            type: 'TITLE',
            payload: {
              level: ({'EQUAL': 1, 'DASH': 2})[type],
              children: handleInline(children),
            }
          },
          skipWhitespace(tokens, i),
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
      case 'DASH':
        if (
          peek(tokens, i+1).type === 'DASH' &&
          peek(tokens, i+2).type === 'DASH'
        ) {
          blocks.push({ type: 'LINE' });
          i = skipWhitespace(tokens, i+1);
          continue;
        }
        // fallthrough
      case 'SHARP': {
        const [block, index] = handleTitle(tokens, i);
        if (block) {
          blocks.push(block);
          i = index;
          continue;
        }
        // fallthrough
      }
      case 'BANG':
      case 'OPEN_BRACKET':
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

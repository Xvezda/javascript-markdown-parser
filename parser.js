function peek(tokens, index) {
  if (!tokens[index]) {
    return {
      type: 'EOF',
      value: null
    }
  }
  return tokens[index];
}

function skipWhitespace(tokens, index) {
  let i;
  for (
    i = index;
    peek(tokens, i).type === 'SPACE' ||
    peek(tokens, i).type === 'LINEBREAK';
    ++i
  );
  return i;
}

function handleTitle(tokens, index) {
  const children = [];
  let i;
  for (
    i = index + 1;
    i < tokens.length && tokens[i].type !== 'LINEBREAK';
    ++i
  ) {
    children.push({
      type: tokens[i].type,
      payload: {
        value: tokens[i].value,
      }
    });
  }
  return [
    {
      type: 'TITLE',
      payload: {
        level: tokens[index].value.length,
        children,
      }
    },
    skipWhitespace(tokens, i)
  ];
}

function handleWord(tokens, index) {
  let i;
  const words = [];
  for (i = index; i < tokens.length; ++i) {
    if (peek(tokens, i).type === 'LINEBREAK') {
      if (peek(tokens, i+1).type === 'LINE') {
        return [
          {
            type: 'TITLE',
            payload: {
              level: 2,
              children: words,
            }
          },
          i + 3
        ];
      }
      if (peek(tokens, i).value.length > 1) {
        ++i;
        break;
      }
    }
    words.push({
      type: tokens[i].type,
      payload: {
        value: tokens[i].value,
      }
    });
  }
  return [
    {
      type: 'PARAGRAPH',
      payload: {
        children: words,
      }
    },
    i
  ];
}

module.exports = function parser(tokens) {
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
        ++i;
        continue;
      case 'LINEBREAK': {
        if (tokens[i].value.length < 2) {
          blocks.push({
            type: 'LINEBREAK'
          });
        }
        ++i;
        continue;
      }
      case 'SPACE':
      case 'WORD':
        const [block, index] = handleWord(tokens, i);
        blocks.push(block);
        i = index;
        continue;
      default:
        throw new Error(
          `unexpected token: ${token.type}:${token.value}`);
    }
  }

  return {
    type: 'DOCUMENT',
    payload: {
      blocks,
    }
  };
}

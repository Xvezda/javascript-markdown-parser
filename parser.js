function peek(tokens, index) {
  if (!tokens[index]) {
    return {
      type: 'EOF',
      value: null
    }
  }
  return tokens[index];
}

function handleTitle(tokens, index) {
  const [block, i] = handleWord(tokens, index+1);

  return [
    {
      type: 'TITLE',
      payload: {
        level: tokens[index].value.length,
        content: block.payload.value,
      }
    },
    i
  ];
}

function handleLinebreak(tokens, index) {
  if (tokens[index].value.length < 2) {
    return [
      null,
      index + 1,
    ];
  }

  return [
    ({
      type: 'LINEBREAK',
      payload: {
        count: tokens[index].value.match(/\n{2}/g).length,
      }
    }),
    index + 1,
  ];
}

function handleWord(tokens, index) {
  const words = [];
  let i = index;
  while (
    peek(tokens, i).type === 'WORD' ||
    peek(tokens, i).type === 'SPACE' &&
    peek(tokens, i).value.length < 2 ||
    peek(tokens, i).type === 'LINEBREAK' &&
    peek(tokens, i).value.length < 2
  ) {
    words.push(tokens[i].value);
    ++i;
  }
  return [
    {
      type: 'SENTENCE',
      payload: {
        value: words.join(''),
      },
    },
    i,
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
        const [block, index] = handleLinebreak(tokens, i);
        if (!block) {
          ++i;
          continue;
        }
        blocks.push(block);
        i = index;
        continue;
      }
      case 'SPACE': {
        if (
          token.value.length === 2 &&
          peek(tokens, i+1).type === 'LINEBREAK'
        ) {
          blocks.push({
            type: 'LINEBREAK',
            payload: {
              count: peek(tokens, i+1).value.length,
            }
          });
          i += 2;
        } else {
          tokens.push({
            type: 'SPACE',
          });
          ++i;
        }
        break;
      }
      case 'WORD': {
        const [block, index] = handleWord(tokens, i);
        if (
          peek(tokens, index).type === 'LINE'
        ) {
          blocks.push({
            type: 'TITLE',
            payload: {
              level: 1,
              content: block.payload.value,
            }
          });
          i = index + 1;
        } else {
          blocks.push({
            type: 'SENTENCE',
            payload: {
              value: block.payload.value,
            }
          });
          i = index;
        }
        break;
      }
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


if ('undefined' === typeof window) {
  var Parser = require('..');
  var Grammar = require('grammarjs-grammar');
  var assert = require('assert');
} else {
  var Parser = require('grammarjs-parser');
  var Grammar = require('grammarjs-grammar');
  var assert = require('component-assert');
}

var grammar;

describe('parser', function(){
  it('should define string rules', function(){
    grammar = new Grammar('math');
    grammar.rule('math').match('1');
    assert.deepEqual(parse('1'), {
      type: '$rule',
      name: 'math',
      content: { type: '$string', content: '1' }
    });
  });

  it('should define sub-rules', function(){
    grammar = new Grammar('math');

    grammar.rule('math').match(':numb', ':plus', ':numb');
    grammar.rule('plus').match('+');
    grammar.rule('numb').match(/\d/);

    assert.deepEqual(parse('1+2'), {
      type: '$rule',
      name: 'math',
      content: [
        { type: '$rule', name: 'numb', content: { type: '$string', content: '1' } },
        { type: '$rule', name: 'plus', content: { type: '$string', content: '+' } },
        { type: '$rule', name: 'numb', content: { type: '$string', content: '2' } }
      ]
    });
  });

  it('should skip non-matching rules', function(){
    grammar = new Grammar('math');

    grammar.rule('math')
      .match(':numb', ':plus', ':numb')
      .match(':numb', ':minus', ':numb');
    
    grammar.rule('plus').match('+');
    grammar.rule('minus').match('-');
    grammar.rule('numb').match(/\d/);

    assert.deepEqual(parse('1-2'), {
      type: '$rule',
      name: 'math',
      content: [
        { type: '$rule', name: 'numb', content: { type: '$string', content: '1' } },
        { type: '$rule', name: 'minus', content: { type: '$string', content: '-' } },
        { type: '$rule', name: 'numb', content: { type: '$string', content: '2' } }
      ]
    });
  });

  it('should handle :rule+', function(){
    grammar = new Grammar('math');

    grammar.rule('math').match(':numb+', ':plus', ':numb+');
    grammar.rule('plus').match('+');
    grammar.rule('numb').match(/\d/);

    // not sure how this should work yet
    assert.deepEqual(parse('10+20'), {
      type: '$rule',
      name: 'math',
      content: [
        { type: '$array', content: [
          { type: '$rule', name: 'numb', content: { type: '$string', content: '1' } },
          { type: '$rule', name: 'numb', content: { type: '$string', content: '0' } }
        ] },
        { type: '$rule', name: 'plus', content: { type: '$string', content: '+' } },
        { type: '$array', content: [
          { type: '$rule', name: 'numb', content: { type: '$string', content: '2' } },
          { type: '$rule', name: 'numb', content: { type: '$string', content: '0' } }
        ] }
      ]
    });
  });

  it('should handle $:rule+', function(){
    grammar = new Grammar('math');

    grammar.rule('math').match('$:numb+', '$:plus', '$:numb+');
    grammar.rule('plus').match('+');
    grammar.rule('numb').match(/\d/);
    
    assert.deepEqual(parse('10+20'), {
      type: '$rule',
      name: 'math',
      content: [
        { type: '$array.join', content: [
          { type: '$rule', name: 'numb', content: { type: '$string', content: '1' } },
          { type: '$rule', name: 'numb', content: { type: '$string', content: '0' } }
        ] },
        { type: '$join', content:
          { type: '$rule', name: 'plus', content: { type: '$string', content: '+' } } },
        { type: '$array.join', content: [
          { type: '$rule', name: 'numb', content: { type: '$string', content: '2' } },
          { type: '$rule', name: 'numb', content: { type: '$string', content: '0' } }
        ] }
      ]
    });
  });

  it('should handle :rule* (zero or more)', function(){
    grammar = new Grammar('numbers');

    grammar.rule('numbers').match(':numb*');
    grammar.rule('numb').match(/\d/);

    assert.deepEqual(parse('123'), {
      type: '$rule',
      name: 'numbers',
      content:
        { type: '$array', content: [
          { type: '$rule', name: 'numb', content: { type: '$string', content: '1' } },
          { type: '$rule', name: 'numb', content: { type: '$string', content: '2' } },
          { type: '$rule', name: 'numb', content: { type: '$string', content: '3' } }
        ] }
    });
    assert.deepEqual(parse('7'), {
      type: '$rule',
      name: 'numbers',
      content: { type: '$array', content: [
        { type: '$rule', name: 'numb', content: { type: '$string', content: '7' } }
      ] }
    });
  });

  it('should handle :rule? (optional)', function(){
    grammar = new Grammar('plural');

    grammar.rule('plural').match('word', ':pluralized?', '!');
    grammar.rule('pluralized').match('s');

    assert.deepEqual(parse('words!'), {
      type: '$rule',
      name: 'plural',
      content: [
        { type: '$string', content: 'word' },
        { type: '$rule', name: 'pluralized', content:
          { type: '$string', content: 's' } },
        { type: '$string', content: '!' }
      ]
    });

    assert.deepEqual(parse('word!'), {
      type: '$rule',
      name: 'plural',
      content: [
        { type: '$string', content: 'word' },
        // TODO: something should change here
        { type: '$string', content: '' },
        { type: '$string', content: '!' }
      ]
    });

    assert(!parse('wor'));
    assert(!parse('word'));
    assert(!parse('words'));
  });

  it('should handle /\\d+/ (regexp one or more)', function(){
    grammar = new Grammar('math');

    grammar.rule('math').match(/\d+/, '+', /\d/);

    assert.deepEqual(parse('10+2'), {
      type: '$rule',
      name: 'math',
      content: [
        { type: '$string', content: '10' },
        { type: '$string', content: '+' },
        { type: '$string', content: '2' }
      ]
    });
  });

  it('should handle /\\d*/ (regexp zero or more)', function(){
    grammar = new Grammar('numbers');

    grammar.rule('numbers').match(/\d*/);

    parser = new Parser(grammar);
    assert(parse('123'));
    assert(parse('7'));
    // assert(isNaN(parser.parse('')));
  });

  it('should handle /words?/ (regexp optional)', function(){
    grammar = new Grammar('plural');

    grammar.rule('plural').match('word', /s?/, '!');

    assert.deepEqual(parse('words!'), {
      type: '$rule',
      name: 'plural',
      content: [
        { type: '$string', content: 'word' },
        { type: '$string', content: 's' },
        { type: '$string', content: '!' }
      ]
    });
    assert.deepEqual(parse('word!'), {
      type: '$rule',
      name: 'plural',
      content: [
        { type: '$string', content: 'word' },
        { type: '$string', content: '' },
        { type: '$string', content: '!' }
      ]
    });
    assert(!parse('wor'));
    assert(!parse('word'));
    assert(!parse('words'));
  });

  it('should not consume token if given !', function(){
    grammar = new Grammar('relation');

    grammar.rule('relation').match(/\d+/, ':gt', /\d+/);

    grammar.rule('gt').match(':character.gt', '!:character.gt');
    grammar.rule('character.gt').match('>');

    assert.deepEqual(parse('17>15'), {
      type: '$rule',
      name: 'relation',
      content: [
        { type: '$string', content: '17' },
        { type: '$rule', name: 'gt', content: [
          { type: '$rule', name: 'character.gt', content:
            { type: '$string', content: '>' } }
        ] },
        { type: '$string', content: '15' }
      ]
    });
  });

  it('should not consume token if given &', function(){
    grammar = new Grammar('relation');

    grammar.rule('relation').match(/\d+/, ':lt', /\d+/);
    grammar.rule('lt').match(':character.lt', '&:number');
    grammar.rule('character.lt').match('<');
    grammar.rule('number').match(/\d/);

    assert.deepEqual(parse('7<15'), {
      type: 'relation'
    });
  });

  it('should return joined strings by default if there are no expressions', function(){
    grammar = new Grammar('relation');

    grammar.rule('relation').match(/\d+/, '<', /\d+/);

    assert.deepEqual(parse('7<15'), {

    });
  });

  it('should return array of expression', function(){
    grammar = new Grammar('relation.array');

    grammar.rule('relation.array').match(':digits', '<', ':digits');
    grammar.rule('digits').match(/\d+/);

    assert.deepEqual(parse('7<15'), {
      type: 'relation.array',
      content: [
        { type: 'digits', content: '7' },
        { type: 'string', content: '<' },
        { type: 'digits', content: '15' }
    ]});
  });
});

function parse(str) {
  var parser = new Parser(grammar);
  return parser.parse(str);
}
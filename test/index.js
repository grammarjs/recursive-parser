
if ('undefined' === typeof window) {
  var Parser = require('..');
  var Grammar = require('grammarjs-grammar');
  var assert = require('assert');
} else {
  var Parser = require('grammarjs-parser');
  var Grammar = require('grammarjs-grammar');
  var assert = require('component-assert');
}

describe('expression', function(){
  it('should define string expressions', function(){
    var grammar = new Grammar('math');
    grammar.expression('math').match('1', parseInt);
    var parser = new Parser(grammar);
    var val = parser.parse('1');
    assert(1 === val);
  });

  it('should define sub-expressions', function(){
    var grammar = new Grammar('math');
    var expression = grammar.expression;

    expression('math').match(':numb', ':plus', ':numb', addition);
    expression('plus').match('+', value);
    expression('numb').match(/\d/, value);

    var parser = new Parser(grammar);
    var val = parser.parse('1+2');
    assert(3 === val);
  });

  it('should skip non-matching matchers', function(){
    var grammar = new Grammar('math');
    var expression = grammar.expression;

    expression('math')
      .match(':numb', ':plus', ':numb', addition)
      .match(':numb', ':minus', ':numb', subtraction);
    
    expression('plus')
      .match('+', value);

    expression('minus')
      .match('-', value);

    expression('numb')
      .match(/\d/, value);

    var parser = new Parser(grammar);
    var val = parser.parse('1-2');
    assert(-1 === val);
  });

  it('should handle :expression+', function(){
    var grammar = new Grammar('math');
    var expression = grammar.expression;

    expression('math').match(':numb+', ':plus', ':numb+', addition2);
    expression('plus').match('+', value);
    expression('numb').match(/\d/, value);

    var parser = new Parser(grammar);
    var val = parser.parse('10+20');
    assert(30 === val);
  });

  it('should handle :expression* (zero or more)', function(){
    var grammar = new Grammar('numbers');
    var expression = grammar.expression;

    expression('numbers').match(':numb*', ints);
    expression('numb').match(/\d/, value);

    var parser = new Parser(grammar);
    assert(123 === parser.parse('123'));
    assert(7 === parser.parse('7'));
    assert(isNaN(parser.parse('')));
  });

  it('should handle :expression? (optional)', function(){
    var grammar = new Grammar('plural');
    var expression = grammar.expression;

    expression('plural').match('word', ':pluralized?', '!', function(a, b, c){
      return a + b + c;
    });
    expression('pluralized').match('s', value);

    var parser = new Parser(grammar);
    assert('words!' == parser.parse('words!'));
    assert('word!' == parser.parse('word!'));
    assert(!parser.parse('wor'));
    assert(!parser.parse('word'));
    assert(!parser.parse('words'));
  });

  it('should handle /\\d+/ (regexp one or more)', function(){
    var grammar = new Grammar('math');
    var expression = grammar.expression;

    expression('math').match(/\d+/, '+', /\d/, addition);

    var parser = new Parser(grammar);
    var val = parser.parse('10+2');
    assert(12 === val);
  });

  it('should handle /\\d*/ (regexp zero or more)', function(){
    var grammar = new Grammar('numbers');
    var expression = grammar.expression;

    expression('numbers').match(/\d*/, parseInt);

    var parser = new Parser(grammar);
    assert(123 === parser.parse('123'));
    assert(7 === parser.parse('7'));
    assert(isNaN(parser.parse('')));
  });

  it('should handle /words?/ (regexp optional)', function(){
    var grammar = new Grammar('plural');
    var expression = grammar.expression;

    expression('plural').match('word', /s?/, '!', function(a, b, c){
      return a + b + c;
    });

    var parser = new Parser(grammar);
    assert('words!' == parser.parse('words!'));
    assert('word!' == parser.parse('word!'));
    assert(!parser.parse('wor'));
    assert(!parser.parse('word'));
    assert(!parser.parse('words'));
  });

  it('should handle :grammar:expression', function(){
    var nested = new Grammar('nested');
    nested.expression('nested')
      .match(':operator');
    nested.expression('operator')
      .match('+')
      .match('-');

    var grammar = new Grammar('math');
    grammar.use(nested);
    grammar.expression('math')
      .match(/\d+/, ':nested:operator', /\d+/, addition);

    var parser = new Parser(grammar);
    assert(3 == parser.parse('1+2'));
  });
});

function addition($1, $2, $3) {
  return parseInt($1) + parseInt($3);
}

function addition2($1, $2, $3) {
  return parseInt($1.join('')) + parseInt($3.join(''));
}

function subtraction($1, $2, $3) {
  return parseInt($1) - parseInt($3);
}

function value(val) {
  return val;
}

function ints(args) {
  return parseInt(args.join(''));
}
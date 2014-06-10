
if ('undefined' === typeof window) {
  var Parser = require('..');
  var Grammar = require('grammarjs-grammar');
  var assert = require('assert');
} else {
  var Parser = require('grammarjs-parser');
  var Grammar = require('grammarjs-grammar');
  var assert = require('component-assert');
}

describe('rule', function(){
  it('should define string rules', function(){
    var grammar = new Grammar('math');
    grammar.rule('math').match('1', parseInt);
    var parser = new Parser(grammar);
    var val = parser.parse('1');
    assert(1 === val);
  });

  it('should define sub-rules', function(){
    var grammar = new Grammar('math');
    var rule = grammar.rule;

    rule('math').match(':numb', ':plus', ':numb', addition);
    rule('plus').match('+', value);
    rule('numb').match(/\d/, value);

    var parser = new Parser(grammar);
    var val = parser.parse('1+2');
    assert(3 === val);
  });

  it('should skip non-matching matchers', function(){
    var grammar = new Grammar('math');
    var rule = grammar.rule;

    rule('math')
      .match(':numb', ':plus', ':numb', addition)
      .match(':numb', ':minus', ':numb', subtraction);
    
    rule('plus')
      .match('+', value);

    rule('minus')
      .match('-', value);

    rule('numb')
      .match(/\d/, value);

    var parser = new Parser(grammar);
    var val = parser.parse('1-2');
    assert(-1 === val);
  });

  it('should handle :rule+', function(){
    var grammar = new Grammar('math');
    var rule = grammar.rule;

    rule('math').match(':numb+', ':plus', ':numb+', addition2);
    rule('plus').match('+', value);
    rule('numb').match(/\d/, value);

    var parser = new Parser(grammar);
    var val = parser.parse('10+20');
    assert(30 === val);
  });

  it('should handle :rule* (zero or more)', function(){
    var grammar = new Grammar('numbers');
    var rule = grammar.rule;

    rule('numbers').match(':numb*', ints);
    rule('numb').match(/\d/, value);

    var parser = new Parser(grammar);
    assert(123 === parser.parse('123'));
    assert(7 === parser.parse('7'));
    assert(isNaN(parser.parse('')));
  });

  it('should handle :rule? (optional)', function(){
    var grammar = new Grammar('plural');
    var rule = grammar.rule;

    rule('plural').match('word', ':pluralized?', '!', function(a, b, c){
      return a + b + c;
    });
    rule('pluralized').match('s', value);

    var parser = new Parser(grammar);
    assert('words!' == parser.parse('words!'));
    assert('word!' == parser.parse('word!'));
    assert(!parser.parse('wor'));
    assert(!parser.parse('word'));
    assert(!parser.parse('words'));
  });

  it('should handle /\\d+/ (regexp one or more)', function(){
    var grammar = new Grammar('math');
    var rule = grammar.rule;

    rule('math').match(/\d+/, '+', /\d/, addition);

    var parser = new Parser(grammar);
    var val = parser.parse('10+2');
    assert(12 === val);
  });

  it('should handle /\\d*/ (regexp zero or more)', function(){
    var grammar = new Grammar('numbers');
    var rule = grammar.rule;

    rule('numbers').match(/\d*/, parseInt);

    var parser = new Parser(grammar);
    assert(123 === parser.parse('123'));
    assert(7 === parser.parse('7'));
    assert(isNaN(parser.parse('')));
  });

  it('should handle /words?/ (regexp optional)', function(){
    var grammar = new Grammar('plural');
    var rule = grammar.rule;

    rule('plural').match('word', /s?/, '!', function(a, b, c){
      return a + b + c;
    });

    var parser = new Parser(grammar);
    assert('words!' == parser.parse('words!'));
    assert('word!' == parser.parse('word!'));
    assert(!parser.parse('wor'));
    assert(!parser.parse('word'));
    assert(!parser.parse('words'));
  });

  it('should handle :grammar:rule', function(){
    var nested = new Grammar('nested');
    nested.rule('nested')
      .match(':operator');
    nested.rule('operator')
      .match('+')
      .match('-');

    var grammar = new Grammar('math');
    grammar.use(nested);
    grammar.rule('math')
      .match(/\d+/, ':nested:operator', /\d+/, addition);

    var parser = new Parser(grammar);
    assert(3 == parser.parse('1+2'));
  });

  it('should store a reference to rule, rule, and symbol', function(){
    var grammar = new Grammar('numbers');
    var rule = grammar.rule;

    var ctx = {};
    rule('numbers').match(/\d*/, function(){
      ctx.rule = this.rule;
      ctx.rule = this.rule;
      ctx.symbol = this.symbol;
    });

    var parser = new Parser(grammar);
    parser.parse('123');
    assert('numbers' == ctx.rule.name);
    assert(ctx.rule);
    assert(ctx.symbol.isRegExp);
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
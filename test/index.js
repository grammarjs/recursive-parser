
if ('undefined' === typeof window) {
  var Parser = require('..');
  var Grammar = require('grammarjs-grammar');
  var assert = require('assert');
} else {
  var Parser = require('grammarjs-parser');
  var Grammar = require('grammarjs-grammar');
  var assert = require('component-assert');
}

describe('parser', function(){
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

  it('should store a reference to rule, rule, and symbol', function(){
    var grammar = new Grammar('numbers');
    var rule = grammar.rule;

    var ctx = {};
    rule('numbers').match(/\d*/, function(){
      ctx.expression = this.expression;
      ctx.rule = this.rule;
      ctx.symbol = this.symbol;
    });

    var parser = new Parser(grammar);
    parser.parse('123');
    assert('numbers' == ctx.expression.name);
    assert(ctx.rule);
    assert(ctx.symbol.isRegExp);
  });

  it('should not consume token if given !', function(){
    var grammar = new Grammar('relation');
    var rule = grammar.rule;

    rule('relation')
      .match(/\d+/, ':gt', /\d+/, function($1, $2, $3){
        return parseInt($1) > parseInt($3);
      });

    rule('gt').match(':character.gt', '!:character.gt', value);
    rule('character.gt').match('>', value);

    var parser = new Parser(grammar);
    assert(parser.parse('17>15'));
  });

  it('should not consume token if given &', function(){
    var grammar = new Grammar('relation');
    var rule = grammar.rule;

    rule('relation')
      .match(/\d+/, ':lt', /\d+/, function($1, $2, $3){
        return parseInt($1) < parseInt($3);
      });

    rule('lt').match(':character.lt', '&:number', function(op){
      return op;
    });
    rule('character.lt').match('<', value);
    rule('number').match(/\d/, value);

    var parser = new Parser(grammar);
    assert(parser.parse('7<15'));
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
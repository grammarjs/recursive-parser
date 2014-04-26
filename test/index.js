
if ('undefined' === typeof window) {
  var Parser = require('..');
  var Grammar = require('parsejs-grammar');
  var assert = require('assert');
} else {
  var Parser = require('parsejs-parser');
  var Grammar = require('parsejs-grammar');
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

    var val = grammar.parse('1+2');
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

    var val = grammar.parse('1-2');
    assert(-1 === val);
  });

  it('should handle :expression+', function(){
    var grammar = new Grammar('math');
    var expression = grammar.expression;

    expression('math').match(':numb+', ':plus', ':numb+', addition);
    expression('plus').match('+', value);
    expression('numb').match(/\d/, value);

    var val = grammar.parse('10+20');
    assert(30 === val);
  });

  it('should handle :expression*');
  it('should handle :expression?');
  it('should handle :grammar:expression');
  it('should handle /\\d+/');

  // it('should define nested expressions', function(){
  //   var grammar = new Grammar('digits');
  //   var expression = grammar.expression;

  //   expression('digits').match(':digit+');
  //   expression('digit').match(/\d/);

  //   var val = grammar.parse('123');
  //   console.log(val);
  // });
});

function addition($1, $2, $3) {
  return parseInt($1) + parseInt($3);
}

function subtraction($1, $2, $3) {
  return parseInt($1) - parseInt($3);
}

function value(val) {
  return val;
}
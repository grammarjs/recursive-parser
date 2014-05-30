
var Parser = require('./');
var Grammar = require('grammarjs-grammar');

var grammar = new Grammar('math');
var expression = grammar.expression;

expression('math')
  .match(':addition', value);

expression('addition')
  .match(/\d+/, '+', /\d+/, function(left, operator, right){
    return parseInt(left) + parseInt(right);
  });

function value(val) {
  return val;
}

var parser = new Parser(grammar);
console.log(parser.parse('2+3'));
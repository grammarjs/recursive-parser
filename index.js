
/**
 * Expose `Parser`.
 */

module.exports = Parser;

/**
 * Parsing context.
 *
 * @param {Grammar} grammar
 * @api public
 */

function Parser(grammar) {
  this.grammar = grammar;
  this.pos = 0;
}

/**
 * Parse the string.
 *
 * @param {String} str Input string to parse.
 * @api public
 */

Parser.prototype.parse = function(str){
  var val = this.visitExpression(str, this.grammar.root, this.grammar);
  this.reset();
  return val;
};

/**
 * Parse expression.
 *
 * @param {String} str
 * @param {Expression} exp
 * @param {Grammar} grammar
 *
 * @api private
 */

Parser.prototype.visitExpression = function(str, exp, grammar){
  var rules = exp.rules;
  var rule;
  var val;

  for (var i = 0, n = rules.length; i < n; i++) {
    val = this.visitRule(str, rules[i], grammar);
    // blank string '' also counts
    if (null != val) return val;
  }
};

/**
 * Parse rule.
 *
 * @param {String} str
 * @param {Rule} rule
 * @param {Grammar} grammar
 *
 * @api private
 */

Parser.prototype.visitRule = function(str, rule, grammar){
  var args = [];
  var val;
  var pos = this.pos;

  for (var i = 0, n = rule.symbols.length - 1; i < n; i++) {
    val = this.visitSymbol(str, rule.symbols[i], grammar);
    if (null == val) {
      this.pos = pos; // reset
      return;
    }
    args.push(val);
  }

  return rule.apply(this, args);
};

/**
 * Parse symbol.
 *
 * @param {String} str
 * @param {Symbol} symbol
 * @param {Grammar} grammar
 *
 * @api private
 */

Parser.prototype.visitSymbol = function(str, symbol, grammar){
  if (symbol.isExpression) {
    var exp = symbol.grammar
      ? grammar.expressions[symbol.grammar].expressions[symbol.expression]
      : grammar.expressions[symbol.expression];

    if (symbol.many) {
      var pos = this.pos;
      var res = [];
      var val;

      while (val = this.visitExpression(str, exp, grammar)) {
        res.push(val);
      }

      if (symbol.oneOrMore && !res.length) {
        this.pos = pos;
        return;
      }
      return res;
    } else if (symbol.optional) {
      return this.visitExpression(str, exp, grammar) || '';
    } else {
      return this.visitExpression(str, exp, grammar);
    }
  } else {
    return symbol.parse(str, this);
  }
};

/**
 * Reset parser.
 *
 * @api public
 */

Parser.prototype.reset = function(){
  this.pos = 0;
  return this;
};
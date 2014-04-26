
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
 */

Parser.prototype.visitRule = function(str, rule, grammar){
  var args = [];
  var val;
  var pos = this.pos;

  for (var i = 0, n = rule.tokens.length - 1; i < n; i++) {
    val = this.visitToken(str, rule.tokens[i], grammar);
    if (null == val) {
      this.pos = pos; // reset
      return;
    }
    args.push(val);
  }

  return rule.apply(this, args);
};

/**
 * Parse token.
 */

Parser.prototype.visitToken = function(str, token, grammar){
  if (token.isExpression) {
    var exp = token.grammar
      ? grammar.expressions[token.grammar].expressions[token.expression]
      : grammar.expressions[token.expression];

    if (token.many) {
      var pos = this.pos;
      var res = [];
      var val;

      while (val = this.visitExpression(str, exp, grammar)) {
        res.push(val);
      }

      if (token.oneOrMore && !res.length) {
        this.pos = pos;
        return;
      }
      return res;
    } else if (token.optional) {
      return this.visitExpression(str, exp, grammar) || '';
    } else {
      return this.visitExpression(str, exp, grammar);
    }
  } else {
    return token.parse(str, this);
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
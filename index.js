
/**
 * Expose `Parser`.
 */

module.exports = Parser;

/**
 * Parsing context.
 *
 * @api private
 */

function Parser(grammar) {
  this.grammar = grammar;
  this.pos = 0;
}

/**
 * Parse the string.
 */

Parser.prototype.parse = function(str){
  return this.visitExpression(str, this.grammar.root);
};

/**
 * Parse expression.
 *
 * @param {String} str
 * @param {Expression} exp
 */

Parser.prototype.visitExpression = function(str, exp){
  var rules = exp.rules;
  var rule;
  var val;

  for (var i = 0, n = rules.length; i < n; i++) {
    val = this.visitRule(str, rules[i]);
    // blank string '' also counts
    if (null != val) return val;
  }
};

/**
 * Parse rule.
 */

Parser.prototype.visitRule = function(str, rule){
  var tokens = rule.tokens;
  var args = [];
  var val;

  for (var i = 0, n = tokens.length - 1; i < n; i++) {
    val = this.visitToken(str, tokens[i]);
    if (!val) return;
    args.push(val);
  }

  return rule.apply(this, args);
};

/**
 * Parse token.
 */

Parser.prototype.visitToken = function(str, token){
  if (token.isExpression) {

  } else {
    return token.parse(str, this);
  }
};

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
  var val = this.visitExpression(str, this.grammar.root);
  this.reset();
  return val;
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
  var args = [];
  var val;
  var pos = this.pos;

  for (var i = 0, n = rule.tokens.length - 1; i < n; i++) {
    val = this.visitToken(str, rule.tokens[i]);
    if (!val) {
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

Parser.prototype.visitToken = function(str, token){
  if (token.isExpression) {
    if (token.many) {
      var val;
      var res = [];
      var exp = this.grammar.expressions[token.name];
      var pos = this.pos;

      while (val = this.visitExpression(str, exp)) {
        res.push(val);
      }

      if (token.oneOrMore && !res.length) {
        this.pos = pos;
        return;
      }
      return res;
    } else if (token.optional) {

    } else {
      return this.visitExpression(str, this.grammar.expressions[token.name]);
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
};
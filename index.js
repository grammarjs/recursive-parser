
/**
 * Module dependencies.
 */

var fmt = require('util').format;

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
  var val;
  this.expression = exp;

  for (var i = 0, n = exp.rules.length; i < n; i++) {
    val = this.visitRule(str, exp.rules[i], grammar, exp);
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

Parser.prototype.visitRule = function(str, rule, grammar, exp){
  var pos = this.pos;
  var args = [];
  var val;
  this.rule = rule;

  for (var i = 0, n = rule.symbols.length - 1; i < n; i++) {
    val = this.visitSymbol(str, rule.symbols[i], grammar, exp);
    if (null == val && rule.symbols[i].matchAndIgnore) {
      args.push(val);
      continue;
    }
    // if we didnt get a value, and we don't have a flag to skip if not match
    if (null == val && !rule.symbols[i].notMatchAndIgnore) {
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

Parser.prototype.visitSymbol = function(str, symbol, grammar, parentExp){
  this.symbol = symbol;
  if (symbol.isExpression) {
    return this.parseExpression(symbol, str, grammar, parentExp);
  } else if (symbol.isString) {
    return this.parseString(symbol, str);
  } else if (symbol.isRegExp) {
    return this.parseRegExp(symbol, str);
  }
};

/**
 * Parse expression.
 *
 * @param {Symbol} symbol
 * @param {String} str
 * @param {Object} parser
 * @api private
 */

Parser.prototype.parseExpression = function(symbol, str, grammar, parentExp){
  var prev = this.expression;
  var exp = grammar.rules[symbol.expression];
  if (!exp) throw error("Expression '%s' is undefined (referenced in '%s')", symbol.expression, parentExp.name);

  if (symbol.many) {
    var pos = this.pos;
    var res = [];
    var val;

    while (val = this.visitExpression(str, exp, grammar)) {
      res.push(val);
    }

    this.expression = prev;

    if (symbol.onePlus && !res.length) {
      this.pos = pos;
      return;
    }
    return res;
  } else if (symbol.optional) {
    var res = this.visitExpression(str, exp, grammar) || '';
    this.expression = prev;
    return res;
  } else {
    var pos = this.pos;
    var res = this.visitExpression(str, exp, grammar);
    if (res && symbol.matchAndIgnore) {
      this.pos = pos;
      res = null;
    }
    this.expression = prev;
    return res;
  }
};

/**
 * Parse string.
 *
 * @param {Symbol} symbol
 * @param {String} str
 * @api private
 */

Parser.prototype.parseString = function(symbol, str){
  if (symbol.val === str.substr(this.pos, symbol.val.length)) {
    this.pos += symbol.val.length;
    return symbol.val;
  }
};

/**
 * Parse RegExp.
 *
 * @param {Symbol} symbol
 * @param {String} str
 * @api private
 */

Parser.prototype.parseRegExp = function(symbol, str){
  if (symbol.many) {
    var pos = this.pos;
    var res = [];

    while (symbol.pattern.test(str.charAt(this.pos))) {
      res.push(str.charAt(this.pos));
      this.pos++;
    }
    
    // reset if we want to match one or more but didn't find matches.
    if (symbol.onePlus && !res.length) {
      this.pos = pos;
      return;
    }
    
    return res.join('');
  } else if (symbol.pattern.test(str.charAt(this.pos))) {
    return str.charAt(this.pos++);
  } else if (symbol.optional) {
    return '';
  }
};

/**
 * Reset parser.
 *
 * @api public
 */

Parser.prototype.reset = function(){
  this.pos = 0;
  delete this.expression;
  delete this.rule;
  delete this.symbol;
  return this;
};

/**
 * Create a formatted error.
 *
 * @return {Erro}
 */

function error(msg) {
  return new Error(fmt.apply(fmt, arguments));
}
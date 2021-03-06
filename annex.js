/*!
 * annex 0.3.1+201609050820
 * https://github.com/ryanve/annex
 * @license MIT
 */
!function(root, name, make) {
  if (typeof module != 'undefined' && module.exports) module.exports = make();
  else root[name] = make();
}(this, 'annex', function() {

  var effin = annex.prototype = Annex.prototype;
  var chain = 'pushStack';
  var array = [];
  var concat = array.concat;
  var push = array.push;
  var markup = /<|&#?\w+;/;
  var resource = /<(?:script|style|link)/i;
  var cleaners = ['removeData', 'off'];
  var doc = document;
  var docElem = doc.documentElement;
  var textContent = 'textContent';
  var W3C = textContent in docElem;
  var element = 'element';
  var find = 'find';
  var html = 'html';
  var text = 'text';
  var inner = {};
  inner[text] = W3C ? textContent : 'innerText';
  inner[html] = 'innerHTML';

  /**
   * @constructor
   * @param {(Node|{length:number}|string|null)=} item
   * @param {(Node|{length:number}|null)=} context
   */
  function Annex(item, context) {
    this.length = 0;
    push.apply(this, prepare.call(context, item));
  }

  /**
   * @param {(Node|{length:number}|string|null)=} item
   * @param {(Node|{length:number}|null)=} context
   * @return {Annex}
   */
  function annex(item, context) {
    return new Annex(item, context);
  }

  function output(result, context) {
    return (context[chain] || annex)(result);
  }

  function prepare(inserts) {
    return typeof inserts == 'string' ? build(inserts, this) : collect(inserts);
  }

  function collect(o) {
    return null == o ? [] : o.nodeType || o.window == o ? [o] : o;
  }

  function first(o) {
    return null == o || o.nodeType || o.window == o ? o : o[0];
  }

  function flatten(stack) {
    return concat.apply(array, stack);
  }

  /**
   * @param {{length:number}} stack
   * @param {Function} fn
   * @param {*=} scope
   * @return {Array}
   */
  function map(stack, fn, scope) {
    for (var r = [], i = 0, l = stack.length; i < l;) r[i] = fn.call(scope, stack[i++]);
    return r;
  }

  /**
   * @param {{length:number}} stack
   * @param {Function|Object} fn
   * @param {?*=} scope
   * @param {?string=} call method
   */
  function each(stack, fn, scope, call) {
    call = call || 'call';
    for (var i = 0, l = stack.length; i < l;) fn[call](scope, stack[i++]);
    return stack;
  }

  /**
   * @param {{length:number}} stack
   * @param {Function} fn
   * @param {*=} scope
   */
  function eachApply(stack, fn, scope) {
    return each(stack, fn, scope, 'apply');
  }

  /**
   * @description Bulk insertion adapter. Nodes must be cloned to insert into secondary targets.
   * @param {{length:number}} targets
   * @param {Function} fn
   * @param {{length:number}} inserts
   */
  function bulk(targets, fn, inserts) {
    for (var i = 0, l = targets.length; i < l;) fn.call(i ? clone(inserts) : inserts, targets[i++]);
    return targets;
  }

  /**
   * @param {{length:number}} stack
   * @param {string} key
   * @return {string}
   */
  function readAll(stack, key) {
    return map(stack, function(v) {
      return v && v[key] || '';
    }).join('');
  }

  /**
   * @param {*=} o context
   * @return {Document}
   */
  function owner(o) {
    o = first(o);
    return o && (9 == o.nodeType ? o : o[o.window == o ? 'document' : 'ownerDocument']) || doc;
  }

  function select(target, context) {
    return (typeof target == 'string' ? output(doc, context)[find] : collect)(target);
  }

  function filter(stack, selector) {
    return typeof selector == 'string' ? stack['filter'](selector) : stack;
  }

  function invoke(method) {
    this[method] && this[method]();
  }

  /**
   * @param {{length:number}} stack
   * @param {string=} selector
   */
  function cleanup(stack, selector) {
    selector && !stack[find] || each(cleaners, invoke, selector ? stack[find](selector) : stack);
    return stack;
  }

  /**
   * @return {number|boolean}
   */
  function isNode(o) {
    return o && o.nodeType || false;
  }

  /**
   * @param {Node} parent
   * @return {Array}
   */
  function contents(parent) {
    for (var r = [], n = parent.firstChild; n; n = n.nextSibling) r.push(n);
    return r;
  }

  /**
   * @param {string} str
   * @param {(Node|{length:number}|null)=} context
   * @return {Array}
   */
  function build(str, context) {
    var nodes, parent;
    if (resource.test(str)) return [];
    if (!markup.test(str)) return [create[text](str, context)];
    parent = create[element]('div', context);
    parent[inner[html]] = str;
    nodes = contents(parent);
    empty(parent);
    return nodes;
  }

  /**
   * @param {Node|{length:number}} nodes
   * @return {string} markup
   */
  function tag(nodes) {
    var parent = create[element]('div', owner(nodes));
    appendTo.call(clone(nodes), parent);
    var markup = annex[html](parent);
    empty(parent);
    return markup;
  }

  /**
   * @param {Node|{length:number}} nodes
   * @return {Array} markup
   */
  function tags(nodes) {
    return map(collect(nodes), tag);
  }

  /**
   * @param {Node} n
   * @return {Node}
   */
  function cloneNode(n) {
    return n.cloneNode(true);
  }

  /**
   * @param {Node|{length:number}} node
   * @return {Array}
   */
  function clone(node) {
    return map(collect(node), cloneNode);
  }

  effin['clone'] = function() {
    return output(clone(this), this);
  };

  /**
   * @param {string|{length:number}|Node} what
   * @param {({length:number}|Node)=} context
   * @return {Array}
   */
  function create(what, context) {
    return typeof what == 'string' ? build(what, context) : clone(what);
  }

  eachApply([[text, 'TextNode'], [element, 'Element'], [html]], function(key, method) {
    create[key] = method ? (method = 'create' + method, function(str, reference) {
      return owner(reference)[method](str);
    }) : create;
  });

  /**
   * @param {{length:number}|Node} node or collection
   */
  annex[text] = function(node) {
    return readAll(collect(node), inner[text]);
  };

  /**
   * @param {{length:number}|Node} node
   * @return {string|undefined}
   */
  annex[html] = function(node) {
    return isNode(node = first(node)) ? node[inner[html]] : void 0;
  };

  each([text, html], function(key) {
    effin[key] = function(str) {
      if (void 0 === str) return annex[key](this);
      return this['empty']()['append'](create[key](str, this));
    };
  });

  /**
   * @this {{length:number}}
   * @param {Node} parent
   */
  function appendTo(parent) {
    each(this, parent.appendChild, parent);
  }

  /**
   * @this {{length:number}}
   * @param {Node} parent
   */
  function prependTo(parent) {
    each(this, insertBefore, [parent, parent.firstChild]);
  }

  /**
   * @this {Array} contains parent and reference nodes
   * @param {Node} insertion
   */
  function insertBefore(insertion) {
    this[0].insertBefore(insertion, this[1]);
  }

  eachApply([['prepend', prependTo], ['append', appendTo]], function(key, handler) {
    effin[key] = function() {
      return bulk(this, handler, flatten(map(arguments, prepare, this)));
    };
    effin[key + 'To'] = function(target) {
      bulk(select(target, this), handler, this);
      return this;
    };
  });

  eachApply([['after', 'nextSibling'], ['before']], function(key, next) {
    effin[key] = function() {
      return bulk(this, function(reference) {
        var parent = reference && reference.parentNode;
        parent && each(this, insertBefore, [parent, next ? reference[next] : reference]);
      }, flatten(map(arguments, prepare, this)));
    };
  });

  /**
   * @param {Node} node
   */
  function detach(node) {
    node.parentNode && node.parentNode.removeChild(node);
  }
  annex['detach'] = detach;

  /**
   * @param {string=} selector only works when filter exists
   */
  effin['detach'] = function(selector) {
    each(filter(this, selector), detach);
    return this;
  };

  /**
   * @param {string=} selector only works when filter exists
   */
  effin['remove'] = function(selector) {
    // Filter, clean descendants, clean self, detach.
    each(cleanup(cleanup(filter(this, selector), '*')), detach);
    return this;
  };

  /**
   * @param {Node} node
   */
  function empty(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  annex['empty'] = empty;
  effin['empty'] = function() {
    return each(cleanup(this, '*'), empty);
  };

  annex['tag'] = tag;
  effin['tag'] = function() {
    return tag(this);
  };

  annex['tags'] = tags;
  effin['tags'] = function() {
    return tags(this);
  };

  annex['contents'] = contents;
  annex['owner'] = owner;
  return annex;
});

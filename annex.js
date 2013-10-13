/*!
 * annex 0.1.2+201310130105
 * https://github.com/ryanve/annex
 * MIT License 2013 Ryan Van Etten
 */

!function(root, name, make) {
    if (typeof module != 'undefined' && module['exports']) module['exports'] = make();
    else root[name] = make();
}(this, 'annex', function() {

    var effin
      , inner = {}
      , chain = 'pushStack'
      , array = []
      , concat = array.concat
      , push = array.push
      , markup = /<|&#?\w+;/
      , resource = /<(?:script|style|link)/i
      , cleaners = ['removeData', 'off']
      , doc = document
      , docElem = doc.documentElement
      , textContent = 'textContent'
      , W3C = textContent in docElem
      , element = 'element'
      , text = 'text'
      , html = 'html';
    
    inner[text] = W3C ? textContent : 'innerText';
    inner[html] = 'innerHTML';

    /**
     * @constructor
     * @param {(string|Node|Array|Object|null)=} item
     * @param {(Object|Node)=} context
     */
    function Annex(item, context) {
        push.apply(this, prepare(item, context));
    }

    /**
     * @param {(string|Node|Array|Object|null)=} item
     * @param {(Object|Node)=} context
     */
    function annex(item, context) {
        return new Annex(item, context);
    }
    effin = annex['fn'] = annex.prototype = Annex.prototype;
    
    function output(result, context) {
        return (context[chain] || annex)(result);
    }
    
    function prepare(inserts) {
        return typeof inserts == 'string' ? build(inserts, this) : collect(inserts);
    }
    
    function collect(o) {
        return null == o ? [] : o.nodeType ? [o] : o;
    }
    
    function first(o) {
        return null == o || 0 < o.nodeType ? o : o[0];
    }
    
    function each(stack, fn, scope) {
        for (var i = 0, l = stack.length; i < l;) fn.call(scope, stack[i++]);
        return stack;
    }
    
    function map(stack, fn, scope) {
        for (var r = [], i = 0, l = stack.length; i < l;) r[i] = fn.call(scope, stack[i++]);
        return r;
    }
    
    function eachApply(stack, fn, scope) {
        return each(stack, function(a) {
            fn.apply(scope, a);
        });
    }
    
    function ary(stack) {
        for (var pure = [], i = 0, l = stack.length; i < l;) pure[i] = stack[i++];
        return pure;
    }
    
    function readAll(stack, key) {
        return map(stack, function(v) {
            return v && v[key] || '';
        }).join('');
    }
    
    function flatten(stack) {
        return concat.apply(array, stack);
    }
     
    function owner(context) {
        context = context && first(context);
        return context && context.ownerDocument || doc;
    }
    
    function find(target, context) {
        if (typeof target != 'string') return collect(target);
        return output(doc, context)['find'](target);
    }
    
    function filter(stack, selector) {
        return typeof selector == 'string' ? stack['filter'](selector) : stack;
    }

    function invoke(method) {
        this[method] && this[method]();
    }
    
    function cleanup(stack) {
        each(cleaners, invoke, stack);
        return stack;
    }

    /**
     * @return {number|boolean}
     */
    function isNode(o) {
        return !!o && o.nodeType || false;
    }

    function build(str, context) {
        var els, parent;
        if (resource.test(str)) return [];
        if (!markup.test(str)) return [create[text](str, context)];
        parent = create[element]('div', context);
        parent[inner[html]] = str;
        els = ary(parent.getElementsByTagName('*'));
        empty(parent);
        return els;
    }

    function clone(node) {
        return map(collect(node), function(n) {
            return n.cloneNode(true);
        });
    }
    
    effin['clone'] = function() {
        return output(clone(this), this);
    };
    
    function create(what, context) {
        return typeof what == 'string' ? build(what, context) : clone(what);
    }
    
    eachApply([[text, 'TextNode'], [element, 'Element'], [html]], function(key, method) {
        create[key] = method ? (method = 'create' + method, function(str, reference) {
            return owner(reference)[method](str);
        }) : create;
    });
    
    /**
     * @param {Array|Object|Node} node or collection
     */
    annex[text] = function(node) {
        return readAll(collect(node), inner[text]);
    };
    
    /**
     * @param {Array|Object|Node} node
     * @return {string|undefined}
     */
    annex[html] = function(node) {
        return isNode(node = first(node)) ? node[inner[html]] : void 0;
    };
    
    each(['text', 'html'], function(key) {
        effin[key] = function(str) {
            if (void 0 === str) return annex[key](this);
            return this['empty']()['append'](create[key](str, this));
        };
    });
    
    /**
     * @this {Array|Object}
     * @param {Node} parent
     */
    function appendTo(parent) {
        each(this, parent.appendChild, parent);
    }
    
    /**
     * @this {Array|Object}
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
            return each(this, handler, flatten(map(arguments, prepare, this)));
        };
        effin[key + 'To'] = function(target) {
            each(find(target), handler, this);
            return this;
        };
    });
    
    eachApply([['after', 'nextSibling'], ['before']], function(key, next) {
        effin[key] = function() {
            return each(this, function(reference) {
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
        each(cleanup(filter(this, selector)), detach);
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
        return each(cleanup(this), empty);
    };

    return annex;
});
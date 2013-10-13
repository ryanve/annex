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
      , find = 'find'
      , html = 'html'
      , text = 'text';
    
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
        return null == o || o.nodeType ? o : o[0];
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
    
    function readAll(stack, key) {
        return map(stack, function(v) {
            return v && v[key] || '';
        }).join('');
    }
    
    function flatten(stack) {
        return concat.apply(array, stack);
    }
     
    /**
     * @param {*=} context
     * @return {Document}
     */
    function owner(context) {
        context = first(context);
        return context && (9 == context.nodeType ? context : context.ownerDocument) || doc;
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
    
    function cleanup(stack, selector) {
        selector && !stack[find] || each(cleaners, invoke, selector ? stack[find](selector) : stack);
        return stack;
    }

    /**
     * @return {number|boolean}
     */
    function isNode(o) {
        return !!o && o.nodeType || false;
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
     * @param {(Array|Object|Node)=} context
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
     * @param {Array|Object|Node} node
     * @return {Array}
     */
    function clone(node) {
        return map(collect(node), function(n) {
            return n.cloneNode(true);
        });
    }
    
    effin['clone'] = function() {
        return output(clone(this), this);
    };
    
    /**
     * @param {string|Array|Object|Node} what
     * @param {(Array|Object|Node)=} context
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
            each(select(target), handler, this);
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

    return annex;
});
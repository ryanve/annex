# annex
<b>DOM insertion module</b>

```sh
npm install annex --save
```

## API
### `annex()` &rArr; instance
#### `annex(markup|node|stack)`

```js
annex('<a href="/">home</a>').appendTo(document.body) // annex(markup) example
annex(document.body).append('<a href="/">home</a>') // annex(node) example
annex(document.querySelectorAll('.example')).remove() // annex(stack) example
```

### Chain
#### jQuery-compatible [syntax](http://api.jquery.com/category/manipulation/dom-insertion-inside/)
- `.html(string?)` Get or set.
- `.text(string?)` Get or set.
- `.tag()` Get markup string.
- `.tags()` Get markup array.
- `.after(content...)` Insert content.
- `.before(content...)` Insert content.
- `.append(content...)` Insert content.
- `.prepend(content...)` Insert content.
- `.appendTo(target)` Insert into target.
- `.prependTo(target)` Insert into target.
- `.detach()` Detach nodes from DOM for later use.
- `.remove()` Detach nodes from DOM and purge.
- `.empty()` Empty nodes.
- `.clone()` Clone nodes.

### Static
#### Fast simple static methods
- `annex.text(node)` Get.
- `annex.html(node)` Get.
- `annex.tag(node)` Get markup string.
- `annex.tags(nodes)` Get markup array.
- `annex.detach(node)` Detach from DOM.
- `annex.empty(node)` Empty node.

## Fund

[Fund opensource dev](https://www.gittip.com/ryanve/) <b>=)</b>

## License

[MIT](package.json)

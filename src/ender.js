(typeof ender == 'function' && typeof require == 'function' && function(name) {
    ender['ender'](require(name)['fn'], true);
}('annex'));
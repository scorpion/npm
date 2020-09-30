# Scorpion

[![Build Status](https://travis-ci.org/p7s1digital/scorpion.svg?branch=master)](https://travis-ci.org/p7s1digital/scorpion)

## Requirements
This package requires **ES5** and **promises**.

We strongly recommend to use [jakearchibald/es6-promise](https://github.com/jakearchibald/es6-promise)

## Quickstart
Install Scorpion with npm: `npm install scorpion`.

```javascript
import Scorpion from 'scorpion';
const di = new Scorpion();

// register an object
di.register('myConfig', Scorpion.always({
  test: true
}));

// get registered module
di.get('myConfig').then((myConfig) => {
  // do something
});
```

## API

### Registration of modules

#### `di.register(name, dependencies, factoryFunction)`

Register a module with dependencies.

```javascript
di.register('foo', ['bar'], (bar) => {
  return {};
});
```

#### `di.register(name, factoryFunction)`

Register a module without dependencies.

```javascript
di.register('foo', () => {
  return {};
});
```

#### `di.forceRegister(name, dependencies, factoryFunction)`
#### `di.forceRegister(name, factoryFunction)`

This method just works like `register` but won't throw when a module with the same name already exists.

### Get and resolve dependencies

#### `di.get(name)`

`get` returns a promise which will be resolved once all dependencies are resolved.

```javascript
di.get('foo').then((foo) => {
  // do something with foo
});
```

#### `di.getAll(arrayOfDependencyNames)`

`getAll` returns a promise which will be resolved once all requested modules and dependencies are resolved.

```javascript
di.getAll(['foo', 'bar']).then((modules) => {
  modules[0] // foo
  modules[1] // bar
});
```

### Other 

#### `di.getResolvedDependencyCount()`

Returns an object with numbers that state how often each dependency got resolved.

```javascript

// Example return value
{ Foo: 1, Bar: 1, Baz: 1 }

```

## Built-in factory creator functions

### `Scorpion.always(objectOrFunction)`

Name | Type | Description
-----|------|------------
objectOrFunction | `mixed` | Always returns this argument

A factory function that always returns the first argument when `di.get` is called.

### `Scorpion.once(objectOrFunction)`

Name | Type | Description
-----|------|------------
objectOrFunction | `mixed` | Invokes this function once

Invokes the passed factory once and will then always return the same return value.

### `Scorpion.withNew(Constructor)`

Name | Type | Description
-----|------|------------
Constructor | `function` | A constructor function

When `di.get` is called this factory function will initialize the given constructor with new.

### `Scorpion.withNewOnce(Constructor)`

Name | Type | Description
-----|------|------------
Constructor | `function` | A constructor function

When `di.get` is called the *first time* this factory function will initialize 
the given constructor and for all upcoming calls it will always return the
same instance. You can think of it as a singleton factory.

## Examples

```javascript
import Scorpion from 'scorpion';
const di = new Scorpion();

// register an object
di.register('myConfig', Scorpion.always({
  test: true
}));

// register a class
class MyClass {
  constructor(myConfig) {
  }
}
di.register('MyClass', ['myConfig'], Scorpion.withNew(MyClass));

// register an async factory
di.register('asyncModule', () => {
  return new Promise((resolve) => {
    // do some async tasks then resolve
    resolve({
      asyncModule: true
    });
  });
});

// get registered modules
di.get('myConfig').then((myConfig) => {
  // do something
});

di.get('MyClass').then((myClassInstance) => {
  // do something
});

di.get('asyncModule').then((asyncModule) => {
  // do something
});
```

## License

The MIT License (MIT)

Copyright (c) 2015 ProSiebenSat.1 Digital GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

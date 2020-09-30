import Scorpion from '../../src/index.js';

describe('Scorpion', function() {
  let di;
  beforeEach(function() {
    di = new Scorpion();
  });

  describe('register', function() {
    it('registers a simple object', function() {
      expect(function() {
        di.register('foo', {});
      }).not.toThrow();
    });
    it('throws when something is already registered with the same name', function() {
      di.register('foo', {});
      expect(function() {
        di.register('foo', {});
      }).toThrow();
    });
    it('throws when a invalid number of arguments is passed', function() {
      expect(function() {
        di.register('foo');
      }).toThrow();
    });
    it('returns the scorpion instance', function() {
      expect(di.register('foo', {})).toBe(di);
    });
  });

  describe('forceRegister', function() {
    it('does not throw when something is already registered with the same name', function() {
      di.register('foo', {});
      expect(function() {
        di.forceRegister('foo', {});
      }).not.toThrow();
    });
    it('returns the scorpion instance', function() {
      expect(di.forceRegister('foo', {})).toBe(di);
    });
  });

  describe('getResolvedDependencyCount', function() {
    it('counts how often dependencies where resolved', function() {
      const obj = {foo: true};
      di.register('foo', function() {
        return obj;
      });

      di.get('foo');
      expect(di.getResolvedDependencyCount().foo).toBe(1);
    });

    it('counts how often dependencies where resolved with deep dependencies', function() {
      const obj = {foo: true};
      di.register('foo', function() {
        return obj;
      });

      di.register('bar', ['foo'], function() {
        return obj;
      });

      di.get('bar');
      di.get('foo');
      expect(di.getResolvedDependencyCount()).toEqual({foo: 2, bar: 1});
    });
  });

  describe('get', function() {
    const depA = {a: true};
    const depB = {b: true};
    const depC = {c: true};
    beforeEach(function() {
      di.register('depA', function() {
        return depA;
      });
      di.register('depB', function() {
        return new Promise(function(resolve) {
          resolve(depB);
        });
      });
    });

    it('retrieves a module', function() {
      return di.get('depA').then(function(retrievedObj) {
        expect(retrievedObj).toBe(depA);
      });
    });

    it('retrieves an async module', function() {
      return di.get('depB').then(function(retrievedObj) {
        expect(retrievedObj).toBe(depB);
      });
    });

    it('retrieves an async module and resolves its dependencies', function() {
      di.register('depC', ['depB'], function(dependencyB) {
        return new Promise(function(resolve) {
          resolve([depC, dependencyB]);
        });
      });
      return di.get('depC').then(function(arr) {
        expect(arr).toEqual([depC, depB]);
      });
    });

    it('throws when trying to resolve a direct cicular dependency', function() {
      function Foo() {}

      function Bar() {}

      di.register('Foo', ['Bar'], Scorpion.withNew(Foo));
      di.register('Bar', ['Foo'], Scorpion.withNew(Bar));

      return di.get('Foo').catch(function(error) {
        expect(error.toString()).toEqual('Error: Circular Dependency detected: Foo => Bar => Foo');
      });
    });

    it('throws when trying to resolve a cicular dependency', function() {
      function Foo() {}

      function Bar() {}

      di.register('Foo', ['Bar'], Scorpion.withNew(Foo));
      di.register('Bar', ['Baz'], Scorpion.withNew(Bar));
      di.register('Baz', ['Foo'], Scorpion.withNew(Bar));

      return di.get('Foo').catch(function(error) {
        expect(error.toString()).toEqual('Error: Circular Dependency detected: Foo => Bar => Baz => Foo');
      });
    });

    it('throws when a circular dependency is detected', function() {
      di.register('Foo', ['Bar'], () => {
        return {};
      });
      di.register('Bar', ['Foo'], () => {
        return {};
      });

      return di.get('Foo').catch(function(error) {
        expect(error.toString()).toEqual('Error: Circular Dependency detected: Foo => Bar => Foo');
      });
    });

    it('rejects when the module was not found', function() {
      return di.get('foobar').catch(function(error) {
        expect(error.toString()).toBe('Error: Module not found: foobar');
      });
    });

    it('rejects with an explicit error when a dependency does not exist', function() {
      di.register('Foo', ['Bar'], () => {
        return {};
      });

      return di.get('Foo').catch(function(error) {
        expect(error.toString()).toBe('Error: Dependency not found: Bar');
      });
    });
    it('throws an explicit exception when a dependency does not exist', function() {
      di.register('Foo', ['Bar'], () => {
        return {};
      });
      try {
        di.get('Foo');
      } catch(e) {
        expect(e.toString()).toEqual('Error: Dependency not found: Bar');
      }
    });
  });

  describe('getAll', function() {
    it('retrieves multiple modules by passing an array', function() {
      di.register('foo', Scorpion.always({}));
      di.register('bar', Scorpion.always({}));

      di.getAll(['foo', 'bar']).then((modules) => {
        expect(modules.length).toBe(2);
      });
    });
  });

  describe('Scorpion.withNew', function() {
    it('initializes a Constructor with new', function() {
      class Foo {
        bar() {}
      }

      di.register('Foo', Scorpion.withNew(Foo));

      return di.get('Foo').then(function(foo) {
        expect(foo instanceof Foo);
        expect(foo.bar).not.toBe(undefined);
      });
    });
  });

  describe('Scorpion.withNewOnce', function() {
    it('initializes a constructor with new once and then always returns the instance', function() {
      function Foo() {
        this.foo = true;
      }

      di.register('Foo', Scorpion.withNewOnce(Foo));

      return Promise.all([di.get('Foo'), di.get('Foo')]).then((values) => {
        expect(values[0]).toBe(values[1]);
      });
    });

    it('returns always the same instance and resolves dependencies', function() {
      function Foo(bar) {
        this.foo = true;
        this.bar = bar;
      }

      const bar = {
        bar: true
      };

      di.register('Foo', ['bar'], Scorpion.withNewOnce(Foo));
      di.register('bar', Scorpion.always(bar));

      di.get('Foo').then((foo) => {
        expect(foo.bar).toBe(bar);
      });
    });
  });

  describe('Scorpion.once', function() {
    it('calls the factory once even when get is called multiple times', function() {
      const spy = sinon.spy();
      di.register('foo', Scorpion.once(spy));

      return Promise.all([di.get('foo'), di.get('foo')]).then(function() {
        expect(spy.calledOnce).toBe(true);
      });
    });
    it('forwards the defined dependencies to the passed factory', function() {
      const spy = sinon.spy();
      di.register('bar', Scorpion.always('bar'));
      di.register('foo', ['bar'], Scorpion.once(spy));

      return di.get('foo').then(function() {
        expect(spy).toHaveBeenCalledWith('bar');
      });
    });
  });
});

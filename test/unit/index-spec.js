import SimpleDi from '../../src/index.js';

describe('SimpleDi', function() {
  let di;
  beforeEach(function() {
    di = new SimpleDi();
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
  });

  describe('forceRegister', function() {
    it('does not throw when something is already registered with the same name', function() {
      di.register('foo', {});
      expect(function() {
        di.forceRegister('foo', {});
      }).not.toThrow();
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

    it('retrieves a module', function(done) {
      di.get('depA').then(function(retrievedObj) {
        expect(retrievedObj).toBe(depA);
        done();
      });
    });

    it('retrieves an async module', function(done) {
      di.get('depB').then(function(retrievedObj) {
        expect(retrievedObj).toBe(depB);
        done();
      });
    });

    it('retrieves an async module and resolves its dependencies', function(done) {
      di.register('depC', ['depB'], function(dependencyB) {
        return new Promise(function(resolve) {
          resolve([depC, dependencyB]);
        });
      });
      di.get('depC').then(function(arr) {
        expect(arr).toEqual([depC, depB]);
      }).then(done, done);
    });

    it('throws when trying to resolve a direct cicular dependency', function() {
      function Foo() {}

      function Bar() {}

      di.register('Foo', ['Bar'], SimpleDi.withNew(Foo));
      di.register('Bar', ['Foo'], SimpleDi.withNew(Bar));

      try {
        di.get('Foo');
      } catch(e) {
        expect(e.toString()).toEqual('Error: Circular Dependency detected: Foo => Bar => Foo');
      }
    });

    it('throws when trying to resolve a cicular dependency', function() {
      function Foo() {}

      function Bar() {}

      di.register('Foo', ['Bar'], SimpleDi.withNew(Foo));
      di.register('Bar', ['Baz'], SimpleDi.withNew(Bar));
      di.register('Baz', ['Foo'], SimpleDi.withNew(Bar));

      try {
        di.get('Foo');
      } catch(e) {
        expect(e.toString()).toEqual('Error: Circular Dependency detected: Foo => Bar => Baz => Foo');
      }
    });

    it('throws when a circular dependency is detected', function() {
      di.register('Foo', ['Bar'], () => {
        return {};
      });
      di.register('Bar', ['Foo'], () => {
        return {};
      });

      try {
        di.get('Foo');
      } catch(e) {
        expect(e.toString()).toEqual('Error: Circular Dependency detected: Foo => Bar => Foo');
      }
    });
  });

  describe('getAll', function() {
    it('retrieves multiple modules by passing an array', function() {
      di.register('foo', SimpleDi.always({}));
      di.register('bar', SimpleDi.always({}));

      di.getAll(['foo', 'bar']).then((modules) => {
        expect(modules.length).toBe(2);
      });
    });
  });

  describe('SimpleDi.withNew', function() {
    it('initializes a Constructor with new', function(done) {
      class Foo {
        bar() {}
      }

      di.register('Foo', SimpleDi.withNew(Foo));

      di.get('Foo').then(function(foo) {
        expect(foo instanceof Foo);
        expect(foo.bar).not.toBe(undefined);
        done();
      });
    });
  });

  describe('SimpleDi.withNewOnce', function() {
    it('initializes a constructor with new once and then always returns the instance', function(done) {
      function Foo() {
        this.foo = true;
      }

      di.register('Foo', SimpleDi.withNewOnce(Foo));

      Promise.all([di.get('Foo'), di.get('Foo')]).then((values) => {
        expect(values[0]).toBe(values[1]);
        done();
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

      di.register('Foo', ['bar'], SimpleDi.withNewOnce(Foo));
      di.register('bar', SimpleDi.always(bar));

      di.get('Foo').then((foo) => {
        expect(foo.bar).toBe(bar);
      });
    });
  });

  describe('SimpleDi.once', function() {
    it('calls the factory once even when get is called multiple times', function(done) {
      const spy = sinon.spy();
      di.register('foo', SimpleDi.once(spy));

      Promise.all([di.get('foo'), di.get('foo')]).then(function() {
        expect(spy.calledOnce).toBe(true);
        done();
      });
    });
  });
});

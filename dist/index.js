'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utils = require('./utils');

var _instanceCache = {};

var Scorpion = (function () {
  function Scorpion() {
    _classCallCheck(this, Scorpion);

    this._registry = {};
    this._resolvedDependencies = {};
  }

  _createClass(Scorpion, [{
    key: 'get',
    value: function get(name) {
      if (!this._registry[name]) {
        throw new Error('Module not found: ' + name);
      }

      return this._resolve(name);
    }
  }, {
    key: 'getAll',
    value: function getAll(names) {
      var _this = this;

      return Promise.all(names.map(function (name) {
        return _this.get(name);
      }));
    }
  }, {
    key: '_resolve',
    value: function _resolve(name) {
      var _this2 = this;

      var chain = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      var requestedModule = this._registry[name];
      this._resolvedDependencies[name]++;
      chain.push(name);
      return Promise.all(requestedModule.dependencies.map(function (dependencyName) {
        var clonedChain = [].concat(_toConsumableArray(chain));
        if (clonedChain.indexOf(dependencyName) !== -1) {
          var stringifiedChain = _this2._stringifyDependencyChain(clonedChain.concat([dependencyName]));
          throw new Error('Circular Dependency detected: ' + stringifiedChain);
        }
        return _this2._resolve(dependencyName, clonedChain);
      })).then(function (dependencies) {
        return requestedModule.factory.apply(null, dependencies);
      });
    }
  }, {
    key: '_stringifyDependencyChain',
    value: function _stringifyDependencyChain(dependencyChain) {
      return dependencyChain.join(' => ');
    }
  }, {
    key: 'getResolvedDependencyCount',
    value: function getResolvedDependencyCount() {
      return this._resolvedDependencies;
    }
  }, {
    key: 'register',
    value: function register() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 2) {
        // name, factory
        return this._register(args[0], args[1]);
      }
      if (args.length === 3) {
        // name, dependencies, factory
        return this._register(args[0], args[2], args[1]);
      }
      throw new Error('Invalid number of arguments');
    }
  }, {
    key: 'forceRegister',
    value: function forceRegister() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (args.length === 2) {
        // name, factory
        return this._register(args[0], args[1], undefined, true);
      }
      if (args.length === 3) {
        // name, dependencies, factory
        return this._register(args[0], args[2], args[1], true);
      }
      throw new Error('Invalid number of arguments');
    }
  }, {
    key: '_register',
    value: function _register(name, factory) {
      var dependencies = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
      var overwrite = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

      if (this._registry[name] && overwrite === false) {
        throw new Error('Module already exists: ' + name);
      }
      this._resolvedDependencies[name] = 0;
      this._registry[name] = {
        factory: factory,
        dependencies: dependencies
      };
    }
  }], [{
    key: 'withNew',
    value: function withNew(Constructor) {
      return function () {
        for (var _len3 = arguments.length, dependencies = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          dependencies[_key3] = arguments[_key3];
        }

        var thisArg = {};
        var NewConstructor = Constructor.bind.apply(Constructor, [thisArg].concat(dependencies));
        return new NewConstructor();
      };
    }
  }, {
    key: 'always',
    value: function always(obj) {
      return function () {
        return obj;
      };
    }
  }, {
    key: 'withNewOnce',
    value: function withNewOnce(Constructor) {
      var constructorFactory = Scorpion.withNew(Constructor);
      return Scorpion.once(constructorFactory);
    }
  }, {
    key: 'once',
    value: function once(factory) {
      var _arguments = arguments;

      var id = (0, _utils.uuid)();
      return function () {
        if (!_instanceCache[id]) {
          var thisArg = {};
          _instanceCache[id] = {
            returnValue: factory.apply(thisArg, _arguments)
          };
        }
        return _instanceCache[id].returnValue;
      };
    }
  }]);

  return Scorpion;
})();

exports['default'] = Scorpion;
module.exports = exports['default'];
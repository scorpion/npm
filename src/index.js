import {uuid} from './utils';

const _instanceCache = {};

export default class SimpleDi {

  constructor() {
    this._registry = {};
    this._resolvedDependencies = {};
  }

  get(name) {
    if (!this._registry[name]) {
      throw new Error('Module not found: ' + name);
    }

    return this._resolve(name);
  }

  getAll(names) {
    return Promise.all(names.map((name) => {
      return this.get(name);
    }));
  }

  _resolve(name, chain = []) {
    const requestedModule = this._registry[name];
    this._resolvedDependencies[name]++;
    chain.push(name);
    return Promise.all(requestedModule.dependencies.map((dependencyName) => {
      const clonedChain = [...chain];
      if (clonedChain.indexOf(dependencyName) !== -1) {
        const stringifiedChain = this._stringifyDependencyChain(clonedChain.concat([
          dependencyName
        ]));
        throw new Error('Circular Dependency detected: ' + stringifiedChain);
      }
      return this._resolve(dependencyName, clonedChain);
    })).then((dependencies) => {
      return requestedModule.factory.apply(null, dependencies);
    });
  }

  _stringifyDependencyChain(dependencyChain) {
    return dependencyChain.join(' => ');
  }

  getResolvedDependencyCount() {
    return this._resolvedDependencies;
  }

  register(...args) {
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

  forceRegister(...args) {
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

  _register(name, factory, dependencies = [], overwrite = false) {
    if (this._registry[name] && overwrite === false) {
      throw new Error('Module already exists: ' + name);
    }
    this._resolvedDependencies[name] = 0;
    this._registry[name] = {
      factory,
      dependencies
    };
  }

  static withNew(Constructor) {
    return (...dependencies) => {
      const thisArg = {};
      const NewConstructor = Constructor.bind.apply(Constructor, [thisArg].concat(dependencies));
      return new NewConstructor();
    };
  }

  static always(obj) {
    return () => {
      return obj;
    };
  }

  static withNewOnce(Constructor) {
    const constructorFactory = SimpleDi.withNew(Constructor);
    return SimpleDi.once(constructorFactory);
  }

  static once(factory) {
    const id = uuid();
    return () => {
      if (!_instanceCache[id]) {
        const thisArg = {};
        _instanceCache[id] = {
          returnValue: factory.apply(thisArg, arguments)
        };
      }
      return _instanceCache[id].returnValue;
    };
  }

}

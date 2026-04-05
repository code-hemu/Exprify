export function createFunctionRegistry(initial = {}) {
  const store = Object.create(null);

  for (const key in initial) {
    if (typeof initial[key] === "function") {
      store[key] = initial[key];
    }
  }

  return {
    getAllFunctionsName() {
      return Object.keys(store);
    },
    // register new formula
    register(name, fn) {
      if (typeof name !== "string" || !name) {
        throw new Error("Formula name must be a non-empty string");
      }

      if (typeof fn !== "function") {
        throw new Error(`Formula "${name}" must be callable`);
      }

      store[name] = fn;
    },

    // get formula
    get(name) {
      return store[name];
    },

    // check existence
    has(name) {
      return Object.prototype.hasOwnProperty.call(store, name);
    },

    // remove formula
    remove(name) {
      delete store[name];
    },

    // list all
    all() {
      return { ...store };
    },

    // clear registry
    clear() {
      for (const key in store) {
        delete store[key];
      }
    },

    // extend multiple
    extend(formulas = {}) {
      for (const name in formulas) {
        if (typeof formulas[name] === "function") {
          store[name] = formulas[name];
        }
      }
    },

    // clone (for scoped instances)
    clone() {
      return createFormulaRegistry(store);
    }
  };
}
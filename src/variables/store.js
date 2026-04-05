const validVarName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

export function createVarStore(initial = {}) {
  let store = Object.create(null);
  

  for (const key in initial) {
    store[key] = initial[key];
  }

  return {
    set(name, value, { override = true } = {}) {

      // Name validation
      if (typeof name !== "string" || !name) {
        throw new Error("Variable name must be a non-empty string");
      }

      if (!validVarName.test(name)) {
        throw new Error(`Variable Name Error: '${name}' is not a valid variable name`);
      }

      // Value validation
      if (value === undefined) {
        throw new Error(`Variable Value Error: '${name}' cannot be undefined`);
      }

      // Prevent overwrite (optional)
      if (!override && name in variablesDB) {
        throw new Error(`Variable '${name}' already exists`);
      }

      store[name] = value;
    },

    //get variable
    get(name) {
      return store[name];
    },

    // check existence
    has(name) {
      return Object.prototype.hasOwnProperty.call(store, name);
    },

    // remove variable
    remove(name) {
      delete store[name];
    },

    // get all variables (snapshot)
    all() {
      return { ...store };
    },

    // clear all
    clear() {
      store = Object.create(null);
    },

    // merge multiple variables
    merge(obj = {}) {
      for (const key in obj) {
        store[key] = obj[key];
      }
    },

    // clone store (for scoped instances) 
    clone() {
      return createVarStore(store);
    }
  };
}

export default { createVarStore };
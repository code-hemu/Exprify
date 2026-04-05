export function createFunctionExecutor(fnRegistry, options = {}) {
  if (!fnRegistry) {
    throw new Error("Function registry is required");
  }

  const config = {
    strict: options.strict ?? true
  };

  /* ================= EXECUTE ================= */

  function execute(name, args = [], context) {
    const fn = fnRegistry.get(name);

    /* ----- NOT FOUND ----- */
    if (!fn) {
      if (config.strict) {
        throw new Error(`Unknown function: ${name}`);
      }
      return undefined;
    }

    /* ----- VALIDATE ARGS ----- */
    if (!Array.isArray(args)) {
      throw new Error(`Arguments for "${name}" must be an array`);
    }

    /* ----- EXECUTE ----- */
    try {
      return fn(...args);
    } catch (err) {
      throw new Error(
        `Error in function "${name}": ${err.message}`
      );
    }
  }

  /* ================= SAFE EXECUTE ================= */

  function safeExecute(name, args = [], context) {
    try {
      return execute(name, args, context);
    } catch (err) {
      return {
        error: true,
        message: err.message
      };
    }
  }

  /* ================= EXISTS ================= */

  function exists(name) {
    return fnRegistry.has(name);
  }

  /* ================= API ================= */

  return {
    execute,
    safeExecute,
    exists
  };
}
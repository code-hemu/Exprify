export function createUnitsStore(initial = {}) {
  let units = { ...initial};

  // ---------- Helpers ----------

  function getAllUnitsFlat() {
    const result = new Set();

    for (const type in units) {
      for (const key in units[type]) {
        const u = units[type][key];

        const keyLower = key.toLowerCase();
        result.add(keyLower);

        // Unit name
        if (u.unit) {
          const unitLower = u.unit.toLowerCase();

          // Avoid duplicate like "m" vs "meter"
          if (unitLower !== keyLower) {
            // Optional: only single-word units
            if (unitLower.split(/\s+/).length === 1) {
              result.add(unitLower);
            }
          }
        }

        // Symbol
        if (u.symbol) {
          const symbolLower = u.symbol.toLowerCase();

          // Avoid duplicate with unit name
          if (!u.unit || symbolLower !== u.unit.toLowerCase()) {
            result.add(symbolLower);
          }
        }
      }
    }

    return Array.from(result);
  }

  function findUnit(input) {
    input = input.toLowerCase();

    for (const type in units) {
      for (const key in units[type]) {
        const u = units[type][key];

        if (
          key.toLowerCase() === input ||
          u.unit?.toLowerCase() === input ||
          u.symbol?.toLowerCase() === input
        ) {
          return { type, key , data: u};
        }
      }
    }

    return null;
  }

  // ---------- Core Convert ----------

  function convert(value, fromUnit, toUnit) {
      const from = findUnit(fromUnit);
      const to = findUnit(toUnit);

      if (!from) throw new Error(`Unknown unit: ${fromUnit}`);
      if (!to) throw new Error(`Unknown unit: ${toUnit}`);

      if (from.type !== to.type) {
        throw new Error(`Cannot convert ${fromUnit} to ${toUnit} (${to.data.unit || to.key}). ${from.data.unit || from.key} conversion units like ${Object.keys(units[from.type]).join(", ")}`);
      }

      const result = value * (from.data.value / to.data.value);

      return { value: result, unit: to.key };
    }

  // ---------- Public API ----------

  return {
    // Get all units
    getUnits: () => units,

    // Replace all units
    setUnits: (newUnits) => {
      units = { ...newUnits };
    },

    // Update single type
    updateType: (type, data) => {
      units[type] = { ...units[type], ...data };
    },

    // Add new unit
    addUnit: (type, key, unitObj) => {
      if (!units[type]) units[type] = {};
      units[type][key] = unitObj;
    },
    compute(op, left, right) {

      const isUnit = (v) =>
        v && typeof v === "object" && "value" in v && "unit" in v;

      const apply = (a, b) => {
        switch (op) {
          case "+": return a + b;
          case "-": return a - b;
          case "*": return a * b;
          case "/": return a / b;
          case "%": return a % b;
          case "^": return Math.pow(a, b);
        }
      };

      // BOTH UNIT
      if (isUnit(left) && isUnit(right)) {

        const from = this.findUnit(right.unit);
        const to = this.findUnit(left.unit);

        if (from.type !== to.type) {
          throw new Error(`Cannot operate on different unit types`);
        }

        // convert right → left unit
        const r = right.value * (from.data.value / to.data.value);

        const result = apply(left.value, r);

        // multiplication/division produce compound units
        if (op === "*") {
          return { value: result, unit: left.unit };
        }

        if (op === "/") {
          return { value: result, unit: left.unit };
        }

        if (op === "^") {
          return { value: result, unit: left.unit };
        }

        return { value: result, unit: left.unit };
      }

      // ================= LEFT UNIT =================
      if (isUnit(left) && !isUnit(right)) {
        const result = apply(left.value, right);

        return { value: result, unit: left.unit };
      }

      // ================= RIGHT UNIT =================
      if (!isUnit(left) && isUnit(right)) {
        const result = apply(left, right.value);

        if (op === "/") {
          return { value: result, unit: right.unit };
        }

        return { value: result, unit: right.unit };
      }

      // ================= NORMAL =================
      return apply(left, right);
    },
    // Convert
    convert,

    // Search helpers
    getAllUnitsFlat,
    findUnit
  };
}

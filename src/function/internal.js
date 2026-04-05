function validateSquareMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error("det() expects a non-empty matrix");
  }

  if (!matrix.every(Array.isArray)) {
    throw new Error("det() expects a 2D matrix");
  }

  const size = matrix.length;
  if (!matrix.every((row) => row.length === size)) {
    throw new Error("det() expects a square matrix");
  }

  for (const row of matrix) {
    for (const value of row) {
      if (typeof value !== "number" && typeof value !== "bigint") {
        throw new Error("det() matrix values must be numeric");
      }
    }
  }
}

function determinant(matrix) {
  validateSquareMatrix(matrix);

  if (matrix.length === 1) {
    return matrix[0][0];
  }

  if (matrix.length === 2) {
    return (matrix[0][0] * matrix[1][1]) - (matrix[0][1] * matrix[1][0]);
  }

  return matrix[0].reduce((sum, value, columnIndex) => {
    const minor = matrix.slice(1).map((row) =>
      row.filter((_, index) => index !== columnIndex)
    );
    const cofactor = columnIndex % 2 === 0 ? value : -value;
    return sum + (cofactor * determinant(minor));
  }, 0);
}

function splitTerms(expression) {
  const normalized = expression.replace(/\s+/g, "");
  if (!normalized) {
    return [];
  }

  return normalized
    .replace(/-/g, "+-")
    .split("+")
    .filter(Boolean);
}

function parsePolynomial(expression, variable) {
  const terms = splitTerms(expression);
  const coefficients = new Map();

  for (const term of terms) {
    if (term.includes(variable)) {
      const [rawCoeff, rawPower] = term.split(variable);
      let coefficient;

      if (rawCoeff === "" || rawCoeff === "+") coefficient = 1;
      else if (rawCoeff === "-") coefficient = -1;
      else {
        const cleaned = rawCoeff.endsWith("*") ? rawCoeff.slice(0, -1) : rawCoeff;
        coefficient = Number(cleaned);
      }

      if (!Number.isFinite(coefficient)) {
        throw new Error("Unsupported algebra term");
      }

      let power = 1;
      if (rawPower) {
        if (!rawPower.startsWith("^")) {
          throw new Error("Unsupported algebra term");
        }

        power = Number(rawPower.slice(1));
      }

      if (!Number.isInteger(power) || power < 0) {
        throw new Error("Only non-negative integer powers are supported");
      }

      coefficients.set(power, (coefficients.get(power) || 0) + coefficient);
    } else {
      const constant = Number(term);
      if (!Number.isFinite(constant)) {
        throw new Error("Unsupported algebra term");
      }
      coefficients.set(0, (coefficients.get(0) || 0) + constant);
    }
  }

  return coefficients;
}

function formatPolynomial(coefficients, variable) {
  const ordered = [...coefficients.entries()]
    .filter(([, coefficient]) => coefficient !== 0)
    .sort((a, b) => b[0] - a[0]);

  if (!ordered.length) {
    return "0";
  }

  return ordered.map(([power, coefficient], index) => {
    const negative = coefficient < 0;
    const absCoeff = Math.abs(coefficient);
    let body;

    if (power === 0) {
      body = `${absCoeff}`;
    } else if (power === 1) {
      body = absCoeff === 1 ? variable : `${absCoeff} * ${variable}`;
    } else {
      body = absCoeff === 1
        ? `${variable}^${power}`
        : `${absCoeff} * ${variable}^${power}`;
    }

    if (index === 0) {
      return negative ? `-${body}` : body;
    }

    return negative ? `- ${body}` : `+ ${body}`;
  }).join(" ");
}

function simplifyExpression(expression) {
  const compact = expression.replace(/\s+/g, "");
  const variableMatch = compact.match(/[a-zA-Z]+/);
  const variable = variableMatch?.[0] || "x";
  const coefficients = parsePolynomial(expression, variable);
  return formatPolynomial(coefficients, variable);
}

function derivativeExpression(expression, variable) {
  const coefficients = parsePolynomial(expression, variable);
  const derived = new Map();

  for (const [power, coefficient] of coefficients.entries()) {
    if (power === 0) continue;
    derived.set(power - 1, (derived.get(power - 1) || 0) + (coefficient * power));
  }

  return formatPolynomial(derived, variable);
}

export const internalFunctions = {
  max: (...args) => {
    if (!args.length) throw new Error("max() requires arguments");
    return Math.max(...args);
  },

  min: (...args) => {
    if (!args.length) throw new Error("min() requires arguments");
    return Math.min(...args);
  },

  abs: (x) => Math.abs(x),

  round: (x) => Math.round(x),

  floor: (x) => Math.floor(x),

  ceil: (x) => Math.ceil(x),

  sqrt: (x) => {
    if (x < 0) throw new Error("sqrt() domain error");
    return Math.sqrt(x);
  },

  pow: (a, b) => a ** b,
  det: (matrix) => determinant(matrix),
  simplify: (expression) => {
    if (typeof expression !== "string") {
      throw new Error("simplify() expects an expression string");
    }
    return simplifyExpression(expression);
  },
  derivative: (expression, variable = "x") => {
    if (typeof expression !== "string" || typeof variable !== "string") {
      throw new Error("derivative() expects expression and variable strings");
    }
    return derivativeExpression(expression, variable);
  },

  /* ================= TRIGONOMETRY ================= */

  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),

  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),

  /* ================= LOG / EXP ================= */

  log: (x) => {
    if (x <= 0) throw new Error("log() domain error");
    return Math.log(x);
  },

  log10: (x) => {
    if (x <= 0) throw new Error("log10() domain error");
    return Math.log10(x);
  },

  exp: (x) => Math.exp(x),

  /* ================= RANDOM ================= */

  random: () => Math.random(),

  /* ================= BOOLEAN / LOGIC ================= */

  and: (a, b) => Boolean(a && b),

  or: (a, b) => Boolean(a || b),

  not: (a) => !a,
  "!": (a) => !a,

  /* ================= COMPARISON ================= */

  eq: (a, b) => a === b,

  neq: (a, b) => a !== b,
  "notEqual": (a, b) => a !== b,

  gt: (a, b) => a > b,
  "greaterThan": (a, b) => a > b,

  lt: (a, b) => a < b,
  "lessThan": (a, b) => a < b,

  gte: (a, b) => a >= b,
  "greaterThanOrEqual": (a, b) => a >= b,

  lte: (a, b) => a <= b,
  "lessThanOrEqual": (a, b) => a <= b,

  /* ================= UTILITY ================= */

  clamp: (x, min, max) => {
    if (min > max) throw new Error("clamp(): min > max");
    return Math.min(Math.max(x, min), max);
  },

  if: (condition, a, b) => (condition ? a : b),

  /* ================= TYPE ================= */

  typeof: (x) => typeof x,

  /* ================= STRING ================= */

  length: (x) => {
    if (typeof x === "string" || Array.isArray(x)) {
      return x.length;
    }
    throw new Error("length() expects string or array");
  }
};

import { unwrapDenseMatrix, wrapDenseMatrix } from "../utils/matrix.js";

function validateSquareMatrix(matrix) {
  matrix = unwrapDenseMatrix(matrix);
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
  matrix = unwrapDenseMatrix(matrix);
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

function toLinearArray(value) {
  const unwrapped = unwrapDenseMatrix(value);
  return Array.isArray(unwrapped) ? unwrapped : value;
}

function asMatrixData(value) {
  const data = unwrapDenseMatrix(value);
  if (!Array.isArray(data)) {
    throw new Error("Expected matrix data");
  }
  return data;
}

function solveLinearSystem(coefficients, constants) {
  const n = coefficients.length;
  const augmented = coefficients.map((row, rowIndex) => [...row, constants[rowIndex]]);

  for (let pivot = 0; pivot < n; pivot++) {
    let maxRow = pivot;
    let maxValue = Math.abs(augmented[pivot][pivot]);

    for (let row = pivot + 1; row < n; row++) {
      const current = Math.abs(augmented[row][pivot]);
      if (current > maxValue) {
        maxValue = current;
        maxRow = row;
      }
    }

    if (maxValue === 0) {
      throw new Error("Linear system is singular");
    }

    if (maxRow !== pivot) {
      [augmented[pivot], augmented[maxRow]] = [augmented[maxRow], augmented[pivot]];
    }

    const pivotValue = augmented[pivot][pivot];
    for (let col = pivot; col <= n; col++) {
      augmented[pivot][col] /= pivotValue;
    }

    for (let row = 0; row < n; row++) {
      if (row === pivot) continue;
      const factor = augmented[row][pivot];
      for (let col = pivot; col <= n; col++) {
        augmented[row][col] -= factor * augmented[pivot][col];
      }
    }
  }

  return augmented.map((row) => row[n]);
}

function lupDecomposition(input) {
  const matrix = asMatrixData(input).map((row) => [...row]);
  validateSquareMatrix(matrix);

  const n = matrix.length;
  const permutation = Array.from({ length: n }, (_, index) => index);

  for (let pivot = 0; pivot < n; pivot++) {
    let maxRow = pivot;
    let maxValue = Math.abs(matrix[pivot][pivot]);

    for (let row = pivot + 1; row < n; row++) {
      const current = Math.abs(matrix[row][pivot]);
      if (current > maxValue) {
        maxValue = current;
        maxRow = row;
      }
    }

    if (maxValue === 0) {
      throw new Error("Matrix is singular");
    }

    if (maxRow !== pivot) {
      [matrix[pivot], matrix[maxRow]] = [matrix[maxRow], matrix[pivot]];
      [permutation[pivot], permutation[maxRow]] = [permutation[maxRow], permutation[pivot]];
    }

    for (let row = pivot + 1; row < n; row++) {
      matrix[row][pivot] /= matrix[pivot][pivot];
      for (let col = pivot + 1; col < n; col++) {
        matrix[row][col] -= matrix[row][pivot] * matrix[pivot][col];
      }
    }
  }

  const L = matrix.map((row, rowIndex) =>
    row.map((value, colIndex) => {
      if (rowIndex === colIndex) return 1;
      if (rowIndex > colIndex) return value;
      return 0;
    })
  );

  const U = matrix.map((row, rowIndex) =>
    row.map((value, colIndex) => (rowIndex <= colIndex ? value : 0))
  );

  return {
    L: wrapDenseMatrix(L),
    U: wrapDenseMatrix(U),
    p: permutation
  };
}

function linearSolve(aInput, bInput) {
  const { L, U, p } = lupDecomposition(aInput);
  const a = asMatrixData(aInput);
  const bData = asMatrixData(bInput);
  const bVector = Array.isArray(bData[0]) ? bData.map((row) => row[0]) : bData;

  if (a.length !== bVector.length) {
    throw new Error("Right-hand side dimension mismatch");
  }

  const permutedB = p.map((index) => bVector[index]);
  const y = new Array(a.length).fill(0);

  for (let row = 0; row < a.length; row++) {
    y[row] = permutedB[row];
    for (let col = 0; col < row; col++) {
      y[row] -= L.data[row][col] * y[col];
    }
  }

  const x = new Array(a.length).fill(0);
  for (let row = a.length - 1; row >= 0; row--) {
    x[row] = y[row];
    for (let col = row + 1; col < a.length; col++) {
      x[row] -= U.data[row][col] * x[col];
    }
    x[row] /= U.data[row][row];
  }

  return wrapDenseMatrix(x.map((value) => [value]));
}

function solveLyapunov(aInput, qInput) {
  const A = asMatrixData(aInput).map((row) => [...row]);
  const Q = asMatrixData(qInput).map((row) => [...row]);
  validateSquareMatrix(A);
  validateSquareMatrix(Q);

  const n = A.length;
  if (Q.length !== n) {
    throw new Error("A and Q must have the same dimensions");
  }

  const coefficients = [];
  const constants = [];

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const equation = new Array(n * n).fill(0);

      for (let k = 0; k < n; k++) {
        equation[k * n + col] += A[row][k];
        equation[row * n + k] += A[col][k];
      }

      coefficients.push(equation);
      constants.push(-Q[row][col]);
    }
  }

  const solution = solveLinearSystem(coefficients, constants);
  const X = [];

  for (let row = 0; row < n; row++) {
    X.push(solution.slice(row * n, (row + 1) * n));
  }

  return wrapDenseMatrix(X);
}

function evaluatePolynomial(coefficients, x) {
  return coefficients.reduce((sum, coefficient, index) => sum + (coefficient * (x ** index)), 0);
}

function syntheticDivide(coefficients, root) {
  const descending = [...coefficients].reverse();
  const quotient = [descending[0]];

  for (let index = 1; index < descending.length - 1; index++) {
    quotient.push(descending[index] + (quotient[index - 1] * root));
  }

  const remainder = descending[descending.length - 1] + (quotient[quotient.length - 1] * root);
  return {
    quotient: quotient.reverse(),
    remainder
  };
}

function solveQuadratic(coefficients) {
  const [c, b, a] = coefficients;
  const discriminant = (b ** 2) - (4 * a * c);
  if (discriminant < 0) {
    throw new Error("Only real roots are supported");
  }

  const sqrtDisc = Math.sqrt(discriminant);
  return [
    (-b + sqrtDisc) / (2 * a),
    (-b - sqrtDisc) / (2 * a)
  ];
}

function polynomialRoots(...coefficients) {
  while (coefficients.length > 1 && coefficients[coefficients.length - 1] === 0) {
    coefficients.pop();
  }

  const degree = coefficients.length - 1;
  if (degree < 1) {
    throw new Error("polynomialRoot() expects at least a linear polynomial");
  }

  if (degree === 1) {
    const [b, a] = coefficients;
    return [-b / a];
  }

  if (degree === 2) {
    return solveQuadratic(coefficients);
  }

  if (degree === 3) {
    const constant = coefficients[0];
    const leading = coefficients[3];
    const candidates = [];
    const limit = Math.abs(constant);

    for (let divisor = 1; divisor <= Math.max(1, limit); divisor++) {
      if (limit % divisor === 0) {
        candidates.push(divisor, -divisor);
      }
    }

    for (const candidate of candidates) {
      if (evaluatePolynomial(coefficients, candidate) === 0) {
        const reduced = syntheticDivide(coefficients, candidate);
        const remainingRoots = solveQuadratic(reduced.quotient);
        return [candidate, ...remainingRoots];
      }
    }
  }

  throw new Error("polynomialRoot() currently supports degree up to 3");
}

function dotProduct(a, b) {
  return a.reduce((sum, value, index) => sum + (value * b[index]), 0);
}

function vectorNorm(vector) {
  return Math.sqrt(dotProduct(vector, vector));
}

function scaleVector(vector, scalar) {
  return vector.map((value) => value * scalar);
}

function subtractVectors(a, b) {
  return a.map((value, index) => value - b[index]);
}

function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

function qrDecomposition(input) {
  const A = asMatrixData(input).map((row) => [...row]);
  if (!A.length || !A.every((row) => row.length === A[0].length)) {
    throw new Error("qr() expects a rectangular matrix");
  }

  const rowCount = A.length;
  const colCount = A[0].length;
  const columns = transpose(A);
  const qColumns = [];

  for (let col = 0; col < colCount; col++) {
    let vector = [...columns[col]];

    for (let existing = 0; existing < qColumns.length; existing++) {
      const projection = dotProduct(qColumns[existing], columns[col]);
      vector = subtractVectors(vector, scaleVector(qColumns[existing], projection));
    }

    const norm = vectorNorm(vector);
    if (norm === 0) {
      throw new Error("qr() requires linearly independent columns");
    }

    qColumns.push(scaleVector(vector, 1 / norm));
  }

  for (let basisIndex = 0; qColumns.length < rowCount && basisIndex < rowCount; basisIndex++) {
    let candidate = Array.from({ length: rowCount }, (_, index) => (index === basisIndex ? 1 : 0));

    for (const column of qColumns) {
      const projection = dotProduct(column, candidate);
      candidate = subtractVectors(candidate, scaleVector(column, projection));
    }

    const norm = vectorNorm(candidate);
    if (norm > 1e-10) {
      qColumns.push(scaleVector(candidate, 1 / norm));
    }
  }

  const Q = Array.from({ length: rowCount }, (_, rowIndex) =>
    qColumns.map((column) => column[rowIndex])
  );

  const fullR = Array.from({ length: rowCount }, () => Array(colCount).fill(0));
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      fullR[row][col] = dotProduct(qColumns[row], columns[col]);
    }
  }

  return {
    Q: wrapDenseMatrix(Q),
    R: wrapDenseMatrix(fullR)
  };
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
  polynomialRoot: (...coefficients) => polynomialRoots(...coefficients),
  lsolve: (a, b) => linearSolve(a, b),
  lup: (matrix) => lupDecomposition(matrix),
  lyap: (a, q) => solveLyapunov(a, q),
  qr: (matrix) => qrDecomposition(matrix),
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

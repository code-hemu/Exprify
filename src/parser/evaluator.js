export function evaluateAST(node, context = {}) {

  const vars = context.variables;
  const fns = context.functions;
  const units = context.units;


  const isUnitObj = (v) =>
    v && typeof v === "object" && "value" in v && "unit" in v;

  const isComplex = (v) =>
    v && typeof v === "object" && "re" in v && "im" in v;

  const isSliceNode = (v) =>
    v && typeof v === "object" && v.type === "SliceExpression";

  const isMatrix = (v) =>
    Array.isArray(v) && v.length > 0 && v.every(Array.isArray);

  const cloneValue = (value) => {
    if (Array.isArray(value)) {
      return value.map(cloneValue);
    }

    if (value && typeof value === "object") {
      return { ...value };
    }

    return value;
  };

  const normalizeMatrix = (value) => {
    if (isMatrix(value)) return value.map((row) => [...row]);
    if (Array.isArray(value)) return [value];
    throw new Error("Expected matrix-compatible value");
  };

  const toOneBasedIndex = (value) => {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
      throw new Error("Matrix indices must be positive integers");
    }

    return value - 1;
  };

  const resolveSelector = (selector, contextLength) => {
    if (isSliceNode(selector)) {
      const startValue = selector.start == null ? 1 : evaluateAST(selector.start, context);
      const endValue = selector.end == null ? contextLength : evaluateAST(selector.end, context);
      const start = toOneBasedIndex(startValue);
      const end = toOneBasedIndex(endValue);

      if (end < start) {
        return [];
      }

      const result = [];
      for (let index = start; index <= end; index++) {
        result.push(index);
      }
      return result;
    }

    return [toOneBasedIndex(evaluateAST(selector, context))];
  };

  const indexMatrix = (matrix, selectors) => {
    const target = normalizeMatrix(matrix);

    if (selectors.length === 1) {
      const rowIndexes = resolveSelector(selectors[0], target.length);
      const rows = rowIndexes.map((rowIndex) => {
        if (rowIndex >= target.length) {
          throw new Error("Row index out of range");
        }
        return [...target[rowIndex]];
      });

      return rows.length === 1 ? rows[0] : rows;
    }

    const rowIndexes = resolveSelector(selectors[0], target.length);
    const colIndexes = resolveSelector(selectors[1], target[0]?.length || 0);

    const values = rowIndexes.map((rowIndex) => {
      if (rowIndex >= target.length) {
        throw new Error("Row index out of range");
      }

      return colIndexes.map((colIndex) => {
        if (colIndex >= target[rowIndex].length) {
          throw new Error("Column index out of range");
        }
        return target[rowIndex][colIndex];
      });
    });

    if (rowIndexes.length === 1 && colIndexes.length === 1) {
      return values[0][0];
    }

    if (rowIndexes.length === 1) {
      return values[0];
    }

    if (colIndexes.length === 1) {
      return values.map((row) => [row[0]]);
    }

    return values;
  };

  const assignMatrixIndex = (matrix, selectors, value) => {
    const target = isMatrix(matrix)
      ? matrix.map((row) => [...row])
      : Array.isArray(matrix)
        ? [matrix.slice()]
        : [];

    const rowSelector = selectors[0];
    const colSelector = selectors[1];

    if (!rowSelector) {
      throw new Error("Matrix assignment requires at least one index");
    }

    const rowContextLength = Math.max(target.length, 1);
    const rowIndexes = resolveSelector(rowSelector, rowContextLength);

    if (selectors.length === 1) {
      const rowsValue = isMatrix(value) ? value : normalizeMatrix(value);

      if (rowsValue.length !== rowIndexes.length) {
        throw new Error("Assigned row count does not match slice");
      }

      rowIndexes.forEach((rowIndex, index) => {
        target[rowIndex] = [...rowsValue[index]];
      });

      return {
        updatedMatrix: target,
        selectionResult: rowIndexes.length === 1 ? [target[rowIndexes[0]]] : rowIndexes.map((rowIndex) => [target[rowIndex]])
      };
    }

    const maxCols = Math.max(...target.map((row) => row.length), 0, 1);
    const colIndexes = resolveSelector(colSelector, maxCols);
    const normalizedValue = normalizeMatrix(value);

    if (normalizedValue.length !== rowIndexes.length) {
      throw new Error("Assigned row count does not match matrix slice");
    }

    normalizedValue.forEach((row, rowOffset) => {
      if (row.length !== colIndexes.length) {
        throw new Error("Assigned column count does not match matrix slice");
      }
    });

    rowIndexes.forEach((rowIndex, rowOffset) => {
      if (!target[rowIndex]) {
        target[rowIndex] = [];
      }

      colIndexes.forEach((colIndex, colOffset) => {
        target[rowIndex][colIndex] = normalizedValue[rowOffset][colOffset];
      });
    });

    return {
      updatedMatrix: target,
      selectionResult: rowIndexes.length === 1
        ? [colIndexes.map((colIndex) => target[rowIndexes[0]][colIndex])]
        : rowIndexes.map((rowIndex) => colIndexes.map((colIndex) => target[rowIndex][colIndex]))
    };
  };

  const multiplyMatrices = (left, right) => {
    const a = normalizeMatrix(left);
    const b = normalizeMatrix(right);

    if (a[0].length !== b.length) {
      throw new Error("Matrix dimensions do not allow multiplication");
    }

    return a.map((row) =>
      b[0].map((_, colIndex) =>
        row.reduce((sum, value, rowIndex) => sum + (value * b[rowIndex][colIndex]), 0)
      )
    );
  };

  const toComplex = (value) => {
    if (isComplex(value)) return value;
    if (typeof value === "number") return { re: value, im: 0 };
    throw new Error("Complex arithmetic only supports numbers");
  };

  const fromImaginary = (value) => ({ re: 0, im: value });

  const simplifyComplex = (value) =>
    value.im === 0 ? value.re : value;

  const createFunctionScope = (params, args) => {
    const scopedValues = {};

    params.forEach((param, index) => {
      scopedValues[param] = args[index];
    });

    return scopedValues;
  };

  const evalComplexBinary = (operator, left, right) => {
    const a = toComplex(left);
    const b = toComplex(right);

    switch (operator) {
      case "+":
        return simplifyComplex({ re: a.re + b.re, im: a.im + b.im });
      case "-":
        return simplifyComplex({ re: a.re - b.re, im: a.im - b.im });
      case "*":
        return simplifyComplex({
          re: (a.re * b.re) - (a.im * b.im),
          im: (a.re * b.im) + (a.im * b.re)
        });
      case "/": {
        const denominator = (b.re ** 2) + (b.im ** 2);

        if (denominator === 0) {
          throw new Error("Division by zero");
        }

        return simplifyComplex({
          re: ((a.re * b.re) + (a.im * b.im)) / denominator,
          im: ((a.im * b.re) - (a.re * b.im)) / denominator
        });
      }
      default:
        throw new Error(`Operator ${operator} is not supported for complex numbers`);
    }
  };

  /* ================= EVALUATOR ================= */

  switch (node.type) {

    /* ===== LITERAL ===== */
    case "Literal":
      return node.value;

    case "ImaginaryLiteral":
      return fromImaginary(node.value);

    case "UnitLiteral":
      return { value: node.value, unit: node.unit };

    /* ===== VARIABLE ===== */
    case "Identifier":
      return vars.get(node.name);

    /* ===== ASSIGNMENT ===== */
    case "AssignmentExpression": {
      const value = evaluateAST(node.right, context);

      if (node.left.type === "Identifier") {
        vars.set(node.left.name, value);
        return value;
      }

      if (node.left.type === "IndexExpression" && node.left.object.type === "Identifier") {
        const currentValue = vars.get(node.left.object.name);
        const assigned = assignMatrixIndex(currentValue, node.left.selectors, value);
        vars.set(node.left.object.name, assigned.updatedMatrix);
        return assigned.selectionResult;
      }

      throw new Error("Invalid assignment target");
    }

    case "FunctionAssignmentExpression": {
      if (node.operator !== "=") {
        throw new Error(`Operator ${node.operator} is not supported for function definitions`);
      }

      const fn = (...args) => {
        const scopedContext = context.withScope(createFunctionScope(node.params, args));
        return evaluateAST(node.right, scopedContext);
      };

      fns.register(node.left.name, fn);
      return fn;
    }

    /* ===== UNARY ===== */
    case "UnaryExpression": {
      const val = evaluateAST(node.argument, context);

      switch (node.operator) {
        case "-":
          return isComplex(val)
            ? simplifyComplex({ re: -val.re, im: -val.im })
            : -val;
        case "!": return !val;
      }

      throw new Error(`Unknown unary operator ${node.operator}`);
    }

    /* ===== BINARY ===== */
    case "BinaryExpression": {
      let left = evaluateAST(node.left, context);
      let right = evaluateAST(node.right, context);

      // UNIT handling
      if (isUnitObj(left) || isUnitObj(right)) {

        if (!units) throw new Error("Unit system not available");

        return units.compute(node.operator, left, right);
      }

      if (node.operator === "*" && (Array.isArray(left) || Array.isArray(right))) {
        return multiplyMatrices(left, right);
      }

      if (isComplex(left) || isComplex(right)) {
        return evalComplexBinary(node.operator, left, right);
      }

      switch (node.operator) {
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/": return left / right;
        case "%": return left % right;
        case "^": return left ** right;

        case ">": return left > right;
        case "<": return left < right;
        case ">=": return left >= right;
        case "<=": return left <= right;
        case "==": return left === right;
      }

      throw new Error(`Unknown operator ${node.operator}`);
    }

    /* ===== LOGICAL ===== */
    case "LogicalExpression": {
      const left = evaluateAST(node.left, context);

      if (node.operator === "&&") {
        return left && evaluateAST(node.right, context);
      }

      if (node.operator === "||") {
        return left || evaluateAST(node.right, context);
      }

      if (node.operator === "??") {
        return left ?? evaluateAST(node.right, context);
      }

      throw new Error(`Unknown logical operator ${node.operator}`);
    }

    /* ===== FUNCTION CALL ===== */
    case "CallExpression": {
      const fnName = node.callee.name;
      const fn = fns.get(fnName);

      const args = node.arguments.map(arg =>
        evaluateAST(arg, context)
      );

      return fn(...args);
    }

    /* ===== PIPELINE ===== */
    case "PipelineExpression": {
      const leftVal = evaluateAST(node.left, context);

      // right must be function
      if (node.right.type === "CallExpression") {
        const fnName = node.right.callee.name;
        const fn = fns.get(fnName);

        const args = [
          leftVal,
          ...node.right.arguments.map(arg =>
            evaluateAST(arg, context)
          )
        ];

        return fn(...args);
      }

      if (node.right.type === "Identifier") {
        const fn = fns.get(node.right.name);
        return fn(leftVal);
      }

      throw new Error("Invalid pipeline target");
    }

    /* ===== UNIT CONVERSION ===== */
    case "UnitConversion": {
      const from = evaluateAST(node.from, context);

      if (!isUnitObj(from)) {
        throw new Error("Left side must be a unit value");
      }

      if (!units) {
        throw new Error("Unit system not available");
      }

      return units.convert(from.value, from.unit, node.to);
    }

    /* ===== ARRAY ===== */
    case "ArrayExpression":
      return node.elements.map(el => evaluateAST(el, context));

    case "IndexExpression": {
      const target = evaluateAST(node.object, context);
      return indexMatrix(target, node.selectors);
    }

    /* ===== OBJECT ===== */
    case "ObjectExpression": {
      const obj = {};
      for (let p of node.properties) {
        obj[p.key] = evaluateAST(p.value, context);
      }
      return obj;
    }

    /* ===== MEMBER ===== */
    case "MemberExpression": {
      const obj = evaluateAST(node.object, context);

      if (node.optional && obj == null) return undefined;

      return obj[node.property.name];
    }

    default:
      throw new Error(`Unknown AST node type: ${node.type}`);
  }
}

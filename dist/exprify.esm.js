function tokenize(expr, context = {}) {
  const tokens = [];
  let current = "";
  let quote = "";

  const operators = ["+", "-", "*", "/", "%", "^", "=", ">", "<", "!", "&", "|"];
  const multiOps = [
    "==", ">=", "<=", "&&", "||",
    "+=", "-=", "*=", "/=", "%=",
    "?.", "??", "|>"
  ];

  const parentheses = "()";
  const comma = ",";
  const semicolon = ";";
  const keywords = ["to", "in"];
  // const functions = context.functions?.getAllFunctionsName?.() || [];
  const units = context.units?.getAllUnitsFlat?.() || [];

  const isIdentifier = (s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s);

  function getContext(str, charIndex) {
      // 1. Extract all alphanumeric words into an array
      const words = str.match(/[a-z0-9]+/gi) || [];
      
      // 2. Identify the current character and the one immediately before it
      const currentChar = str[charIndex] || null;
      const prevChar = charIndex > 0 ? str[charIndex - 1] : null;
      
      // 3. Find the word that contains the current charIndex
      let start = charIndex;
      // Move pointer back to the start of the current word
      while (start > 0 && /[a-z0-9]/i.test(str[start - 1])) start--;
      
      let end = charIndex;
      // Move pointer forward to the end of the current word
      while (end < str.length && /[a-z0-9]/i.test(str[end])) end++;
      
      const currentWord = str.substring(start, end);

      // 4. Find the word that appears before the currentWord in the sequence
      const currentWordIdx = words.indexOf(currentWord);
      const prevWord = currentWordIdx > 0 ? words[currentWordIdx - 1] : null;

      // 5. Find the word that appears after the currentWord
      const nextWord = (currentWordIdx !== -1 && currentWordIdx < words.length - 1) 
                      ? words[currentWordIdx + 1] 
                      : null;

      return {
          prevWord: prevWord,
          prevChar: prevChar,
          currentWord: currentWord,
          currentChar: currentChar,
          nextWord: nextWord
      };
  }

  const isUnaryContext = (prev) =>
    !prev ||
    prev.type === "Operator" ||
    prev.type === "UnaryOperator" ||
    (prev.type === "Parenthesis" && prev.value !== ")") ||
    prev.type === "ArrayStart" ||
    prev.type === "Semicolon" ||
    prev.type === "Comma" ||
    prev.type === "Ternary";

  const flushCurrent = (nextChar, index) => {
    if (!current) return;

    // BOOLEAN
    if (/^(true|false)$/i.test(current)) {
      tokens.push({ type: "Boolean", value: current.toLowerCase() === "true" });
      current = "";
      return;
    }

    // KEYWORD
    if (keywords.includes(current)) {
      tokens.push({ type: "Keyword", value: current, pos: index });
      current = "";
      return;
    }

    // BIGINT
    if (/^\d+n$/.test(current)) {
      tokens.push({ type: "BigInt", value: BigInt(current.slice(0, -1)), pos: index });
      current = "";
      return;
    }

    // HEX
    if (/^0x[0-9a-fA-F]+$/.test(current)) {
      tokens.push({ type: "Number", value: parseInt(current, 16), pos: index });
      current = "";
      return;
    }

    // BINARY
    if (/^0b[01]+$/.test(current)) {
      tokens.push({ type: "Number", value: parseInt(current, 2), pos: index });
      current = "";
      return;
    }

    // NUMBER (including scientific)
    if (/^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i.test(current)) {
      tokens.push({ type: "Number", value: parseFloat(current), pos: index });
      current = "";
      return;
    }

    // IMAGINARY NUMBER
    if (/^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?i$/i.test(current)) {
      tokens.push({
        type: "ImaginaryLiteral",
        value: parseFloat(current.slice(0, -1)),
        pos: index
      });
      current = "";
      return;
    }

    // IMAGINARY UNIT
    if (/^[+-]?i$/i.test(current)) {
      const sign = current[0] === "-" ? -1 : 1;
      tokens.push({
        type: "ImaginaryLiteral",
        value: sign,
        pos: index
      });
      current = "";
      return;
    }

    // NUMBER + UNIT
    const numUnit = current.match(/^([+-]?\d+(\.\d+)?)([a-zA-Z]+)$/);
    if (numUnit) {
      const value = parseFloat(numUnit[1]);
      const unit = numUnit[3];

      tokens.push({
        type: units.includes(unit) ? "NumberWithUnit" : "UnknownUnit",
        value,
        unit,
        pos: index
      });

      current = "";
      return;
    }

    // UNIT
    if (units.includes(current)) {
      const {prevWord} = getContext(expr, index);
      if (nextChar !== "(") {
        if (prevWord){
          if (!isNaN(parseFloat(prevWord)) || prevWord === "to" || prevWord === "in") {
            // console.log("Context for unit detection:", {current, prevWord, nextChar});

            tokens.push({ type: "Unit", value: current, pos: index });
            current = "";
            return;
          }
        }
      }
    }

    // IDENTIFIER
     if (isIdentifier(current)) {
      if (nextChar === "(") {
        tokens.push({
          type: "Function",
          name: current,
          pos: index
        });
      } else {
        tokens.push({
          type: "Identifier",
          name: current,
          pos: index
        });
      }

      current = "";
      return;
    }

    throw new Error(`Invalid token "${current}" at index ${index}`);
  };
  

  for (let i = 0; i < expr.length; i++) {
    let char = expr[i];
    let next = expr[i + 1];

    // comments
    if (char === "/" && next === "/") {
      while (i < expr.length && expr[i] !== "\n") i++;
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < expr.length && !(expr[i] === "*" && expr[i + 1] === "/")) i++;
      i++;
      continue;
    }

    // string
    if (`"'`.includes(char)) {
      if (!quote) {
        quote = char;
        current += char;
      } else if (quote === char) {
        current += char;
        tokens.push({
          type: "String",
          value: current.slice(1, -1),
          pos: i
        });
        current = "";
        quote = "";
      } else {
        current += char;
      }
      continue;
    }

    if (quote) {
      if (char === "\\") {
        current += char + expr[++i];
      } else {
        current += char;
      }
      continue;
    }

    // multi operators
    const twoChar = char + next;
    if (multiOps.includes(twoChar)) {
      flushCurrent(char, i);
      tokens.push({ type: "Operator", value: twoChar, pos: i });
      i++;
      continue;
    }

    if (char === "?") {
      tokens.push({ type: "Ternary", value: "?" });
      continue;
    }

    // only treat ':' as ternary IF previous token was '?'
    if (char === ":") {
      flushCurrent(char, i);
      const prev = tokens[tokens.length - 1];

      if (prev && prev.type === "Ternary") {
        tokens.push({ type: "Ternary", value: ":" });
      } else {
        tokens.push({ type: "Colon" });
      }
      continue;
    }

    // dot
    if (char === "." && /\d/.test(current) && /\d/.test(next)) {
      current += char;
      continue;
    }

    if (char === ".") {
      flushCurrent(char, i);
      tokens.push({ type: "Dot", pos: i });
      continue;
    }

    // operators
    if (operators.includes(char)) {
      flushCurrent(char, i);

      const prev = tokens[tokens.length - 1];
      if ((char === "-" || char === "!") && isUnaryContext(prev)) {
        tokens.push({ type: "UnaryOperator", value: char, pos: i });
      } else {
        tokens.push({ type: "Operator", value: char, pos: i });
      }
      continue;
    }

    // parenthesis
    if (parentheses.includes(char)) {
      flushCurrent(char, i);
      tokens.push({ type: "Parenthesis", value: char, pos: i });
      continue;
    }

    // array
    if (char === "[") {
      flushCurrent(char, i);
      tokens.push({ type: "ArrayStart", pos: i });
      continue;
    }

    if (char === "]") {
      flushCurrent(char, i);
      tokens.push({ type: "ArrayEnd", pos: i });
      continue;
    }

    // OBJECT START
    if (char === "{") {
      flushCurrent(char, i);
      tokens.push({ type: "BlockStart", pos: i });
      continue;
    }

    // OBJECT END
    if (char === "}") {
      flushCurrent(char, i);
      tokens.push({ type: "BlockEnd", pos: i });
      continue;
    }

    // comma
    if (char === comma) {
      flushCurrent(char, i);
      tokens.push({ type: "Comma", pos: i });
      continue;
    }

    // semicolon
    if (char === semicolon) {
      flushCurrent(char, i);
      tokens.push({ type: "Semicolon", pos: i });
      continue;
    }

    // space
    if (char === " ") {
      flushCurrent(next, i);
      continue;
    }

    // build token
    current += char;

    if (i === expr.length - 1) {
      flushCurrent(null, i);
    }
  }

  if (quote) throw new Error("Unclosed string literal");

  // merge number + unit
  const merged = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];

    if (t?.type === "Number" && next?.type === "Unit") {
      merged.push({
        type: "NumberWithUnit",
        value: t.value,
        unit: next.value,
        pos: t.pos
      });
      i++;
      continue;
    }

    merged.push(t);
  }

  // implicit multiplication
  const final = [];
  for (let i = 0; i < merged.length; i++) {
    const a = merged[i];
    const b = merged[i + 1];

    final.push(a);

    if (
      a && b &&
      (
        (["Number", "Identifier"].includes(a.type) ||
          (a.type === "Parenthesis" && a.value === ")") ||
          a.type === "ArrayEnd") &&
        (["Identifier", "Function"].includes(b.type) ||
          (b.type === "Parenthesis" && b.value === "("))
      )
    ) {
      final.push({ type: "Operator", value: "*", implicit: true });
    }
  }

  return final;
}

function evaluateAST(node, context = {}) {

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

function createContext({ variables, functions, units, evaluate}) {
    if (!variables) throw new Error("Variable store missing");
    if (!functions) throw new Error("Function registry missing");
    if (!units) throw new Error("Units list missing");
    if (!evaluate) throw new Error("evaluate function missing");

    return {
        variables: variables,
        functions: functions,
        units: units,
        evaluate,
        withScope(scope = {}) {
            const tempVars = {
                ...variables.all?.(),
                ...scope
            };
            return createContext({
                functions: functions,
                evaluate,
                units,
                variables: {
                    get: (k) => tempVars[k],
                    set: (k, v) => (tempVars[k] = v),
                    all: () => tempVars
                }
            });

        }
    };
}

const isValidNumberPair = (a, b) =>
  (typeof a === typeof b) &&
  (typeof a === 'number' || typeof a === 'bigint');

const mathOperations = Object.freeze({
  power: function(a, b) {
    if (isValidNumberPair(a, b)) return a ** b;
    throw new Error("Invalid types for ^");
  },

  multiply: function(a, b) {
    if (isValidNumberPair(a, b)) return a * b;
    throw new Error("Invalid types for *");
  },

  divide: function(a, b) {
    if (isValidNumberPair(a, b)) {
      if (b === 0) throw new Error("Division by zero");
      return a / b;
    }
    throw new Error("Invalid types for /");
  },

  add: function(a, b) {
    if (isValidNumberPair(a, b)) return a + b;
    if (typeof a === 'string' && typeof b === 'string') return a + b;
    throw new Error("Invalid types for +");
  },
  subtract: function(a, b) {
    if (isValidNumberPair(a, b)) return a - b;
    throw new Error("Invalid types for -");
  },

  modulus: function(a, b) {
    if (isValidNumberPair(a, b)) return a % b;
    throw new Error("Invalid types for %");
  }
});

function createUnitsStore(initial = {}) {
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

const globalUnits = {
  // Length
  length: {
    m: { value: 1, unit: 'meter', symbol: 'm' },
    cm: { value: 0.01, unit: 'centimeter', symbol: 'cm' },
    mm: { value: 0.001, unit: 'millimeter', symbol: 'mm' },
    km: { value: 1000, unit: 'kilometer', symbol: 'km' },
    um: { value: 0.000001, unit: 'micrometer', symbol: 'um', note: 'also called micron' },
    nm: { value: 0.000000001, unit: 'nanometer', symbol: 'nm' },
    px: { value: 0.000264583, unit: 'pixel', symbol: 'px', note: '96dpi standard' },
    em: { value: 0.000264583 * 16, unit: 'em', symbol: 'em', note: '1em = 16px by default' },
    rem: { value: 0.000264583 * 16, unit: 'rem', symbol: 'rem', note: 'root em = 16px by default' },
    pt: { value: 0.000352778, unit: 'point', symbol: 'pt', note: '1pt = 1/72 inch' },
    pc: { value: 0.00423333, unit: 'pica', symbol: 'pc', note: '1pc = 12pt' },
    inch: { value: 0.0254, unit: 'inch', symbol: 'in' },
    ft: { value: 0.3048, unit: 'foot', symbol: 'ft' },
    yd: { value: 0.9144, unit: 'yard', symbol: 'yd' },
    mi: { value: 1609.344, unit: 'mile', symbol: 'mi' },
    thou: { value: 0.0000254, unit: 'mil', symbol: 'thou', note: 'thousandth of an inch' },
    furlong: { value: 201.168, unit: 'furlong', symbol: 'fur', note: '220 yards' },
    nmi: { value: 1852, unit: 'nautical mile', symbol: 'nmi' },
    fathom: { value: 1.8288, unit: 'fathom', symbol: 'fathom' },
    au: { value: 1.496e11, unit: 'astronomical unit', symbol: 'AU' },
    ly: { value: 9.4607e15, unit: 'light year', symbol: 'ly' },
    pc: { value: 3.0857e16, unit: 'parsec', symbol: 'pc' }
  },

  // Weight / Mass
  weight: {
    mg: { value: 1e-6, unit: 'milligram', symbol: 'mg' },
    g: { value: 0.001, unit: 'gram', symbol: 'g' },
    kg: { value: 1, unit: 'kilogram', symbol: 'kg' },
    t: { value: 1000, unit: 'tonne', symbol: 't', note: 'metric ton' },
    lb: { value: 0.453592, unit: 'pound', symbol: 'lb' },
    oz: { value: 0.0283495, unit: 'ounce', symbol: 'oz' },
    stone: { value: 6.35029, unit: 'stone', symbol: 'st', note: '1 stone = 14 lb' }
  },

  // Time
  time: {
    s: { value: 1, unit: 'second', symbol: 's' },
    min: { value: 60, unit: 'minute', symbol: 'min' },
    h: { value: 3600, unit: 'hour', symbol: 'h' },
    day: { value: 86400, unit: 'day', symbol: 'd' },
    week: { value: 604800, unit: 'week', symbol: 'wk' },
    month: { value: 2629800, unit: 'month', symbol: 'mo', note: 'average month = 30.44 days' },
    year: { value: 31557600, unit: 'year', symbol: 'yr', note: 'average year = 365.25 days' }
  },

  // Voltage
  voltage: {
    V:      { value: 1, unit: 'volt', symbol: 'V' },
    mV: { value: 0.001, unit: 'millivolt', symbol: 'mV' },
    kV: { value: 1000, unit: 'kilovolt', symbol: 'kV' },
    MV: { value: 1e6, unit: 'megavolt', symbol: 'MV' },
    GV: { value: 1e9, unit: 'gigavolt', symbol: 'GV' },
    statV: { value: 299.792458, unit: 'statvolt', symbol: 'statV', note: 'CGS unit' },
    abV: { value: 1e-8, unit: 'abvolt', symbol: 'abV', note: 'CGS electromagnetic unit' }
  },

  // Frequency
  frequency: {
    Hz: { value: 1, unit: 'hertz', symbol: 'Hz', note: '1 cycle per second' },
    kHz: { value: 1e3, unit: 'kilohertz', symbol: 'kHz' },
    MHz: { value: 1e6, unit: 'megahertz', symbol: 'MHz' },
    GHz: { value: 1e9, unit: 'gigahertz', symbol: 'GHz' },
    THz: { value: 1e12, unit: 'terahertz', symbol: 'THz' }
  },

  // Power
  power: {
    W: { value: 1, unit: 'watt', symbol: 'W', note: '1 joule per second' },
    mW: { value: 0.001, unit: 'milliwatt', symbol: 'mW' },
    kW: { value: 1000, unit: 'kilowatt', symbol: 'kW' },
    MW: { value: 1e6, unit: 'megawatt', symbol: 'MW' },
    GW: { value: 1e9, unit: 'gigawatt', symbol: 'GW' },
    HP: { value: 745.7, unit: 'horsepower', symbol: 'HP', note: 'mechanical HP = 745.7 W' },
    kcal_per_h: { value: 1.163, unit: 'kilocalorie per hour', symbol: 'kcal/h', note: '= 1.163 W' },
    BTU_per_h: { value: 0.29307107, unit: 'BTU per hour', symbol: 'BTU/h', note: '= 0.293 W' }
  },

  // Sound
  sound: {
    dB: { value: 1, unit: 'decibel', symbol: 'dB', note: 'logarithmic unit of sound intensity' },
    dBA: { value: 1, unit: 'A-weighted decibel', symbol: 'dBA', note: 'Adjusted for human hearing' },
    dBC: { value: 1, unit: 'C-weighted decibel', symbol: 'dBC', note: 'Flat weighting for high-level sounds' }
  },

  // Temperature
  temperature: {
    K: { value: 1, unit: 'kelvin', symbol: 'K' },
    C: { value: 1, unit: 'Celsius', symbol: '°C', note: '°C → K: add 273.15' },
    F: { value: 1, unit: 'Fahrenheit', symbol: '°F', note: '°F → K: (°F - 32) * 5/9 + 273.15' }
  },

  // Pressure
  pressure: {
    Pa: { value: 1, unit: 'pascal', symbol: 'Pa' },
    kPa: { value: 1000, unit: 'kilopascal', symbol: 'kPa' },
    MPa: { value: 1e6, unit: 'megapascal', symbol: 'MPa' },
    bar: { value: 1e5, unit: 'bar', symbol: 'bar' },
    atm: { value: 101325, unit: 'atmosphere', symbol: 'atm' },
    psi: { value: 6894.757, unit: 'pound per square inch', symbol: 'psi' },
    mmHg:{ value: 133.322, unit: 'millimeter of mercury', symbol: 'mmHg' }
  },

  // Energy
  energy: {
    J: { value: 1, unit: 'joule', symbol: 'J' },
    kJ: { value: 1000, unit: 'kilojoule', symbol: 'kJ' },
    cal: { value: 4.184, unit: 'calorie', symbol: 'cal' },
    kcal:{ value: 4184, unit: 'kilocalorie', symbol: 'kcal' },
    eV: { value: 1.60218e-19, unit: 'electronvolt', symbol: 'eV' },
    BTU: { value: 1055.06, unit: 'BTU', symbol: 'BTU' }
  },

  // Force
  force: {
    N: { value: 1, unit: 'newton', symbol: 'N' },
    kN: { value: 1000, unit: 'kilonewton', symbol: 'kN' },
    lbf: { value: 4.44822, unit: 'pound-force', symbol: 'lbf' },
    kgf: { value: 9.80665, unit: 'kilogram-force', symbol: 'kgf' },
    dyne:{ value: 1e-5, unit: 'dyne', symbol: 'dyn' }
  },

  // Area
  area: {
    m2: { value: 1, unit: 'square meter', symbol: 'm²' },
    cm2: { value: 0.0001, unit: 'square centimeter', symbol: 'cm²' },
    km2: { value: 1e6, unit: 'square kilometer', symbol: 'km²' },
    acre: { value: 4046.856, unit: 'acre', symbol: 'acre' },
    hectare:{ value: 10000, unit: 'hectare', symbol: 'ha' },
    ft2: { value: 0.092903, unit: 'square foot', symbol: 'ft²' },
    yd2: { value: 0.836127, unit: 'square yard', symbol: 'yd²' }
  },

  // Volume
  volume: {
    m3: { value: 1, unit: 'cubic meter', symbol: 'm³' },
    L: { value: 0.001, unit: 'liter', symbol: 'L' },
    mL: { value: 1e-6, unit: 'milliliter', symbol: 'mL' },
    gallon:{ value: 0.00378541, unit: 'US gallon', symbol: 'gal' },
    pint: { value: 0.000473176, unit: 'US pint', symbol: 'pt' },
    floz: { value: 2.9574e-5, unit: 'US fluid ounce', symbol: 'fl oz' }
  },

  // Electrical Current
  current: {
    A: { value: 1, unit: 'ampere', symbol: 'A' },
    mA: { value: 0.001, unit: 'milliampere', symbol: 'mA' },
    uA: { value: 0.000001, unit: 'microampere', symbol: 'uA' },
    kA: { value: 1000, unit: 'kiloampere', symbol: 'kA' }
  },

  // Resistance / Conductance
  resistance: {
    ohm: { value: 1, unit: 'ohm' },
    kohm: { value: 1000, unit: 'kiloohm'},
    megaohm: { value: 1e6, unit: 'megaohm'},
    S: { value: 1, unit: 'siemens', symbol: 'S', note: 'conductance' }
  },

  // Capacitance / Inductance
  capacitance: {
    F: { value: 1, unit: 'farad', symbol: 'F' },
    mF: { value: 0.001, unit: 'millifarad'},
    uF: { value: 0.000001, unit: 'microfarad' }
  },
  inductance: {
    H: { value: 1, unit: 'henry', symbol: 'H' },
    mH: { value: 0.001, unit: 'millihenry', symbol: 'mH' },
    uH: { value: 0.000001, unit: 'microhenry', symbol: 'uH' }
  },

  // Luminous Intensity / Illuminance
  light: {
    cd: { value: 1, unit: 'candela', symbol: 'cd' },
    lm: { value: 1, unit: 'lumen', symbol: 'lm' },
    lx: { value: 1, unit: 'lux', symbol: 'lx' }
  },

  // Data / Digital Storage
  data: {
    bit: { value: 1, unit: 'bit', symbol: 'bit' },
    B: { value: 8, unit: 'byte', symbol: 'B' },
    KB: { value: 8e3, unit: 'kilobyte', symbol: 'KB' },
    MB: { value: 8e6, unit: 'megabyte', symbol: 'MB' },
    GB: { value: 8e9, unit: 'gigabyte', symbol: 'GB' },
    TB: { value: 8e12, unit: 'terabyte', symbol: 'TB' }
  },

  // Angle
  angle: {
    deg: { value: 1, unit: 'degree', symbol: '°' },
    rad: { value: 57.2958, unit: 'radian', symbol: 'rad', note: '1 rad = 57.2958°' },
    grad:{ value: 0.9, unit: 'grad', symbol: 'grad', note: '1 grad = 0.9°' }
  },
  radiation: {
    // Absorbed Dose
    Gy: { value: 1, unit: 'gray', symbol: 'Gy', note: 'Absorbed dose: 1 Gy = 1 J/kg' },
    mGy: { value: 0.001, unit: 'milligray', symbol: 'mGy' },
    rad: { value: 0.01, unit: 'rad', symbol: 'rad', note: '1 rad = 0.01 Gy' },

    // Dose Equivalent
    Sv: { value: 1, unit: 'sievert', symbol: 'Sv', note: 'Biological effect dose equivalent' },
    mSv: { value: 0.001, unit: 'millisievert', symbol: 'mSv' },
    rem: { value: 0.01, unit: 'rem', symbol: 'rem', note: '1 rem = 0.01 Sv' },

    // Radioactivity
    Bq: { value: 1, unit: 'becquerel', symbol: 'Bq', note: '1 decay per second' },
    kBq: { value: 1e3, unit: 'kilobecquerel', symbol: 'kBq' },
    MBq: { value: 1e6, unit: 'megabecquerel', symbol: 'MBq' },
    GBq: { value: 1e9, unit: 'gigabecquerel', symbol: 'GBq' },
    Ci: { value: 3.7e10, unit: 'curie', symbol: 'Ci', note: '1 Ci = 3.7 x 10¹⁰ decays per second' },
    mCi: { value: 3.7e7, unit: 'millicurie', symbol: 'mCi' }
  }
};

const validVarName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function createVarStore(initial = {}) {
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

function createFunctionRegistry(initial = {}) {
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

const internalFunctions = {
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

function buildAST(tokens) {
  let current = 0;

  const peek = () => tokens[current];
  const consume = () => tokens[current++];

  const match = (type, value) => {
    const t = peek();
    if (!t) return false;

    if (t.type !== type) return false;

    if (value !== undefined && t.value !== value) return false;

    current++;
    return true;
  };

  const parseSliceOrIndex = () => {
    let start = null;

    if (!(peek()?.type === "Colon" || peek()?.type === "Comma" || peek()?.type === "ArrayEnd")) {
      start = parseExpression();
    }

    if (match("Colon")) {
      let end = null;

      if (!(peek()?.type === "Comma" || peek()?.type === "ArrayEnd")) {
        end = parseExpression();
      }

      return {
        type: "SliceExpression",
        start,
        end
      };
    }

    return start;
  };

  /* ================= PRIMARY ================= */
  function parsePrimary() {
    const token = consume();
    if (!token) throw new Error("Unexpected end of input");

    switch (token.type) {
      case "Number":
      case "BigInt":
      case "Boolean":
      case "String":
        return { type: "Literal", value: token.value };

      case "ImaginaryLiteral":
        return { type: "ImaginaryLiteral", value: token.value };

      case "NumberWithUnit":
        return {
          type: "UnitLiteral",
          value: token.value,
          unit: token.unit
        };

      case "Identifier":
        return { type: "Identifier", name: token.name };
      
      case "Function":
        return {
          type: "Identifier",
          name: token.name
        };

      case "Parenthesis":
        if (token.value === "(") {
          const expr = parseExpression();

          if (!match("Parenthesis", ")")) {
            throw new Error(`Expected ')'`);
          }

          return expr;
        }
        
      case "ArrayStart": {
        const rows = [];
        let currentRow = [];

        if (!match("ArrayEnd")) {
          while (true) {
            currentRow.push(parseExpression());

            if (match("Comma")) {
              continue;
            }

            if (match("Semicolon")) {
              rows.push(currentRow);
              currentRow = [];
              continue;
            }

            if (match("ArrayEnd")) {
              rows.push(currentRow);
              break;
            }

            throw new Error(`Expected ',', ';', or ']' at ${current}`);
          }
        }

        if (!rows.length) {
          return { type: "ArrayExpression", elements: [] };
        }

        if (rows.length === 1) {
          return { type: "ArrayExpression", elements: rows[0] };
        }

        return {
          type: "ArrayExpression",
          elements: rows.map((elements) => ({
            type: "ArrayExpression",
            elements
          }))
        };
      }

      case "BlockStart": {
        const properties = [];

        if (!match("BlockEnd")) {
          do {
            const keyToken = consume();

            if (
              keyToken.type !== "Identifier" &&
              keyToken.type !== "String"
            ) {
              throw new Error("Invalid object key");
            }

            if (!match("Colon")) {
              throw new Error("Expected ':' after key");
            }

            const value = parseExpression();

            properties.push({
              key: keyToken.value,
              value
            });

          } while (match("Comma"));

          if (!match("BlockEnd")) {
            throw new Error(`Expected '}' at ${current}`);
          }
        }

        return { type: "ObjectExpression", properties };
      }
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  /* ================= MEMBER ================= */
  function parseMember() {
    let object = parsePrimary();

    while (true) {
      if (match("ArrayStart")) {
        const selectors = [];

        if (!match("ArrayEnd")) {
          do {
            selectors.push(parseSliceOrIndex());
          } while (match("Comma"));

          if (!match("ArrayEnd")) {
            throw new Error(`Expected ']' at ${current}`);
          }
        }

        object = {
          type: "IndexExpression",
          object,
          selectors
        };
        continue;
      }

      if (match("Dot")) {
        const property = consume();

        if (property.type !== "Identifier") {
          throw new Error("Expected property after '.'");
        }

        object = {
          type: "MemberExpression",
          object,
          property: { type: "Identifier", name: property.value },
          optional: false
        };
        continue;
      }

      if (match("Operator", "?.")) {
        const property = consume();

        object = {
          type: "MemberExpression",
          object,
          property: { type: "Identifier", name: property.value },
          optional: true
        };
        continue;
      }

      break;
    }

    return object;
  }

  /* ================= CALL ================= */
  function parseCallChain() {
    let expr = parseMember();

    while (peek()?.type === "Parenthesis" && peek()?.value === "(") {
      consume(); // '('

      const args = [];

      if (!(peek()?.type === "Parenthesis" && peek()?.value === ")")) {
        do {
          args.push(parseExpression());
        } while (match("Comma"));
      }

      if (!match("Parenthesis", ")")) {
        throw new Error(`Expected ')' at ${current}`);
      }

      expr = {
        type: "CallExpression",
        callee: expr,
        arguments: args
      };
    }

    return expr;
  }

  /* ================= UNARY ================= */
  function parseUnary() {
    if (match("UnaryOperator")) {
      const operator = tokens[current - 1].value;

      return {
        type: "UnaryExpression",
        operator,
        argument: parseUnary()
      };
    }

    return parseCallChain();
  }

  /* ================= POWER ================= */
  function parsePower() {
    let left = parseUnary();

    if (match("Operator", "^")) {
      const right = parsePower();
      return {
        type: "BinaryExpression",
        operator: "^",
        left,
        right
      };
    }

    return left;
  }

  /* ================= MULT ================= */
  function parseMultiplication() {
    let left = parsePower();

    while (
      match("Operator", "*") ||
      match("Operator", "/") ||
      match("Operator", "%")
    ) {
      const operator = tokens[current - 1].value;
      const right = parsePower();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= ADD ================= */
  function parseAddition() {
    let left = parseMultiplication();

    while (match("Operator", "+") || match("Operator", "-")) {
      const operator = tokens[current - 1].value;
      const right = parseMultiplication();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= UNIT CONVERSION ================= */
  function parseUnitConversion() {
    let left = parseAddition();

    const nextKeyword = peek();
    if (nextKeyword?.type === "Keyword" && ["to", "in"].includes(nextKeyword.value)) {
      consume();
      const next = consume();

      if (!next || next.type !== "Unit") {
        throw new Error(`Expected unit after '${nextKeyword.value}'`);
      }

      return {
        type: "UnitConversion",
        from: left,
        to: next.value
      };
    }

    return left;
  }

  /* ================= COMPARISON ================= */
  function parseComparison() {
    let left = parseUnitConversion();

    while (
      match("Operator", ">") ||
      match("Operator", "<") ||
      match("Operator", ">=") ||
      match("Operator", "<=") ||
      match("Operator", "==")
    ) {
      const operator = tokens[current - 1].value;
      const right = parseUnitConversion();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= LOGICAL ================= */
  function parseLogical() {
    let left = parseComparison();

    while (
      match("Operator", "&&") ||
      match("Operator", "||")
    ) {
      const operator = tokens[current - 1].value;
      const right = parseComparison();

      left = {
        type: "LogicalExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= NULLISH ================= */
  function parseNullish() {
    let left = parseLogical();

    while (match("Operator", "??")) {
      const right = parseLogical();

      left = {
        type: "LogicalExpression",
        operator: "??",
        left,
        right
      };
    }

    return left;
  }

  /* ================= TERNARY ================= */
  function parseTernary() {
    let test = parseNullish();

    if (match("Ternary", "?")) {
      const consequent = parseExpression();

      if (!match("Ternary", ":")) {
        throw new Error("Expected ':' in ternary");
      }

      const alternate = parseExpression();

      return {
        type: "ConditionalExpression",
        test,
        consequent,
        alternate
      };
    }

    return test;
  }

  /* ================= PIPELINE ================= */
  function parsePipeline() {
    let left = parseTernary();

    while (match("Operator", "|>")) {
      const right = parseTernary();

      left = {
        type: "PipelineExpression",
        left,
        right
      };
    }

    return left;
  }

  /* ================= ASSIGNMENT ================= */
  function parseAssignment() {
    let left = parsePipeline();

    if (
      match("Operator", "=") ||
      match("Operator", "+=") ||
      match("Operator", "-=") ||
      match("Operator", "*=") ||
      match("Operator", "/=")
    ) {
      const operator = tokens[current - 1].value;

      if (left.type === "CallExpression") {
        const isFunctionTarget =
          left.callee?.type === "Identifier" &&
          left.arguments.every((arg) => arg.type === "Identifier");

        if (!isFunctionTarget) {
          throw new Error("Invalid function definition");
        }

        const right = parseAssignment();

        return {
          type: "FunctionAssignmentExpression",
          operator,
          left: {
            type: "Identifier",
            name: left.callee.name
          },
          params: left.arguments.map((arg) => arg.name),
          right
        };
      }

      if (
        left.type !== "Identifier" &&
        left.type !== "MemberExpression" &&
        left.type !== "IndexExpression"
      ) {
        throw new Error("Invalid assignment target");
      }

      const right = parseAssignment();

      return {
        type: "AssignmentExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= ENTRY ================= */
  function parseExpression() {
    return parseAssignment();
  }

  const ast = parseExpression();

  if (current < tokens.length) {
    throw new Error(
      `Unexpected token at end: ${JSON.stringify(peek())}`
    );
  }

  return ast;
}

//

const isComplex = (value) =>
    value && typeof value === "object" && "re" in value && "im" in value;

const isUnitValue = (value) =>
    value && typeof value === "object" && "value" in value && "unit" in value;

const isMatrix = (value) =>
    Array.isArray(value) && value.length > 0 && value.every(Array.isArray);

const formatComplex = (value) => {
    if (!isComplex(value)) return value;

    const real = value.re;
    const imaginary = Math.abs(value.im);
    const sign = value.im < 0 ? "-" : "+";

    if (real === 0) {
        if (value.im === 1) return "i";
        if (value.im === -1) return "-i";
        return `${value.im}i`;
    }

    const imagPart = imaginary === 1 ? "i" : `${imaginary}i`;
    return `${real} ${sign} ${imagPart}`;
};

const formatResult = (value) => {
    if (isComplex(value)) {
        return formatComplex(value);
    }

    if (isUnitValue(value)) {
        return `${value.value} ${value.unit}`;
    }

    if (isMatrix(value)) {
        return value.map((row) => row.join("\t")).join("\n");
    }

    if (Array.isArray(value)) {
        return value.join("\n");
    }

    return value;
};

class exprify {
    constructor() {
        // Shared state
        this.math = mathOperations;
        this.units = createUnitsStore(globalUnits);
        this.functions = createFunctionRegistry(internalFunctions);
        this.variables = createVarStore();
        this._cache = new Map();
    }

    setVariable(name, value) {
        this.variables.set(name, value);
    }

    getVariable(name) {
        return this.variables.get(name);
    }

    addFunction(name, fn) {
        this.functions.register(name, fn);
    }

    _createContext() {
        return createContext({
            functions: this.functions,
            variables: this.variables,
            units: this.units,
            evaluate: this.evaluate.bind(this)
        });
    }

    tokenize(expr) {
        if (typeof expr !== "string") {
            throw new Error("Expression must be a string");
        }
        return tokenize(expr, this._createContext());
    }

    parse(expr) {
        const tokens = this.tokenize(expr);
        const ast = buildAST(tokens);
        return { tokens, ast };
    }

    evaluate(expr) {
        const { ast } = this.parse(expr);
        return formatResult(evaluateAST(
            ast,
            this._createContext()
        ));
    }

    compile(expr) {
        if (this._cache.has(expr)) {
            return this._cache.get(expr);
        }

        const { ast } = this.parse(expr);

        const compiledFn = (scope = {}) => {
            const baseContext = this._createContext();
            const scopedContext = baseContext.withScope(scope);
            return formatResult(evaluateAST(ast, scopedContext));
        };

        this._cache.set(expr, compiledFn);
        return compiledFn;
    }

    clearCache() {
        this._cache.clear();
    }

}

export { exprify as default };


function tokenize(expr, context) {
    let tokens = [];
    let current = "";
    let quote = "";

    for (let i = 0; i < expr.length; i++) {

        let char = expr[i];

        const isOperator =
            char === '(' || char === ')' ||
            char === '^' || char === '*' ||
            char === '/' || char === '%' ||
            char === '+' || char === '-';

        const isQuote = char === '"' || char === "'" || char === "`";

        if (isQuote) {
            if (quote === "") {
                quote = char;
                current += char;
            } else if (quote === char) {
                current += char;
                quote = "";

                tokens.push(context.stringToJS(current, context.variablesDB));
                current = "";
            } else {
                current += char;
            }
            continue;
        }

        if (quote !== "") {
            current += char;
            continue;
        }

        if (char === "#") {

            let bracket = 0;
            let funcName = "";
            let arg = "";
            let args = [];
            let quoteFunc = "";

            while (i < expr.length - 1) {
                i++;
                char = expr[i];

                if (bracket === 0) {
                    if (char === "(") {
                        bracket++;
                        continue;
                    }

                    if (char === " ")
                        throw new Error("Function name cannot contain space");

                    if (isQuote)
                        throw new Error("Function name cannot contain quotes");

                    if (funcName === "" && /[0-9.]/.test(char))
                        throw new Error("Function name cannot start with number");

                    funcName += char;
                    continue;
                }

                if (isQuote) {
                    if (quoteFunc === "") quoteFunc = char;
                    else if (quoteFunc === char) quoteFunc = "";
                }

                if (quoteFunc === "") {

                    if (char === "(") bracket++;
                    else if (char === ")") {
                        bracket--;

                        if (bracket === 0) {
                            if (arg !== "") args.push(arg);
                            break;
                        }
                    }

                    if (char === "," && bracket === 1) {
                        if (arg === "")
                            throw new Error(`Missing argument in #${funcName}()`);

                        args.push(arg);
                        arg = "";
                        continue;
                    }
                }

                arg += char;
            }

            args = args.map(a => context.evaluate(a));

            let fn =
                context.func_DB_intrnl[funcName] ||
                context.func_DB_extrnl[funcName];

            if (!fn) {
                throw new Error(`#${funcName}() not defined`);
            }

            tokens.push(fn(...args));
            continue;
        }

        if (isOperator) {

            if (current !== "") {
                tokens.push(context.stringToJS(current, context.variablesDB));
                current = "";
            }

            tokens.push(char);
            continue;
        }

        if (char === " ") {
            if (current !== "") {
                tokens.push(context.stringToJS(current, context.variablesDB));
                current = "";
            }
            continue;
        }

        current += char;

        if (i === expr.length - 1 && current !== "") {
            tokens.push(context.stringToJS(current, context.variablesDB));
        }
    }

    if (quote !== "") {
        throw new Error("Unclosed string literal");
    }

    return tokens;
}

function infixToPostfix(tokens, operator_precedence) {
    let output = [];
    let stack = [];

    for (let i = 0; i < tokens.length; i++) {

        let token = tokens[i];

        const isOperator =
            token === '^' || token === '*' ||
            token === '/' || token === '%' ||
            token === '+' || token === '-';

        const isLeftParen = token === "(";
        const isRightParen = token === ")";

        const isOperand = !isOperator && !isLeftParen && !isRightParen;

        if (isOperand) {
            output.push(token);
        }

        else if (isOperator) {

            while (stack.length > 0) {

                let top = stack[stack.length - 1];

                if (top === "(") break;

                let topPrec = operator_precedence[top] || 0;
                let currPrec = operator_precedence[token];

                // Right associativity for ^
                if (
                    (token === '^' && currPrec < topPrec) ||
                    (token !== '^' && currPrec <= topPrec)
                ) {
                    output.push(stack.pop());
                } else {
                    break;
                }
            }

            stack.push(token);
        }

        else if (isLeftParen) {
            stack.push(token);
        }

        else if (isRightParen) {

            while (stack.length > 0 && stack[stack.length - 1] !== "(") {
                output.push(stack.pop());
            }

            if (stack.length === 0) {
                throw new Error("Mismatched parentheses: missing '('");
            }

            stack.pop();
        }
    }

    while (stack.length > 0) {

        let top = stack.pop();

        if (top === "(" || top === ")") {
            throw new Error("Mismatched parentheses");
        }

        output.push(top);
    }

    return output;
}

function evaluatePostfix(postfix, mathOperations) {

    let stack = [];

    const isOperator = (val) =>
        val === '^' || val === '*' ||
        val === '/' || val === '%' ||
        val === '+' || val === '-';

    for (let i = 0; i < postfix.length; i++) {

        let token = postfix[i];

        if (!isOperator(token)) {
            stack.push(token);
            continue;
        }

        if (stack.length < 2) {
            throw new Error("Invalid expression: insufficient operands");
        }

        let b = stack.pop(); // second
        let a = stack.pop(); // first

        let result;

        switch (token) {
            case '^':
                result = mathOperations.power(a, b);
                break;
            case '*':
                result = mathOperations.multiply(a, b);
                break;
            case '/':
                result = mathOperations.divide(a, b);
                break;
            case '%':
                result = mathOperations.modulus(a, b);
                break;
            case '+':
                result = mathOperations.add(a, b);
                break;
            case '-':
                result = mathOperations.subtract(a, b);
                break;
        }

        stack.push(result);
    }

    if (stack.length !== 1) {
        throw new Error("Invalid expression: leftover values in stack");
    }

    return stack[0];
}

const isValidNumberPair = (a, b) =>
  (typeof a === typeof b) &&
  (typeof a === 'number' || typeof a === 'bigint');

const mathOperations = Object.freeze({

  operator_precedence: {
    '^': 4,
    '*': 3,
    '/': 3,
    '%': 3,
    '+': 1,
    '-': 1,
  },

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

const and = (...args) => args.every(Boolean);
const or = (...args) => args.some(Boolean);
const not = (val) => !val;

const gt = (a, b) => a > b;
const lt = (a, b) => a < b;
const eq = (a, b) => a === b;
const gte = (a, b) => a >= b;
const lte = (a, b) => a <= b;

const internalFunctions = Object.freeze({

  max: (...args) => {
    if (!args.every(v => typeof v === 'number')) {
      throw new Error("max() expects numbers only");
    }
    return Math.max(...args);
  },

  min: (...args) => {
    if (!args.every(v => typeof v === 'number')) {
      throw new Error("min() expects numbers only");
    }
    return Math.min(...args);
  },

  and,
  "&&": and,

  or,
  "||": or,

  not,
  "!": not,

  greaterThan: gt,
  ">": gt,

  lessThan: lt,
  "<": lt,

  isEqual: eq,
  "==": eq,

  greaterThanOrEqual: gte,
  ">=": gte,

  lessThanOrEqual: lte,
  "<=": lte,

  if: (cond, t, f = false) => cond ? t : f

});

const externalFunctions = {};

const variablesDB = {};

function stringToJS(str, variablesDB) {
    if (typeof str !== "string" || str.length === 0) {
        throw new Error("Invalid input: expected a non-empty string.");
    }

    const firstChar = str[0];
    const lastChar = str[str.length - 1];

    // HEX (0x...)
    if (/^0x[0-9a-fA-F]+n?$/.test(str)) {

        // BigInt hex (0xFFn)
        if (lastChar === 'n') {
            return BigInt(str.slice(0, -1));
        }

        return Number(str);
    }

    if (/^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?n?$/i.test(str)) {

        // BigInt
        if (lastChar === 'n') {
            const numPart = str.slice(0, -1);

            if (numPart.includes('.') || /e/i.test(numPart)) {
                throw new Error(`Invalid BigInt: ${str}`);
            }

            return BigInt(numPart);
        }

        return Number(str);
    }

    if (
        (firstChar === '"' && lastChar === '"') ||
        (firstChar === "'" && lastChar === "'") ||
        (firstChar === '`' && lastChar === '`')
    ) {
        return str.slice(1, -1);
    }

    if (
        firstChar === '"' ||
        firstChar === "'" ||
        firstChar === '`'
    ) {
        throw new Error(`Unmatched or missing quotes: ${str}`);
    }

    if (str === "true") return true;
    if (str === "false") return false;

    if (str in variablesDB) {
        return variablesDB[str];
    }

    throw new Error(
        `${str} is not defined. Use setVariable("${str}", value) first.`
    );
}

class ViewPoint {

    constructor() {
        // Shared state
        this.variablesDB = variablesDB;
        this.func_DB_intrnl = internalFunctions;
        this.func_DB_extrnl = externalFunctions;

        this.operator_precedence = mathOperations.operator_precedence;
    }

    setVariable(name, value) {
        this.variablesDB[name] = value;
    }

    addFunction(name, fn) {
        this.func_DB_extrnl[name] = fn;
    }

    stringToJS(str) {
        return stringToJS.call(this, str, this.variablesDB);
    }

    evaluate(expr) {

        if (typeof expr !== "string") {
            throw new Error("Expression must be a string");
        }

        const context = {
            variablesDB: this.variablesDB,
            func_DB_intrnl: this.func_DB_intrnl,
            func_DB_extrnl: this.func_DB_extrnl,
            stringToJS: this.stringToJS.bind(this),
            evaluate: this.evaluate.bind(this)
        };

        // Step 1: Tokenize
        const tokens = tokenize(expr, context);

        // Step 2: Infix → Postfix
        const postfix = infixToPostfix(
            tokens,
            this.operator_precedence
        );

        // Step 3: Evaluate Postfix
        const result = evaluatePostfix(
            postfix,
            mathOperations
        );

        return result;
    }
}

export { ViewPoint as Exprify, externalFunctions, internalFunctions, mathOperations, variablesDB };


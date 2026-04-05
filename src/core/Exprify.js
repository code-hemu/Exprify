import { tokenize } from "../parser/tokenizer.js";
// import { infixToPostfix } from "../parser/infixToPostfix.js";
import { evaluateAST } from "../parser/evaluator.js";
import { createContext } from "./context.js";
import { mathOperations } from "../math/operations.js";

import { createUnitsStore } from "../utils/store.js";
import { globalUnits } from "../utils/globalUnits.js";

import { createVarStore } from "../variables/store.js";
import { createFunctionRegistry } from "../function/registry.js";
import { internalFunctions } from "../function/internal.js";
import { isDenseMatrixWrapper, serializeExprifyValue, wrapDenseMatrix } from "../utils/matrix.js";

import { buildAST } from "../parser/astBuild.js";


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

const formatScalar = (value) => {
    if (typeof value !== "number") {
        return String(value);
    }

    if (Number.isInteger(value)) {
        return String(value);
    }

    return Number(value.toFixed(14)).toString();
};

const formatResult = (value) => {
    if (isComplex(value)) {
        return formatComplex(value);
    }

    if (isUnitValue(value)) {
        return `${value.value} ${value.unit}`;
    }

    if (isDenseMatrixWrapper(value)) {
        return serializeExprifyValue(value);
    }

    if (isMatrix(value)) {
        return value.map((row) => row.map(formatScalar).join("\t")).join("\n");
    }

    if (Array.isArray(value)) {
        return JSON.stringify(value);
    }

    if (value && typeof value === "object") {
        return serializeExprifyValue(value);
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
        this.variables.set("pi", Math.PI);
        this.variables.set("e", Math.E);
        this.addFunction("parse", (expression) => {
            if (typeof expression !== "string") {
                throw new Error("parse() expects an expression string");
            }
            return expression;
        });
        this.addFunction("leafCount", (value) => {
            const countLeafTokens = (expression) => {
                const strippedKeys = expression.replace(/(^|[{,]\s*)[a-zA-Z_][a-zA-Z0-9_]*\s*:/g, "$1");
                const matches = strippedKeys.match(/\d+(\.\d+)?(e[+-]?\d+)?n?|[a-zA-Z_][a-zA-Z0-9_]*/gi);
                return matches ? matches.length : 0;
            };

            let ast = value;
            if (typeof value === "string") {
                try {
                    ast = this.parse(value).ast;
                } catch {
                    return countLeafTokens(value);
                }
            }

            const countLeaves = (node) => {
                if (!node || typeof node !== "object") return 0;

                switch (node.type) {
                    case "Literal":
                    case "ImaginaryLiteral":
                    case "UnitLiteral":
                    case "Identifier":
                        return 1;
                    default:
                        return Object.values(node).reduce((sum, child) => {
                            if (Array.isArray(child)) {
                                return sum + child.reduce((inner, item) => inner + countLeaves(item), 0);
                            }

                            return sum + countLeaves(child);
                        }, 0);
                }
            };

            return countLeaves(ast);
        });
        this.addFunction("matrix", (value) => wrapDenseMatrix(value));
        this.addFunction("sparse", (value) => wrapDenseMatrix(value));
        this.addFunction("rationalize", (expression, withDetails = false) => {
            if (typeof expression !== "string") {
                throw new Error("rationalize() expects an expression string");
            }

            const normalizedExpression = expression
                .replace(/\s+/g, "")
                .replace(/(\d)([a-zA-Z(])/g, "$1*$2")
                .replace(/([a-zA-Z)])(\d)/g, "$1*$2");

            const polyKey = (powers) => JSON.stringify(Object.entries(powers).sort(([a], [b]) => a.localeCompare(b)));
            const keyToPowers = (key) => Object.fromEntries(JSON.parse(key));
            const makePoly = (terms = new Map()) => terms;
            const constPoly = (value) => new Map([[polyKey({}), value]]);
            const varPoly = (name) => new Map([[polyKey({ [name]: 1 }), 1]]);
            const cleanPoly = (poly) => new Map([...poly.entries()].filter(([, coeff]) => coeff !== 0));
            const addPoly = (a, b, sign = 1) => {
                const result = new Map(a);
                for (const [key, coeff] of b.entries()) {
                    result.set(key, (result.get(key) || 0) + (sign * coeff));
                }
                return cleanPoly(result);
            };
            const multiplyPoly = (a, b) => {
                const result = new Map();
                for (const [keyA, coeffA] of a.entries()) {
                    const powersA = keyToPowers(keyA);
                    for (const [keyB, coeffB] of b.entries()) {
                        const powersB = keyToPowers(keyB);
                        const merged = { ...powersA };
                        for (const [name, power] of Object.entries(powersB)) {
                            merged[name] = (merged[name] || 0) + power;
                        }
                        const key = polyKey(merged);
                        result.set(key, (result.get(key) || 0) + (coeffA * coeffB));
                    }
                }
                return cleanPoly(result);
            };
            const powPoly = (poly, exponent) => {
                let result = constPoly(1);
                for (let index = 0; index < exponent; index++) {
                    result = multiplyPoly(result, poly);
                }
                return result;
            };
            const rational = (num, den = constPoly(1)) => ({ num, den });
            const addRat = (a, b, sign = 1) => rational(
                addPoly(
                    multiplyPoly(a.num, b.den),
                    multiplyPoly(b.num, a.den),
                    sign
                ),
                multiplyPoly(a.den, b.den)
            );
            const mulRat = (a, b) => rational(multiplyPoly(a.num, b.num), multiplyPoly(a.den, b.den));
            const divRat = (a, b) => rational(multiplyPoly(a.num, b.den), multiplyPoly(a.den, b.num));
            const negRat = (value) => rational(addPoly(new Map(), value.num, -1), value.den);
            const astToRat = (node) => {
                switch (node.type) {
                    case "Literal":
                        return rational(constPoly(node.value));
                    case "Identifier":
                        return rational(varPoly(node.name));
                    case "UnaryExpression":
                        if (node.operator === "-") return negRat(astToRat(node.argument));
                        throw new Error("Unsupported unary operator");
                    case "BinaryExpression": {
                        const left = astToRat(node.left);
                        const right = astToRat(node.right);
                        switch (node.operator) {
                            case "+": return addRat(left, right);
                            case "-": return addRat(left, right, -1);
                            case "*": return mulRat(left, right);
                            case "/": return divRat(left, right);
                            case "^": {
                                if (node.right.type !== "Literal" || !Number.isInteger(node.right.value) || node.right.value < 0) {
                                    throw new Error("Unsupported exponent");
                                }
                                return rational(
                                    powPoly(left.num, node.right.value),
                                    powPoly(left.den, node.right.value)
                                );
                            }
                            default:
                                throw new Error("Unsupported operator in rationalize()");
                        }
                    }
                    default:
                        throw new Error("Unsupported expression in rationalize()");
                }
            };
            const formatPoly = (poly) => {
                const entries = [...poly.entries()]
                    .filter(([, coeff]) => coeff !== 0)
                    .sort(([keyA], [keyB]) => {
                        const powersA = keyToPowers(keyA);
                        const powersB = keyToPowers(keyB);
                        const firstVarA = Object.keys(powersA).sort()[0] || "";
                        const firstVarB = Object.keys(powersB).sort()[0] || "";

                        if (firstVarA !== firstVarB) {
                            return firstVarA.localeCompare(firstVarB);
                        }

                        const degreeA = Object.values(powersA).reduce((sum, value) => sum + value, 0);
                        const degreeB = Object.values(powersB).reduce((sum, value) => sum + value, 0);
                        return degreeB - degreeA;
                    });

                if (!entries.length) return "0";

                return entries.map(([key, coeff], index) => {
                    const powers = keyToPowers(key);
                    const absCoeff = Math.abs(coeff);
                    const variablePart = Object.entries(powers)
                        .map(([name, power]) => power === 1 ? name : `${name} ^ ${power}`)
                        .join(" * ");
                    let body = variablePart;

                    if (!body) {
                        body = `${absCoeff}`;
                    } else if (absCoeff !== 1) {
                        body = `${absCoeff} * ${body}`;
                    }

                    if (index === 0) {
                        return coeff < 0 ? `- ${body}`.replace("- ", "-") : body;
                    }

                    return coeff < 0 ? `- ${body}` : `+ ${body}`;
                }).join(" ");
            };

            const ast = this.parse(normalizedExpression).ast;
            const result = astToRat(ast);
            const numerator = formatPoly(result.num);
            const denominator = formatPoly(result.den);
            const variableSet = new Set();

            for (const poly of [result.num, result.den]) {
                for (const key of poly.keys()) {
                    for (const name of Object.keys(keyToPowers(key))) {
                        variableSet.add(name);
                    }
                }
            }

            if (!withDetails) {
                return `(${numerator}) / (${denominator})`;
            }

            return {
                numerator,
                denominator,
                coefficients: [],
                variables: [...variableSet].sort(),
                expression: `(${numerator}) / (${denominator})`
            };
        });
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

export default exprify;

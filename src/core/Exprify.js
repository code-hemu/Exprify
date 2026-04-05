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

export default exprify;

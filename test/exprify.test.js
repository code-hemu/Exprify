import Exprify from "../src/core/Exprify.js";

describe("Exprify Engine", () => {
  let expr;

  beforeEach(() => {
    expr = new Exprify();
  });

  test("addition", () => {
    expect(expr.evaluate("2 + 3 + 5")).toBe(10);
  });

  test("operator precedence", () => {
    expect(expr.evaluate("2 + 3 * 4")).toBe(14); // 3*4=12+2=14
  });

  test("parentheses", () => {
    expect(expr.evaluate("(2 + 3) * 4")).toBe(20);
  });

  test("subtraction and division", () => {
    expect(expr.evaluate("20 - 4 / 2")).toBe(18);
  });

  test("power operator", () => {
    expect(expr.evaluate("2 ^ 3")).toBe(8);
  });

  test("modulus", () => {
    expect(expr.evaluate("10 % 3")).toBe(1);
  });

  test("mixed parentheses", () => {
    expect(expr.evaluate("(1 + 2) * (3 + 4)")).toBe(21);
  });

  test("set and use variable", () => {
    expr.setVariable("x", 5);
    expr.setVariable("y", 3);
    expect(expr.evaluate("x + y")).toBe(8);
    expect(expr.evaluate("x * y + 2")).toBe(17); // 5*3=15 +2=17
  });

  test("variable in parentheses", () => {
    expr.setVariable("a", 2);
    expr.setVariable("b", 4);
    expect(expr.evaluate("(a + b) * 3")).toBe(18); // (2+4)*3=18
  });

  test("add and use external function", () => {
    // Example: #double(n) returns n*2
    expr.addFunction("double", (n) => n * 2);
    expect(expr.evaluate("#double(4)")).toBe(8);
    expect(expr.evaluate("2 + #double(5)")).toBe(12); // 2+10=12
  });

  test("external function with multiple arguments", () => {
    expr.addFunction("sumThree", (a, b, c) => a + b + c);
    expect(expr.evaluate("#sumThree(2, 3, 5)")).toBe(10);
  });

  test("nested function calls", () => {
    expr.addFunction("double", (n) => n * 2);
    expr.addFunction("addTen", (n) => n + 10);
    expect(expr.evaluate("#addTen(#double(5))")).toBe(20); // double(5)=10 → addTen(10)=20
  });

  test("using internal function (if any pre-defined)", () => {
    // Example: if you have #max(a,b) internally
    if (expr.func_DB_intrnl.max) {
      expect(expr.evaluate("#max(3,7)")).toBe(7);
    }
  });
});
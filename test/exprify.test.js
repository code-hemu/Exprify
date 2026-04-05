import Exprify from "../src/core/Exprify.js";

describe("Exprify Engine - Extended Tests", () => {
  let expr;

  beforeEach(() => {
    expr = new Exprify();
  });

  /* ================= BASIC ================= */
  test("addition", () => {
    expect(expr.evaluate("2 + 3 + 5")).toBe(10);
  });

  test("operator precedence", () => {
    expect(expr.evaluate("2 + 3 * 4")).toBe(14);
  });

  test("parentheses override precedence", () => {
    expect(expr.evaluate("(2 + 3) * 4")).toBe(20);
  });

  test("mixed parentheses", () => {
    expect(expr.evaluate("(1 + 2) * (3 + 4)")).toBe(21);
  });

  /* ================= NESTED ================= */
  test("nested parentheses", () => {
    expect(expr.evaluate("((2 + 3) * (4 + 1))")).toBe(25);
  });

  test("deep nesting", () => {
    expect(expr.evaluate("(((1 + 1) + 1) + 1)")).toBe(4);
  });

  /* ================= UNARY ================= */
  test("unary minus", () => {
    expect(expr.evaluate("-5 + 10")).toBe(5);
  });

  test("double unary", () => {
    expect(expr.evaluate("--5")).toBe(5);
  });

  /* ================= POWER ================= */
  test("power operator", () => {
    expect(expr.evaluate("2 ^ 3")).toBe(8);
  });

  test("power precedence", () => {
    expect(expr.evaluate("2 + 2 ^ 3")).toBe(10);
  });

  /* ================= LOGICAL ================= */
  test("logical AND", () => {
    expect(expr.evaluate("true && false")).toBe(false);
  });

  test("logical OR", () => {
    expect(expr.evaluate("true || false")).toBe(true);
  });

  /* ================= FUNCTION ================= */
  test("function call", () => {
    expect(expr.evaluate("max(2, 5, 3)")).toBe(5);
  });

  test("nested function", () => {
    expect(expr.evaluate("max(2, min(5, 3))")).toBe(3);
  });

  test("matrix determinant with semicolon rows", () => {
    expect(expr.evaluate("det([-1, 2; 3, 1])")).toBe(-7);
  });

  /* ================= STRING ================= */
  test("string concat", () => {
    expect(expr.evaluate('"Hello " + "World"')).toBe("Hello World");
  });

  /* ================= BIGINT ================= */
  test("bigint power", () => {
    expect(expr.evaluate("11n ^ 2n")).toBe(121n);
  });

  /* ================= UNIT ================= */
  test("unit conversion", () => {
    expect(expr.evaluate("2 inch to cm")).toBe("5.08 cm");
  });

  test("unit addition", () => {
    expect(expr.evaluate("5 cm + 2 inch")).toBe("10.08 cm");
  });

  /* ================= EDGE CASE ================= */
  test("division", () => {
    expect(expr.evaluate("10 / 2")).toBe(5);
  });

  test("modulus", () => {
    expect(expr.evaluate("10 % 3")).toBe(1);
  });

  test("invalid expression", () => {
    expect(() => expr.evaluate("(2 + 3")).toThrow();
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
    // Example: double(n) returns n*2
    expr.addFunction("double", (n) => n * 2);
    expect(expr.evaluate("double(4)")).toBe(8);
    expect(expr.evaluate("2 + double(5)")).toBe(12); // 2+10=12
  });

  test("external function with multiple arguments", () => {
    expr.addFunction("sumThree", (a, b, c) => a + b + c);
    expect(expr.evaluate("sumThree(2, 3, 5)")).toBe(10);
  });

  test("nested function calls", () => {
    expr.addFunction("double", (n) => n * 2);
    expr.addFunction("addTen", (n) => n + 10);
    expect(expr.evaluate("addTen(double(5))")).toBe(20); // double(5)=10 → addTen(10)=20
  });
  
});

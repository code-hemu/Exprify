// import Exprify from "../src/core/Exprify.js";

// describe("Exprify Engine", () => {
//   let expr;

//   beforeEach(() => {
//     expr = new Exprify();
//   });

//   test("addition", () => {
//     expect(expr.evaluate("2 + 3 + 5")).toBe(10);
//   });

//   test("operator precedence", () => {
//     expect(expr.evaluate("2 + 3 * 4")).toBe(14); // 3*4=12+2=14
//   });

//   test("parentheses", () => {
//     expect(expr.evaluate("(2 + 3) * 4")).toBe(20);
//   });

//   test("subtraction and division", () => {
//     expect(expr.evaluate("20 - 4 / 2")).toBe(18);
//   });

//   test("power operator", () => {
//     expect(expr.evaluate("2 ^ 3")).toBe(8);
//   });

//   test("modulus", () => {
//     expect(expr.evaluate("10 % 3")).toBe(1);
//   });

//   test("mixed parentheses", () => {
//     expect(expr.evaluate("(1 + 2) * (3 + 4)")).toBe(21);
//   });

// //   test("using internal function (if any pre-defined)", () => {
// //     // Example: if you have #max(a,b) internally
// //     if (expr.func_DB_intrnl.max) {
// //       expect(expr.evaluate("#max(3,7)")).toBe(7);
// //     }
// //   });
// });


import Exprify from "../src/core/Exprify.js";

describe("Exprify Engine - Extended Tests", () => {
  let expr;

  beforeEach(() => {
    expr = new Exprify();
  });

  // basic
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

  // nested
  test("nested parentheses", () => {
    expect(expr.evaluate("((2 + 3) * (4 + 1))")).toBe(25);
  });

  test("deep nesting", () => {
    expect(expr.evaluate("(((1 + 1) + 1) + 1)")).toBe(4);
  });

  // unary
  test("unary minus", () => {
    expect(expr.evaluate("-5 + 10")).toBe(5);
  });

  test("double unary", () => {
    expect(expr.evaluate("--5")).toBe(5);
  });

  // power
  test("power operator", () => {
    expect(expr.evaluate("2 ^ 3")).toBe(8);
  });

  test("power precedence", () => {
    expect(expr.evaluate("2 + 2 ^ 3")).toBe(10);
  });

  // logical
  test("logical AND", () => {
    expect(expr.evaluate("true && false")).toBe(false);
  });

  test("logical OR", () => {
    expect(expr.evaluate("true || false")).toBe(true);
  });

  // function
  test("function call", () => {
    expect(expr.evaluate("max(2, 5, 3)")).toBe(5);
  });

  test("nested function", () => {
    expect(expr.evaluate("max(2, min(5, 3))")).toBe(3);
  });

  test("matrix determinant with semicolon rows", () => {
    expect(expr.evaluate("det([-1, 2; 3, 1])")).toBe(-7);
  });

  test("complex number literal after arithmetic", () => {
    expect(expr.evaluate("9 / 3 + 2i")).toBe("3 + 2i");
  });

  // string
  test("string concat", () => {
    expect(expr.evaluate('"Hello " + "World"')).toBe("Hello World");
  });

  // bigint
  test("bigint power", () => {
    expect(expr.evaluate("11n ^ 2n")).toBe(121n);
  });

  // unit
  test("unit conversion", () => {
    expect(expr.evaluate("2 inch to cm")).toBe("5.08 cm");
  });

  test("unit addition", () => {
    expect(expr.evaluate("5 cm + 2 inch")).toBe("10.08 cm");
  });

  test("assigned unit value can be converted later", () => {
    expr.evaluate("a = 5.08 cm + 2 inch");
    expect(expr.evaluate("a to inch")).toBe("4 inch");
  });

  test("unit conversion also works with in keyword", () => {
    expect(expr.evaluate("5cm + 0.2 m in inch")).toBe("9.84251968503937 inch");
  });

  test("matrix indexing returns a single cell", () => {
    expr.evaluate("a = [1, 2, 3; 2+2, 5, 6]");
    expect(expr.evaluate("a[2, 3]")).toBe(6);
  });

  test("matrix slicing returns selected rows and column", () => {
    expr.evaluate("a = [1, 2, 3; 2+2, 5, 6]");
    expect(expr.evaluate("a[1:2, 2]")).toBe("2\n5");
  });

  test("matrix multiplication works", () => {
    expr.evaluate("a = [1, 2, 3; 2+2, 5, 6]");
    expr.evaluate("b = [1, 2; 3, 4]");
    expect(expr.evaluate("b * a")).toBe("9\t12\t15\n19\t26\t33");
  });

  test("matrix slice assignment adds a new row", () => {
    expr.evaluate("a = [1, 2, 3; 2+2, 5, 6]");
    expect(expr.evaluate("a[3, 1:3] = [7, 8, 9]")).toBe("7\t8\t9");
    expect(expr.evaluate("a[3, 2]")).toBe(8);
  });

  test("simplify combines like terms", () => {
    expect(expr.evaluate('simplify("2x + x")')).toBe("3 * x");
  });

  test("derivative computes simple polynomial derivative", () => {
    expect(expr.evaluate('derivative("2x^2 + 3x + 4", "x")')).toBe("4 * x + 3");
  });

  // edge case
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
    // Example: #double(n) returns n*2
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

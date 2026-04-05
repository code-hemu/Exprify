# Exprify

[![Exprify Social Banner](https://raw.githubusercontent.com/code-hemu/Exprify/refs/heads/main/src/assets/capture.jpg)](https://github.com/code-hemu/Exprify)

Exprify is a JavaScript expression parser and evaluator for math-heavy apps. It supports arithmetic, variables, custom functions, unit conversion, matrices, complex numbers, symbolic helpers, and a growing set of linear algebra utilities.

## Installation

```bash
npm install exprify
```

## Quick Start

```js
import Exprify from "exprify";

const expr = new Exprify();

console.log(expr.evaluate("5 + 7 * 2"));
// 19

expr.setVariable("x", 10);
console.log(expr.evaluate("x + 5"));
// 15
```

## Browser Usage

```html
<script src="https://unpkg.com/exprify"></script>
<script>
  const expr = new Exprify();
  console.log(expr.evaluate("(10 + 5) * 2"));
</script>
```

`unpkg` resolves to the browser bundle from `dist/exprify.min.js`.

## API

### `new Exprify()`

Creates a new evaluator instance with isolated state for:

- variables
- functions
- units
- compiled-expression cache

### `expr.evaluate(expression)`

Parses and evaluates an expression string.

```js
expr.evaluate("10 + 5 * 2");
// 20
```

### `expr.parse(expression)`

Returns `{ tokens, ast }`.

```js
const parsed = expr.parse("2 inch to cm");
console.log(parsed.tokens);
console.log(parsed.ast);
```

### `expr.compile(expression)`

Compiles an expression once and returns a reusable function.

```js
const area = expr.compile("width * height");

console.log(area({ width: 6, height: 4 }));
// 24
```

### `expr.setVariable(name, value)` / `expr.getVariable(name)`

Stores and reuses values across evaluations.

```js
expr.setVariable("x", 10);
expr.setVariable("y", 5);

console.log(expr.evaluate("x + y * 2"));
// 20
```

### `expr.addFunction(name, fn)`

Registers a custom JavaScript function.

```js
expr.addFunction("double", (n) => n * 2);

console.log(expr.evaluate("double(5) + 3"));
// 13
```

### Inline Function Definitions

You can define functions inside expressions.

```js
expr.evaluate("hyp(a, b) = sqrt(a ^ 2 + b ^ 2)");

console.log(expr.evaluate("hyp(3, 4)"));
// 5
```

## Features

### Arithmetic

```js
expr.evaluate("2 + 3 * 4");
// 14

expr.evaluate("(2 + 3) * 4");
// 20

expr.evaluate("11n ^ 2n");
// 121n
```

### Strings, Booleans, Complex Numbers

```js
expr.evaluate('"Hello " + "World"');
// "Hello World"

expr.evaluate("true && false");
// false

expr.evaluate("9 / 3 + 2i");
// "3 + 2i"
```

### Unit Conversion

```js
expr.evaluate("2 inch to cm");
// "5.08 cm"

expr.evaluate("5 cm + 2 inch");
// "10.08 cm"

expr.evaluate("5cm + 0.2 m in inch");
// "9.84251968503937 inch"

expr.evaluate("a = 5.08 cm + 2 inch");
expr.evaluate("a to inch");
// "4 inch"
```

### Matrices

Exprify supports matrix literals with `;` as row separators.

```js
expr.evaluate("a = [1, 2, 3; 4, 5, 6]");
// {"exprify":"DenseMatrix","data":[[1,2,3],[4,5,6]],"size":[2,3]}

expr.evaluate("a[2, 3]");
// 6

expr.evaluate("a[1:2, 2]");
// "2\n5"

expr.evaluate("a[3, 1:3] = [7, 8, 9]");
// "7\t8\t9"

expr.evaluate("det([-1, 2; 3, 1])");
// -7
```

### Linear Algebra Helpers

```js
expr.evaluate("lup([[2, 1], [1, 4]])");
// {"L":{"exprify":"DenseMatrix",...},"U":{"exprify":"DenseMatrix",...},"p":[0,1]}

expr.evaluate("lyap([[-2, 0], [1, -4]], [[3, 1], [1, 3]])");
// {"exprify":"DenseMatrix","data":[[0.75,0.2916666666666667],[0.2916666666666667,0.44791666666666663]],"size":[2,2]}

expr.evaluate("qr([[1, -1, 4], [1, 4, -2], [1, 4, 2], [1, -1, 0]])");
// {"Q":{"exprify":"DenseMatrix",...},"R":{"exprify":"DenseMatrix",...}}

expr.evaluate("polynomialRoot(-6, 11, -6, 1)");
// [1,3,2]
```

Available helpers currently include `det`, `lsolve`, `lup`, `lyap`, `qr`, and `polynomialRoot`.

### Algebra Helpers

```js
expr.evaluate('simplify("2x + x")');
// "3 * x"

expr.evaluate('derivative("2x^2 + 3x + 4", "x")');
// "4 * x + 3"

expr.evaluate('rationalize("2x/y - y/(x+1)", true)');
// {"numerator":"2 * x ^ 2 + 2 * x - y ^ 2","denominator":"x * y + y","coefficients":[],"variables":["x","y"],"expression":"(2 * x ^ 2 + 2 * x - y ^ 2) / (x * y + y)"}
```

### Parse and AST Utilities

```js
expr.evaluate('leafCount("e^(i*pi)-1")');
// 4

expr.evaluate('leafCount(parse("{a: 22/7, b: 10^(1/2)}"))');
// 5
```

### Built-in Functions

Common built-ins include:

- `max`, `min`, `abs`, `round`, `floor`, `ceil`, `sqrt`, `pow`
- `sin`, `cos`, `tan`, `asin`, `acos`, `atan`
- `log`, `log10`, `exp`, `random`
- `clamp`, `if`, `length`, `typeof`
- `det`, `lsolve`, `lup`, `lyap`, `qr`, `polynomialRoot`
- `simplify`, `derivative`, `rationalize`, `leafCount`, `parse`

## Return Types

Depending on the expression, `evaluate()` may return:

- numbers / bigint / booleans
- strings
- formatted unit strings like `"5.08 cm"`
- formatted complex strings like `"3 + 2i"`
- matrix wrapper JSON strings such as `{"exprify":"DenseMatrix",...}`
- JSON strings for structured helper outputs like `lup()` or `rationalize(..., true)`

## Manual Build

```bash
git clone https://github.com/code-hemu/Exprify.git
cd Exprify
npm install
npm run build
```

Build output is written to `dist/`.

## Testing

```bash
npm test
```

## License

Exprify is licensed under GPL-3.0. Copyright (c) [Nirmal Paul](https://github.com/nirmalpaul383/).

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push your branch and open a pull request.

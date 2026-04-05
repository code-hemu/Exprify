# Exprify

[![Exprify Social Banner](https://raw.githubusercontent.com/code-hemu/Exprify/refs/heads/main/src/assets/capture.jpg)](https://github.com/code-hemu/Exprify)

Exprify is a JavaScript math expression parser and evaluator with runtime type checking. It supports arithmetic, variables, custom functions, unit conversion, matrices, complex numbers, and a small set of algebra helpers.

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
```

## Browser Usage

```html
<script src="dist/exprify.js"></script>
<script>
  const expr = new Exprify();
  console.log(expr.evaluate("(10 + 5) * 2"));
</script>
```

## API

### `new Exprify()`

Creates a new evaluator instance with isolated variable, function, unit, and compile-cache state.

### `expr.evaluate(expression)`

Parses and evaluates an expression string.

```js
expr.evaluate("10 + 5 * 2");
// 20
```

### `expr.parse(expression)`

Returns the token list and AST for an expression.

```js
const parsed = expr.parse("2 inch to cm");
console.log(parsed.tokens);
console.log(parsed.ast);
```

### `expr.compile(expression)`

Compiles an expression once and returns a reusable function. You can pass a temporary scope object when calling it.

```js
const area = expr.compile("width * height");

console.log(area({ width: 6, height: 4 }));
// 24
```

### `expr.setVariable(name, value)` / `expr.getVariable(name)`

Stores values on the instance for reuse across evaluations.

```js
expr.setVariable("x", 10);
expr.setVariable("y", 5);

console.log(expr.evaluate("x + y * 2"));
// 20
```

### `expr.addFunction(name, fn)`

Registers a custom function.

```js
expr.addFunction("double", (n) => n * 2);

console.log(expr.evaluate("double(5) + 3"));
// 13
```

## Supported Features

### Arithmetic and precedence

```js
expr.evaluate("2 + 3 * 4");
// 14

expr.evaluate("(2 + 3) * 4");
// 20

expr.evaluate("11n ^ 2n");
// 121n
```

### Strings and booleans

```js
expr.evaluate('"Hello " + "World"');
// "Hello World"

expr.evaluate("true && false");
// false
```

### Built-in functions

```js
expr.evaluate("max(10, 25, 7)");
// 25

expr.evaluate("min(10, 25, 7)");
// 7

expr.evaluate("sqrt(81)");
// 9
```

Common built-ins include `max`, `min`, `abs`, `round`, `floor`, `ceil`, `sqrt`, `pow`, `sin`, `cos`, `tan`, `log`, `log10`, `exp`, `clamp`, `if`, `length`, `typeof`, `det`, `simplify`, and `derivative`.

### Unit conversion

```js
expr.evaluate("2 inch to cm");
// "5.08 cm"

expr.evaluate("5 cm + 2 inch");
// "10.08 cm"

expr.evaluate("5cm + 0.2 m in inch");
// "9.84251968503937 inch"
```

### Matrices

```js
expr.evaluate("det([-1, 2; 3, 1])");
// -7

expr.evaluate("a = [1, 2, 3; 4, 5, 6]");
expr.evaluate("a[2, 3]");
// 6

expr.evaluate("a[1:2, 2]");
// "2\n5"
```

### Complex numbers

```js
expr.evaluate("9 / 3 + 2i");
// "3 + 2i"
```

### Algebra helpers

```js
expr.evaluate('simplify("2x + x")');
// "3 * x"

expr.evaluate('derivative("2x^2 + 3x + 4", "x")');
// "4 * x + 3"
```

## Manual Build

```bash
git clone https://github.com/code-hemu/Exprify.git
cd Exprify
npm install
npm run build
```

Build output is generated in `dist/`.

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
4. Push the branch and open a pull request.

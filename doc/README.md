# Exprify Docs

This folder contains supporting documentation for Exprify beyond the main project README.

## Contents

### Getting Started

Exprify is a math expression parser and evaluator for JavaScript with support for:

- arithmetic and precedence
- variables and assignments
- custom JavaScript functions
- inline function definitions
- unit conversion
- matrices
- complex numbers
- algebra helpers

## Quick Example

```js
import Exprify from "exprify";

const expr = new Exprify();

expr.evaluate("hyp(a, b) = sqrt(a ^ 2 + b ^ 2)");
console.log(expr.evaluate("hyp(3, 4)"));
// 5
```

## Main References

- Project overview and API: [`../README.md`](../README.md)
- Token type reference: [`tokenType.txt`](./tokenType.txt)

## Useful Expressions

```txt
x = 10
y = 5
x + y * 2
```

```txt
2 inch to cm
5 cm + 2 inch
```

```txt
m = [1, 2; 3, 4]
det(m)
```

```txt
hyp(a, b) = sqrt(a ^ 2 + b ^ 2)
hyp(6, 8)
```

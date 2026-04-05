---
layout: default
title: Exprify Docs
---

# Exprify Docs

Exprify is a JavaScript expression parser and evaluator for math-heavy apps.

## Highlights

- arithmetic, precedence, bigint, and booleans
- variables, assignments, and inline functions
- unit conversion
- matrices and linear algebra helpers
- complex numbers
- symbolic helpers like `simplify`, `derivative`, and `rationalize`

## Quick Example

```js
import Exprify from "exprify";

const expr = new Exprify();

expr.evaluate("hyp(a, b) = sqrt(a ^ 2 + b ^ 2)");
console.log(expr.evaluate("hyp(3, 4)"));
// 5
```

## References

- [Project README](../README.md)
- [Token Type Notes](./tokenType.txt)

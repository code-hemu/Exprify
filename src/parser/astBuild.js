export function buildAST(tokens) {
  let current = 0;

  const peek = () => tokens[current];
  const consume = () => tokens[current++];

  const match = (type, value) => {
    const t = peek();
    if (!t) return false;

    if (t.type !== type) return false;

    if (value !== undefined && t.value !== value) return false;

    current++;
    return true;
  };

  const parseSliceOrIndex = () => {
    let start = null;

    if (!(peek()?.type === "Colon" || peek()?.type === "Comma" || peek()?.type === "ArrayEnd")) {
      start = parseExpression();
    }

    if (match("Colon")) {
      let end = null;

      if (!(peek()?.type === "Comma" || peek()?.type === "ArrayEnd")) {
        end = parseExpression();
      }

      return {
        type: "SliceExpression",
        start,
        end
      };
    }

    return start;
  };

  /* ================= PRIMARY ================= */
  function parsePrimary() {
    const token = consume();
    if (!token) throw new Error("Unexpected end of input");

    switch (token.type) {
      case "Number":
      case "BigInt":
      case "Boolean":
      case "String":
        return { type: "Literal", value: token.value };

      case "ImaginaryLiteral":
        return { type: "ImaginaryLiteral", value: token.value };

      case "NumberWithUnit":
        return {
          type: "UnitLiteral",
          value: token.value,
          unit: token.unit
        };

      case "Identifier":
        return { type: "Identifier", name: token.name };
      
      case "Function": // 🔥 ADD THIS
        return {
          type: "Identifier",
          name: token.name
        };

      case "Parenthesis":
        if (token.value === "(") {
          const expr = parseExpression();

          if (!match("Parenthesis", ")")) {
            throw new Error(`Expected ')'`);
          }

          return expr;
        }
        
      case "ArrayStart": {
        const rows = [];
        let currentRow = [];

        if (!match("ArrayEnd")) {
          while (true) {
            currentRow.push(parseExpression());

            if (match("Comma")) {
              continue;
            }

            if (match("Semicolon")) {
              rows.push(currentRow);
              currentRow = [];
              continue;
            }

            if (match("ArrayEnd")) {
              rows.push(currentRow);
              break;
            }

            throw new Error(`Expected ',', ';', or ']' at ${current}`);
          }
        }

        if (!rows.length) {
          return { type: "ArrayExpression", elements: [] };
        }

        if (rows.length === 1) {
          return { type: "ArrayExpression", elements: rows[0] };
        }

        return {
          type: "ArrayExpression",
          elements: rows.map((elements) => ({
            type: "ArrayExpression",
            elements
          }))
        };
      }

      case "BlockStart": {
        const properties = [];

        if (!match("BlockEnd")) {
          do {
            const keyToken = consume();

            if (
              keyToken.type !== "Identifier" &&
              keyToken.type !== "String"
            ) {
              throw new Error("Invalid object key");
            }

            if (!match("Colon")) {
              throw new Error("Expected ':' after key");
            }

            const value = parseExpression();

            properties.push({
              key: keyToken.value,
              value
            });

          } while (match("Comma"));

          if (!match("BlockEnd")) {
            throw new Error(`Expected '}' at ${current}`);
          }
        }

        return { type: "ObjectExpression", properties };
      }
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  /* ================= MEMBER ================= */
  function parseMember() {
    let object = parsePrimary();

    while (true) {
      if (match("ArrayStart")) {
        const selectors = [];

        if (!match("ArrayEnd")) {
          do {
            selectors.push(parseSliceOrIndex());
          } while (match("Comma"));

          if (!match("ArrayEnd")) {
            throw new Error(`Expected ']' at ${current}`);
          }
        }

        object = {
          type: "IndexExpression",
          object,
          selectors
        };
        continue;
      }

      if (match("Dot")) {
        const property = consume();

        if (property.type !== "Identifier") {
          throw new Error("Expected property after '.'");
        }

        object = {
          type: "MemberExpression",
          object,
          property: { type: "Identifier", name: property.value },
          optional: false
        };
        continue;
      }

      if (match("Operator", "?.")) {
        const property = consume();

        object = {
          type: "MemberExpression",
          object,
          property: { type: "Identifier", name: property.value },
          optional: true
        };
        continue;
      }

      break;
    }

    return object;
  }

  /* ================= CALL ================= */
  function parseCallChain() {
    let expr = parseMember();

    while (peek()?.type === "Parenthesis" && peek()?.value === "(") {
      consume(); // '('

      const args = [];

      if (!(peek()?.type === "Parenthesis" && peek()?.value === ")")) {
        do {
          args.push(parseExpression());
        } while (match("Comma"));
      }

      if (!match("Parenthesis", ")")) {
        throw new Error(`Expected ')' at ${current}`);
      }

      expr = {
        type: "CallExpression",
        callee: expr,
        arguments: args
      };
    }

    return expr;
  }

  /* ================= UNARY ================= */
  function parseUnary() {
    if (match("UnaryOperator")) {
      const operator = tokens[current - 1].value;

      return {
        type: "UnaryExpression",
        operator,
        argument: parseUnary()
      };
    }

    return parseCallChain();
  }

  /* ================= POWER ================= */
  function parsePower() {
    let left = parseUnary();

    if (match("Operator", "^")) {
      const right = parsePower();
      return {
        type: "BinaryExpression",
        operator: "^",
        left,
        right
      };
    }

    return left;
  }

  /* ================= MULT ================= */
  function parseMultiplication() {
    let left = parsePower();

    while (
      match("Operator", "*") ||
      match("Operator", "/") ||
      match("Operator", "%")
    ) {
      const operator = tokens[current - 1].value;
      const right = parsePower();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= ADD ================= */
  function parseAddition() {
    let left = parseMultiplication();

    while (match("Operator", "+") || match("Operator", "-")) {
      const operator = tokens[current - 1].value;
      const right = parseMultiplication();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= UNIT CONVERSION ================= */
  function parseUnitConversion() {
    let left = parseAddition();

    const nextKeyword = peek();
    if (nextKeyword?.type === "Keyword" && ["to", "in"].includes(nextKeyword.value)) {
      consume();
      const next = consume();

      if (!next || next.type !== "Unit") {
        throw new Error(`Expected unit after '${nextKeyword.value}'`);
      }

      return {
        type: "UnitConversion",
        from: left,
        to: next.value
      };
    }

    return left;
  }

  /* ================= COMPARISON ================= */
  function parseComparison() {
    let left = parseUnitConversion();

    while (
      match("Operator", ">") ||
      match("Operator", "<") ||
      match("Operator", ">=") ||
      match("Operator", "<=") ||
      match("Operator", "==")
    ) {
      const operator = tokens[current - 1].value;
      const right = parseUnitConversion();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= LOGICAL ================= */
  function parseLogical() {
    let left = parseComparison();

    while (
      match("Operator", "&&") ||
      match("Operator", "||")
    ) {
      const operator = tokens[current - 1].value;
      const right = parseComparison();

      left = {
        type: "LogicalExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= NULLISH ================= */
  function parseNullish() {
    let left = parseLogical();

    while (match("Operator", "??")) {
      const right = parseLogical();

      left = {
        type: "LogicalExpression",
        operator: "??",
        left,
        right
      };
    }

    return left;
  }

  /* ================= TERNARY ================= */
  function parseTernary() {
    let test = parseNullish();

    if (match("Ternary", "?")) {
      const consequent = parseExpression();

      if (!match("Ternary", ":")) {
        throw new Error("Expected ':' in ternary");
      }

      const alternate = parseExpression();

      return {
        type: "ConditionalExpression",
        test,
        consequent,
        alternate
      };
    }

    return test;
  }

  /* ================= PIPELINE ================= */
  function parsePipeline() {
    let left = parseTernary();

    while (match("Operator", "|>")) {
      const right = parseTernary();

      left = {
        type: "PipelineExpression",
        left,
        right
      };
    }

    return left;
  }

  /* ================= ASSIGNMENT ================= */
  function parseAssignment() {
    let left = parsePipeline();

    if (
      match("Operator", "=") ||
      match("Operator", "+=") ||
      match("Operator", "-=") ||
      match("Operator", "*=") ||
      match("Operator", "/=")
    ) {
      const operator = tokens[current - 1].value;

      if (
        left.type !== "Identifier" &&
        left.type !== "MemberExpression" &&
        left.type !== "IndexExpression"
      ) {
        throw new Error("Invalid assignment target");
      }

      const right = parseAssignment();

      return {
        type: "AssignmentExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  /* ================= ENTRY ================= */
  function parseExpression() {
    return parseAssignment();
  }

  const ast = parseExpression();

  if (current < tokens.length) {
    throw new Error(
      `Unexpected token at end: ${JSON.stringify(peek())}`
    );
  }

  return ast;
}

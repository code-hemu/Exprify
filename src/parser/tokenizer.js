export function tokenize(expr, context = {}) {
  const tokens = [];
  let current = "";
  let quote = "";

  const operators = ["+", "-", "*", "/", "%", "^", "=", ">", "<", "!", "&", "|"];
  const multiOps = [
    "==", ">=", "<=", "&&", "||",
    "+=", "-=", "*=", "/=", "%=",
    "?.", "??", "|>"
  ];

  const parentheses = "()";
  const comma = ",";
  const semicolon = ";";
  const keywords = ["to", "in"];
  // const functions = context.functions?.getAllFunctionsName?.() || [];
  const units = context.units?.getAllUnitsFlat?.() || [];

  const isIdentifier = (s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s);

  function getContext(str, charIndex) {
      // 1. Extract all alphanumeric words into an array
      const words = str.match(/[a-z0-9]+/gi) || [];
      
      // 2. Identify the current character and the one immediately before it
      const currentChar = str[charIndex] || null;
      const prevChar = charIndex > 0 ? str[charIndex - 1] : null;
      
      // 3. Find the word that contains the current charIndex
      let start = charIndex;
      // Move pointer back to the start of the current word
      while (start > 0 && /[a-z0-9]/i.test(str[start - 1])) start--;
      
      let end = charIndex;
      // Move pointer forward to the end of the current word
      while (end < str.length && /[a-z0-9]/i.test(str[end])) end++;
      
      const currentWord = str.substring(start, end);

      // 4. Find the word that appears before the currentWord in the sequence
      const currentWordIdx = words.indexOf(currentWord);
      const prevWord = currentWordIdx > 0 ? words[currentWordIdx - 1] : null;

      // 5. Find the word that appears after the currentWord
      const nextWord = (currentWordIdx !== -1 && currentWordIdx < words.length - 1) 
                      ? words[currentWordIdx + 1] 
                      : null;

      return {
          prevWord: prevWord,
          prevChar: prevChar,
          currentWord: currentWord,
          currentChar: currentChar,
          nextWord: nextWord
      };
  }

  const isUnaryContext = (prev) =>
    !prev ||
    prev.type === "Operator" ||
    prev.type === "UnaryOperator" ||
    (prev.type === "Parenthesis" && prev.value !== ")") ||
    prev.type === "ArrayStart" ||
    prev.type === "Semicolon" ||
    prev.type === "Comma" ||
    prev.type === "Ternary";

  const flushCurrent = (nextChar, index) => {
    if (!current) return;

    // BOOLEAN
    if (/^(true|false)$/i.test(current)) {
      tokens.push({ type: "Boolean", value: current.toLowerCase() === "true" });
      current = "";
      return;
    }

    // KEYWORD
    if (keywords.includes(current)) {
      tokens.push({ type: "Keyword", value: current, pos: index });
      current = "";
      return;
    }

    // BIGINT
    if (/^\d+n$/.test(current)) {
      tokens.push({ type: "BigInt", value: BigInt(current.slice(0, -1)), pos: index });
      current = "";
      return;
    }

    // HEX
    if (/^0x[0-9a-fA-F]+$/.test(current)) {
      tokens.push({ type: "Number", value: parseInt(current, 16), pos: index });
      current = "";
      return;
    }

    // BINARY
    if (/^0b[01]+$/.test(current)) {
      tokens.push({ type: "Number", value: parseInt(current, 2), pos: index });
      current = "";
      return;
    }

    // NUMBER (including scientific)
    if (/^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i.test(current)) {
      tokens.push({ type: "Number", value: parseFloat(current), pos: index });
      current = "";
      return;
    }

    // IMAGINARY NUMBER
    if (/^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?i$/i.test(current)) {
      tokens.push({
        type: "ImaginaryLiteral",
        value: parseFloat(current.slice(0, -1)),
        pos: index
      });
      current = "";
      return;
    }

    // IMAGINARY UNIT
    if (/^[+-]?i$/i.test(current)) {
      const sign = current[0] === "-" ? -1 : 1;
      tokens.push({
        type: "ImaginaryLiteral",
        value: sign,
        pos: index
      });
      current = "";
      return;
    }

    // NUMBER + UNIT
    const numUnit = current.match(/^([+-]?\d+(\.\d+)?)([a-zA-Z]+)$/);
    if (numUnit) {
      const value = parseFloat(numUnit[1]);
      const unit = numUnit[3];

      tokens.push({
        type: units.includes(unit) ? "NumberWithUnit" : "UnknownUnit",
        value,
        unit,
        pos: index
      });

      current = "";
      return;
    }

    // UNIT
    if (units.includes(current)) {
      const {prevWord} = getContext(expr, index);
      if (nextChar !== "(") {
        if (prevWord){
          if (!isNaN(parseFloat(prevWord)) || prevWord === "to" || prevWord === "in") {
            // console.log("Context for unit detection:", {current, prevWord, nextChar});

            tokens.push({ type: "Unit", value: current, pos: index });
            current = "";
            return;
          }
        }
      }
    }

    // IDENTIFIER
     if (isIdentifier(current)) {
      if (nextChar === "(") {
        tokens.push({
          type: "Function",
          name: current,
          pos: index
        });
      } else {
        tokens.push({
          type: "Identifier",
          name: current,
          pos: index
        });
      }

      current = "";
      return;
    }

    throw new Error(`Invalid token "${current}" at index ${index}`);
  };
  

  for (let i = 0; i < expr.length; i++) {
    let char = expr[i];
    let next = expr[i + 1];

    // comments
    if (char === "/" && next === "/") {
      while (i < expr.length && expr[i] !== "\n") i++;
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < expr.length && !(expr[i] === "*" && expr[i + 1] === "/")) i++;
      i++;
      continue;
    }

    // string
    if (`"'`.includes(char)) {
      if (!quote) {
        quote = char;
        current += char;
      } else if (quote === char) {
        current += char;
        tokens.push({
          type: "String",
          value: current.slice(1, -1),
          pos: i
        });
        current = "";
        quote = "";
      } else {
        current += char;
      }
      continue;
    }

    if (quote) {
      if (char === "\\") {
        current += char + expr[++i];
      } else {
        current += char;
      }
      continue;
    }

    // multi operators
    const twoChar = char + next;
    if (multiOps.includes(twoChar)) {
      flushCurrent(char, i);
      tokens.push({ type: "Operator", value: twoChar, pos: i });
      i++;
      continue;
    }

    if (char === "?") {
      tokens.push({ type: "Ternary", value: "?" });
      continue;
    }

    // only treat ':' as ternary IF previous token was '?'
    if (char === ":") {
      flushCurrent(char, i);
      const prev = tokens[tokens.length - 1];

      if (prev && prev.type === "Ternary") {
        tokens.push({ type: "Ternary", value: ":" });
      } else {
        tokens.push({ type: "Colon" });
      }
      continue;
    }

    // dot
    if (char === "." && /\d/.test(current) && /\d/.test(next)) {
      current += char;
      continue;
    }

    if (char === ".") {
      flushCurrent(char, i);
      tokens.push({ type: "Dot", pos: i });
      continue;
    }

    // operators
    if (operators.includes(char)) {
      flushCurrent(char, i);

      const prev = tokens[tokens.length - 1];
      if ((char === "-" || char === "!") && isUnaryContext(prev)) {
        tokens.push({ type: "UnaryOperator", value: char, pos: i });
      } else {
        tokens.push({ type: "Operator", value: char, pos: i });
      }
      continue;
    }

    // parenthesis
    if (parentheses.includes(char)) {
      flushCurrent(char, i);
      tokens.push({ type: "Parenthesis", value: char, pos: i });
      continue;
    }

    // array
    if (char === "[") {
      flushCurrent(char, i);
      tokens.push({ type: "ArrayStart", pos: i });
      continue;
    }

    if (char === "]") {
      flushCurrent(char, i);
      tokens.push({ type: "ArrayEnd", pos: i });
      continue;
    }

    // OBJECT START
    if (char === "{") {
      flushCurrent(char, i);
      tokens.push({ type: "BlockStart", pos: i });
      continue;
    }

    // OBJECT END
    if (char === "}") {
      flushCurrent(char, i);
      tokens.push({ type: "BlockEnd", pos: i });
      continue;
    }

    // comma
    if (char === comma) {
      flushCurrent(char, i);
      tokens.push({ type: "Comma", pos: i });
      continue;
    }

    // semicolon
    if (char === semicolon) {
      flushCurrent(char, i);
      tokens.push({ type: "Semicolon", pos: i });
      continue;
    }

    // space
    if (char === " ") {
      flushCurrent(next, i);
      continue;
    }

    // build token
    current += char;

    if (i === expr.length - 1) {
      flushCurrent(null, i);
    }
  }

  if (quote) throw new Error("Unclosed string literal");

  // merge number + unit
  const merged = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];

    if (t?.type === "Number" && next?.type === "Unit") {
      merged.push({
        type: "NumberWithUnit",
        value: t.value,
        unit: next.value,
        pos: t.pos
      });
      i++;
      continue;
    }

    merged.push(t);
  }

  // implicit multiplication
  const final = [];
  for (let i = 0; i < merged.length; i++) {
    const a = merged[i];
    const b = merged[i + 1];

    final.push(a);

    if (
      a && b &&
      (
        (["Number", "Identifier"].includes(a.type) ||
          (a.type === "Parenthesis" && a.value === ")") ||
          a.type === "ArrayEnd") &&
        (["Identifier", "Function"].includes(b.type) ||
          (b.type === "Parenthesis" && b.value === "("))
      )
    ) {
      final.push({ type: "Operator", value: "*", implicit: true });
    }
  }

  return final;
}

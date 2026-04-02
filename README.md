# Exprify — Math Expression Parser & Evaluator

[![Exprify Social Banner](https://raw.githubusercontent.com/code-hemu/Exprify/refs/heads/main/src/assets/capture.jpg)](https://github.com/code-hemu/Exprify)

Exprify is a JavaScript expression parser and evaluator supporting math operations, variables, and custom functions.

## 🔧 Manual Build
1. Clone the repository:
   ```bash
   git clone https://github.com/code-hemu/Exprify.git
   cd Exprify

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   
The output will be generated in a dist/ folder.

## 🚀 Quick Start
### Node.js / ES Modules
```Javascript
import Exprify from "exprify";
const expr = new Exprify();
console.log(expr.evaluate("5 + 7 * 2")); 
// → 19
```
### Browser (UMD)
```html
<script src="exprify.js"></script>
<script>
  const expr = new Exprify();
  console.log(expr.evaluate("10 + 5 * 2"));
</script>
```
## 🧠 Examples
### ➕ Basic Math
```Javascript
expr.evaluate("10 + 5 * 2"); 
// → 20
```
### 🧮 Parentheses
```Javascript
expr.evaluate("(10 + 5) * 2"); 
// → 30
```
### 🔢 Variables
```Javascript
expr.setVariable("x", 10);
expr.setVariable("y", 5);

expr.evaluate("x + y * 2");
// → 20
```
### 🔧 Custom Functions
```Javascript
expr.addFunction("double", (x) => x * 2);

expr.evaluate("#double(5) + 3");
// → 13
```

### 📊 Built-in Functions
```Javascript
expr.evaluate("#max(10, 25, 7)"); 
// → 25

expr.evaluate("#min(10, 25, 7)"); 
// → 7
```
## 🤿 Other Examples
```Javascript
//Create a new Exprify object with Exprify class
const expr = new Exprify();

//Simple Expression evaluation
console.log(expr.evaluate(`25+5*2`)); // → 35

//Nested expression evaluation
console.log(expr.evaluate(`((52/8+2)+56*((25/2)*4+(8-2)))*2`)); // → 6289

//BigInt Expression evaluation
console.log(expr.evaluate(`11n ^2n`)); // → 121n 

//String concatenation: '+' Operator behaves as concatenation operator
console.log(expr.evaluate(`"Hello " + "World"`)); // → "Hello World"

//Invalid Expression: One operand is a string and another one is number
console.log(expr.evaluate(`"45" + 5`)); // → datatype error

//Invalid Expression: One operand is a number and another one is boolean
console.log(expr.evaluate(`45 * true`)); // → datatype error

//Invalid Expression: unclosed quoted text
console.log(expr.evaluate(`"Hello World `)); // → unclosed error
```

## 🧩 Built-in Functions
Exprify has some built-in functions, here is a complete list
|  Function | Details | Example |
| - | - |- |
|**#max(...)**| #max() function returns the largest number of the provided numerical arguments | ```"#max(45,50,20, 4+9*(6+4))" //returns 94 ```|
|**#min(...)**| #min() function returns the smallest number of the provided numerical arguments | ```"#min(45,50,20, 4+9*(6+4))" //returns 20 ```|
|**#and(...)** <br> or <br> **#&&**| **#and()** or **#&&** tests each of its arguments , if all are true then it will return true | ```"#and(true , true, false)" //returns false ``` <br> <br> ```"#&&(true , true, false)" //returns false ```|
|**#or(...)** <br> or <br> **#\|\|** | **#or()** or **#\|\|()** tests each of its arguments , if any of its arguments is true then it will return true | ```"#or(true , true, false)" //returns true ``` <br> <br> ```"#\|\|(true , true, false)" //returns true```|
|**#not(x)** <br> or <br> **#!**| **#not()** or **#!()** changes 'true' value to a 'false' value and 'false' value to a 'true' value | ```"#not(true)" //returns false ``` <br> <br> ```"#!(true)" //returns false ``` |
|**#greaterThan(...)** <br> or <br> **#>**| **#greaterThan()** or **#>()** takes 2 parameters and compare if that the 1st parameter is greater than the second parameter or not | ```"#greaterThan(67 , 5)" //returns true ``` <br> <br>```"#>(67 , 5)" //returns true ``` |
|**#lessThan(...)** <br> or <br> **#<**| **#lessThan()** or **#<()** takes 2 parameters and compare if that the 1st parameter is less than the second parameter or not | ```"#lessThan(67 , 5)" //returns false ``` <br> <br>```"#<(67 , 5)" //returns false ``` |
|**#isEqual(...)** <br> or <br> **#==**| **#isEqual()** or **#==()** takes 2 parameters and compare if that the both parameter is same numerical value or not | ```"#isEqual(60 , 50+10)" //returns true ``` <br> <br>```"#==(60 , 50+10)" //returns true ``` |
|**#if(...)**| **#if()** takes 3 parameters. 1st parameter is a condition parameter, if the condition is true then it returns 2nd parameter otherwise it returns 3rd parameter (if the 3rd parameter is not specified then its default value false will be return) | ```"#if(true , 5, 80)" //returns 80 ``` <br> <br> ```"#if(#<(50,100) , '50 is less than 100', '100 is less than 50')" //returns '50 is less than 100' ```|


## 📜 License
Exprify is freely distributable under the terms of the GPL-3.0 License. Copyright (c) [Nirmal Paul](https://github.com/nirmalpaul383/) (N Paul).


## 🤝 Contributing

Contributions are welcome!

1. Fork the repo

2. Create your branch:
   ```bash
   git checkout -b feature/your-feature
   
3. Commit changes:
   ```bash   
   git commit -m "Add your feature"
   
4. Push and open a PR 🚀

## ⭐ Support
If you like [this project](https://github.com/code-hemu/Exprify), give it a ⭐ on GitHub! This project is originally made by [Nirmal Paul](https://github.com/nirmalpaul383/) (N Paul) and replicate by [ViewPoint](https://github.com/nirmalpaul383/ViewPoint). The Main Developer's (N Paul) [youtube page](https://www.youtube.com/channel/UCY6JY8bTlR7hZEvhy6Pldxg/), [facebook page](https://facebook.com/a.new.way.Technical/).


# Rheactor Parser

Rheactor Parser is a simple parser for Javascript.

## Reference

The first step is to instantiate the `Parser`. Its _first argument_ is the **name** of the _initial rule_ which, if not specified, will be the first rule declared.

```ts
const parser = new Parser();
```

And then their respective _rules_ can be declared. **Rules** can be defined in many ways, but the essence is the use of `parser.rule(name, terms)`.
Each rule must have a `name` and its `terms` (a _single term_ or an _array of terms_), which can reference other _rules_ or _keywords_.

```ts
const parser = new Parser();

parser.rule("example", /example/);

console.log(parser.parse("example")); // "example"
```

Note that we defined a _single term_ for the `example` rule (which will be our _initial rule_, since it was the first one to be declared) and
also that this term is written using _regular expressions_. **Regular expressions** are used here because we can use their full power to consume the _input data_.

So, when we perform the parsing through the `parser.parse(input)` method we will have the output as `"example"`.
In this case, as our rule has a single _capture term_, then we will have an output as a _string_.

```ts
const parser = new Parser();

parser.rule("example", /(\d)\+(\d)/);

console.log(parser.parse("1+2")); // [ "1", "2" ]
```

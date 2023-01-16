# Rheactor Parser

Rheactor Parser is a simple parser for Javascript.

## Reference

The first step is to instantiate the `Parser`. Its _first argument_ is the **name** of the _initial rule_ which, if not specified, will be the first rule declared.

```ts
const parser = new Parser();
```

And then their respective _rules_ can be declared. **Rules** can be defined in many ways, but the essence is the use of `parser.rule(name, terms)`.
Each rule must have a `name` and its `terms` (a _single term_ or an _array of terms_).

**Terms** can be _regular expressions_ or _strings_. However, strings are not parsed literally. Keep reading to understand better.

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

Note that when creating _groups_ in regular expressions, only the inputs captured by the groups will be part of the output.
However, if you want to capture all the value captured originally you must wrap it in a larger group (eg. `/((\d)\+(\d))/`).

Remember that if only one group is captured (eg. `/(\d)\+\d/` for `1+2`), it will be returned as a string instead of an array (eg. `"1"`).

Now let's assume you want to sum the digits in fact. In this case, you can transform captures via the third argument of `.rule()`.

```ts
const parser = new Parser();

parser.rule("example", /(\d)\+(\d)/, ([a, b]) => Number(a) + Number(b));

console.log(parser.parse("1+2")); // 3
```

Note that so far we have a practical, albeit very simple, example of a rule we created.
But this is not the ideal way for us to deal with all this, as it is quite inflexible.

Let's introduce the concept of _keywords_.

**Keywords** are like _rules_, however, they are never captured, which makes them much more performant if the goal is just to validate the input.
They are defined through the method `parser.keyword(name, [terms])` and follow a pattern very similar to _rules_.
If no _term_ is defined then the _name_ itself will be used as the term.

An important note is: _keywords_ must be defined _before_ any rule and can never be duplicated,
but can contain many different terms: be it _strings_ or _regular expressions_.

```ts
const parser = new Parser();

parser.keyword("+");
parser.keyword("digits", /\d+/);

parser.rule("example", ["digits", "+", "digits"]);

console.log(parser.parse("1+2")); // undefined???
```

Note that, although it _looks like_ a valid definition, the output will be `undefined` instead of `1+2`.
This is because keywords are _never captured_, which makes them a valid option if the objective is just to validate input, as this makes it a more performant option.

If you want to _capture_ you still have to use _regular expressions_.

The following code would be ideal:

```ts
const parser = new Parser();

parser.keyword("+");

parser.rule("example", ["digits", "+", "digits"]);
parser.rule("digits", /\d+/);

console.log(parser.parse("1+2")); // ["1", "2"]
```

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

parser.rule("example", /(\d)\+(\d)/, (a, b) => Number(a) + Number(b));

console.log(parser.parse("1+2")); // 3
```

Note that so far we have a practical, albeit very simple, example of a rule we created.
But this is not the ideal way for us to deal with all this, as it is quite inflexible.

Let's introduce the concept of _tokens_.

**Tokens** are like _rules_, however, they are never captured, which makes them much more performant if the goal is just to validate the input.
They are defined through the method `parser.token(name, [terms])` and follow a pattern very similar to _rules_.
If no _term_ is defined then the _name_ itself will be used as the term.

An important note is: _tokens_ must be defined _before_ any rule and can never be duplicated,
but can contain many different terms: be it _strings_ or _regular expressions_.

```ts
const parser = new Parser();

parser.token("+");
parser.token("digits", /\d+/);

parser.rule("example", ["digits", "+", "digits"]);

console.log(parser.parse("1+2")); // undefined???
```

Note that, although it _looks like_ a valid definition, the output will be `undefined` instead of `1+2`.
This is because tokens are _never captured_, which makes them a valid option if the objective is just to validate input, as this makes it a more performant option.

If you want to _capture_ you still have to use _regular expressions_.

The following code would be ideal:

```ts
const parser = new Parser();

parser.token("+");

parser.rule("example", ["digits", "+", "digits"]);
parser.rule("digits", /\d+/);

console.log(parser.parse("1+2")); // ["1", "2"]
```

In the above code, note that we used _strings_ as terms of the rules.
For the `parser.rule()` method, terms like _strings_ mean a _reference_ to other defined _rules_ or _tokens_, not a string literal.

Furthermore, when using an _array of terms_, parsing will only be satisfied if all terms are satisfied for this rule at the same time.

Also, we often need to define a lot of tokens using `parser.tokens(...tokens)` (_pluralized version_). Look the following code:

```ts
parser.token("+");
parser.token("-");
parser.token("*", "x");
```

In the above example, we can combine the `+` and `-` _tokens_, as it is _as is_, but we need to keep the `*` apart, as it has a different definition.

```ts
parser.tokens("+", "-");
parser.token("*", "x");
```

Now let's go a little further.

Between _each term_ of the rules, a possible existence of the _whitespace_ is automatically consumed by default, but not captured.
That is, parsing below would work perfectly, and we would have the same result:

```ts
console.log(parser.parse("1 + 2")); // ["1", "2"]
```

The default **separator** is considered to be any _whitespace_, _tabs_, or _line breaks_ (basically the same as `/\s+/`).
You can change it or disable it simply using the `parser.separator(expression | false)` method.

```ts
const parser = new Parser();

parser.separator(/-/);
parser.rule("example", [/\d/, /\d/]);

console.log(parser.parse("1-2")); // ["1", "2"]
```

However, this option will cause all expected separations to need to be defined explicitly, which may not be ideal for most cases.

For this, there are **two additional methods** that we can use:

- `parser.ruleStrict(name, terms)`: this method disallows any separation between terms unless a specific term for it is explicitly stated;

- `parser.ruleSeparated(name, terms)`: while this method requires that there be at least one separation between the terms.

Thus, we can define the following schema:

```ts
const parser = new Parser();

parser.token("+");

parser.ruleStrict("example", [/\d/, "+", /\d/]);
parser.ruleSeparated("example", [/\d/, "+", /\d/]);

console.log(parser.parse("1+2")); // ["1", "2"]
console.log(parser.parse("1 + 2")); // ["1", "2"]
console.log(parser.parse("1+ 2")); // Error
```

In the code above you will notice _two important things_: the first is that we have _two rules_ with the _same name_.
This is _valid_, and it means that if the first rule fails to be consumed, then the second rule will try to consume.

As the _first way_ for the `example` rule is a _strict rule_ (that is, it does not allow separation), then it will be able to consume `1+2`.
While the _second way_ requires separation between the terms, and then it can consume `1 + 2`.

And finally, it is possible to notice that when using `1+ 2` as input, there will be a parsing failure, since none of the defined rules will be able to consume it.

Well, rules can be recursive. That means it can point to itself, but that needs to at least make sense.
The parser is smart enough to detect infinite loops.

So, look closely at the rule below:

```ts
const parser = new Parser();

parser.token("+");

parser.rule("sum", ["number", "+", "sum"], (a, b) => a + b);
parser.rule("number", /\d/, (d) => Number(d));

console.log(parser.parse("1+2+3+4+5")); // Error?
```

Well, it seems to make perfect sense. Correct? **But no!**

If you look again, you'll notice that the `sum` rule needs to have the terms `number + sum`.
That is, although it depends on itself, it will never be possible to determine its output,
since `sum` does not have a viable alternative for when the third term (`sum`) cannot be resolved.

```ts
const parser = new Parser();

parser.token("+");

parser.rule("sum", ["number", "+", "sum"], (a, b) => a + b);
parser.rule("sum", ["number"]);
parser.rule("number", /\d/u, (d) => Number(d));

console.log(parser.parse("1+2+3+4+5")); // 15
```

Now yes! Note that when `sum` can no longer combine the terms `number + sum`, it will fallback on a `number` only.

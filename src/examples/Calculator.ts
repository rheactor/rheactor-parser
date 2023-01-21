import { Parser } from "@/Parser";

const parser = new Parser();

parser.tokens("+", "-", "*", "/", "(", ")");

parser
  .rule("expression", ["term", "+", "expression"])
  .transform((a, b) => a + b);
parser
  .rule("expression", ["term", "-", "expression"])
  .transform((a, b) => a - b);
parser.rule("expression", "term");

parser.rule("term", ["factor", "*", "term"]).transform((a, b) => a * b);
parser.rule("term", ["factor", "/", "term"]).transform((a, b) => a / b);
parser.rule("term", "factor");

parser.rule("factor", "number");
parser.rule("factor", ["(", "expression", ")"]);

parser.rule("number", /-?\d+/).transform((number) => Number(number));

export const Calculator = parser;

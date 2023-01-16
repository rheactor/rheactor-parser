import { Parser } from "@/Parser";

const parser = new Parser();

parser.keyword("+");
parser.keyword("-");
parser.keyword("*");
parser.keyword("/");
parser.keyword("(");
parser.keyword(")");

parser.rule("expression", ["term", "+", "expression"], (a, b) => a + b);
parser.rule("expression", ["term", "-", "expression"], (a, b) => a - b);
parser.rule("expression", "term");

parser.rule("term", ["factor", "*", "term"], (a, b) => a * b);
parser.rule("term", ["factor", "/", "term"], (a, b) => a / b);
parser.rule("term", "factor");

parser.rule("factor", "number");
parser.rule("factor", ["(", "expression", ")"]);

parser.rule("number", /-?\d+/u, (number) => Number(number));

export const Calculator = parser;

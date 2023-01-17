import { Parser } from "@/Parser";

const parser = new Parser();

// eslint-disable-next-line require-unicode-regexp
const TICK_REPLACER_REGEXP = /``/g;

parser.token("create table", /create\s+table/iu);

parser.rule("expression", ["create table", "identifier"]).transform((table) => {
  return { table };
});

parser
  // eslint-disable-next-line no-control-regex
  .rule("identifier", /`(``|[\u0001-\uFFFF]+)`/u)
  .transform((identifier) => identifier.replace(TICK_REPLACER_REGEXP, "`"));
parser.rule("identifier", /[\w$\u0080-\uFFFF]+/u);

export const TableSchema = parser;

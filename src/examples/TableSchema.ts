import { Parser } from "@/Parser";

const TICK_REPLACER_REGEXP = /``/gu;
const SINGLE_QUOTE_REPLACER_REGEXP = /''/gu;
const DOUBLE_QUOTE_REPLACER_REGEXP = /""/gu;

export interface TableSchemaInterface {
  table: string;
  statements: TableStatement[];
}

type TableStatement = TableStatementColumn | TableStatementIndex;

interface TableStatementColumn {
  format: "column";
  name: string;
  type: TableFunction;
  properties: {
    unsigned?: true;
    nullable?: true;
    default?: string;
    onUpdate?: TableFunction;
    autoIncrement?: true;
    zerofill?: true;
    comment?: string;
    collate?: string;
  } | null;
}

interface TableStatementIndex {
  format: "index";
  type: "primaryKey" | "uniqueKey";
  columns: string[];
}

interface TableFunction {
  name: string;
  args?: string[];
}

const parser = new Parser<TableSchemaInterface>();

parser.tokens("(", ")", ",");
parser.token("CREATE TABLE", /create\s+table/iuy);
parser.token("ON UPDATE", /on\s+update/iuy);
parser.token("DEFAULT", /default/iuy);
parser.token("AUTO_INCREMENT", /auto_increment/iuy);
parser.token("COMMENT", /comment/iuy);
parser.token("COLLATE", /collate/iuy);
parser.token("PRIMARY KEY", /primary\s+key/iuy);
parser.token("UNIQUE KEY", /unique\s+key/iuy);
parser.token("DEFAULT CHARSET", /default\s+charset/iuy);
parser.token("ENGINE", /engine/iuy);
parser.token("ROW_FORMAT", /row_format/iuy);
parser.token(";", /;?/uy);
parser.token("=?", /[=]?/uy);

parser
  .rule("expression", [
    "CREATE TABLE",
    "identifier",
    "(",
    "statements",
    ")",
    "options",
    ";",
  ])
  .transform((table, statements, options) => {
    return { table, statements, options };
  });

parser
  // eslint-disable-next-line no-control-regex
  .rule("identifier", /`((?:``|[\u0001-\u005F\u0061-\uFFFF])+)`/uy)
  .transform((identifier) => identifier.replace(TICK_REPLACER_REGEXP, "`"));
parser.rule("identifier", "name");

parser.rule("name", /[\w$\u0080-\uFFFF]+/uy);

parser
  .rule("statements", ["statement", ",", "statements"])
  .transform((a, b) => [a, ...b]);
parser.rule("statements", "statement").wrap();

parser
  .rule("statement", ["PRIMARY KEY", "(", "identifier", ")"])
  .transform((identifier) => ({
    format: "index",
    type: "primaryKey",
    columns: [identifier],
  }));
parser
  .rule("statement", ["UNIQUE KEY", "(", "identifier", ")"])
  .transform((identifier) => ({
    format: "index",
    type: "unique",
    columns: [identifier],
  }));
parser
  .rule("statement", ["identifier", "function", "properties"])
  .transform((name, type, properties) => ({
    format: "column",
    name,
    type,
    properties,
  }));

parser
  .rule("function", ["name", "(", "arguments", ")"])
  .transform((name, args) => ({ name, args }));
parser.rule("function", "name").transform((name) => ({ name }));

parser
  .rule("arguments", ["argument", ",", "arguments"])
  .transform((a, b) => [a, ...b]);
parser.rule("arguments", "argument").wrap();
parser.rule("arguments", null).wrap();

parser.rule("argument", "scalar");

parser
  .rule("properties", ["property", "properties"])
  .transform((a, b) => ({ ...a, ...b }));
parser.rule("properties", "property");
parser.rule("properties", null);

parser
  .rule("property", /unsigned|zerofill|invisible/iuy)
  .transform((name: string) => ({ [name.toLowerCase()]: true }));
parser
  .rule("property", "AUTO_INCREMENT")
  .transform(() => ({ autoIncrement: true }));
parser
  .rule("property", ["DEFAULT", "value"])
  .transform((d) => ({ default: d }));
parser
  .rule("property", ["ON UPDATE", "function"])
  .transform((func) => ({ onUpdate: func }));
parser.rule("property", "comment").transform((comment) => ({ comment }));
parser
  .rule("property", ["COLLATE", "identifier"])
  .transform((collate) => ({ collate }));
parser
  .rule("property", /(not\s+)?null/iuy)
  .transform((not: string) => (not ? {} : { nullable: true }));

parser
  .rule("comment", ["COMMENT", "=?", /'((?:''|[^'])+)'/iu])
  .transform((comment) => comment.replace(SINGLE_QUOTE_REPLACER_REGEXP, "'"));
parser
  .rule("comment", ["COMMENT", "=?", /"((?:""|[^"])+)"/iu])
  .transform((comment) => comment.replace(DOUBLE_QUOTE_REPLACER_REGEXP, '"'));

parser
  .rule("options", ["option", "options"])
  .transform((a, b) => ({ ...a, ...b }));
parser.rule("options", "option");
parser.rule("options", null);

parser
  .rule("option", ["ENGINE", "=?", "value"])
  .transform((engine: string) => ({ engine }));
parser
  .rule("option", ["AUTO_INCREMENT", "=?", "value"])
  .transform((autoIncrement) => ({ autoIncrement }));
parser
  .rule("option", ["DEFAULT CHARSET", "=?", "value"])
  .transform((defaultCharset) => ({ defaultCharset }));
parser
  .rule("option", ["COLLATE", "=?", "value"])
  .transform((collate) => ({ collate }));
parser
  .rule("option", ["ROW_FORMAT", "=?", "value"])
  .transform((rowFormat) => ({ rowFormat }));
parser.rule("option", "comment").transform((comment) => ({ comment }));

parser.rule("scalar", /\d+|true|false|null|'(?:''|[^'])+'|"(?:""|[^"])+"/iu);

parser.rule("value", "scalar");
parser.rule("value", "name");

export const TableSchema = parser;

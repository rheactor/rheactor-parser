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
parser.token("CREATE TABLE", /create\s+table/iy);
parser.token("ON UPDATE", /on\s+update/iy);
parser.token("DEFAULT", /default/iy);
parser.token("AUTO_INCREMENT", /auto_increment/iy);
parser.token("COMMENT", /comment/iy);
parser.token("COLLATE", /collate/iy);
parser.token("PRIMARY KEY", /primary\s+key/iy);
parser.token("UNIQUE INDEX", /unique\s+index/iy);
parser.token("CONSTRAINT", /constraint/iy);
parser.token("DEFAULT CHARSET", /default\s+charset/iy);
parser.token("CHARACTER SET", /character\s+set/iy);
parser.token("ENGINE", /engine/iy);
parser.token("ROW_FORMAT", /row_format/iy);
parser.token("USING", /using/iy);
parser.token("CHECK", /check/iy);
parser.token(";", /;?/y);
parser.token("=?", /[=]?/y);

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
  .rule("identifier", /`((?:``|[\u0001-\u005F\u0061-\uFFFF])+)`/y)
  .transform((identifier) => identifier.replace(TICK_REPLACER_REGEXP, "`"));
parser.rule("identifier", "name");

parser.rule("name", /[\w$\u0080-\uFFFF]+/y);

parser
  .rule("statements", ["statement", ",", "statements"])
  .transform((a, b) => [a, ...b]);
parser.rule("statements", "statement").wrap();

parser
  .rule("statement", ["PRIMARY KEY", "(", "identifier", ")", "using"])
  .transform((identifier, using) => ({
    format: "index",
    type: "primaryKey",
    columns: [identifier],
    using,
  }));
parser
  .rule("statement", [
    "UNIQUE INDEX",
    "identifier",
    "(",
    "identifier",
    ")",
    "using",
  ])
  .transform((identifier, column, using) => ({
    format: "index",
    type: "unique",
    identifier,
    columns: [column],
    using,
  }));
parser
  .rule("statement", [
    "CONSTRAINT",
    "identifier",
    "CHECK",
    "(",
    "function",
    ")",
  ])
  .transform((identifier, func) => ({
    format: "index",
    type: "unique",
    identifier,
    func,
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
parser.rule("argument", "identifier");

parser
  .rule("properties", ["property", "properties"])
  .transform((a, b) => ({ ...a, ...b }));
parser.rule("properties", "property");
parser.rule("properties", null);

parser
  .rule("property", /unsigned|zerofill|invisible/iy)
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
  .rule("property", ["CHARACTER SET", "identifier"])
  .transform((characterSet) => ({ characterSet }));
parser
  .rule("property", ["COLLATE", "value"])
  .transform((collate) => ({ collate }));
parser
  .rule("property", /(not\s+)?null/iy)
  .transform((not: string) => (not ? {} : { nullable: true }));

parser
  .rule("comment", ["COMMENT", "=?", /'((?:''|[^'])+)'/i])
  .transform((comment) => comment.replace(SINGLE_QUOTE_REPLACER_REGEXP, "'"));
parser
  .rule("comment", ["COMMENT", "=?", /"((?:""|[^"])+)"/i])
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

parser.rule("using", ["USING", /btree|hash|rtree/iy]);
parser.rule("using", null);

parser.rule("scalar", /\d+|true|false|null|'(?:''|[^'])+'|"(?:""|[^"])+"/i);

parser.rule("value", "scalar");
parser.rule("value", ["name", /(?!\s*\()/]);
parser.rule("value", "function");

export const TableSchema = parser;

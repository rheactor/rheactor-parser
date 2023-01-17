import { TableSchema } from "@Examples/TableSchema";

describe("TableSchema example", () => {
  test("simple expression", () => {
    expect(TableSchema.parse("CREATE TABLE test")).toStrictEqual({
      table: "test",
    });
    expect(TableSchema.parse("CREATE TABLE `test-1.23`")).toStrictEqual({
      table: "test-1.23",
    });
    expect(TableSchema.parse("CREATE TABLE `t``e``s``t`")).toStrictEqual({
      table: "t`e`s`t",
    });
  });
});

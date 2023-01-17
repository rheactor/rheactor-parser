import { TableSchema } from "@Examples/TableSchema";

describe(`TableSchema example`, () => {
  test(`simple expressions`, () => {
    expect(TableSchema.parse("CREATE TABLE test ( `id` INT )")).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT` },
          properties: null,
        },
      ],
      options: null,
    });

    expect(
      TableSchema.parse("CREATE TABLE `test-1.23` ( `id` INT );")
    ).toStrictEqual({
      table: `test-1.23`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT` },
          properties: null,
        },
      ],
      options: null,
    });
  });

  test(`simple expressions, escaped table name`, () => {
    expect(
      TableSchema.parse("CREATE TABLE `t``e``s``t` ( `id` INT )")
    ).toStrictEqual({
      table: "t`e`s`t",
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT` },
          properties: null,
        },
      ],
      options: null,
    });

    expect(() => TableSchema.parse("CREATE TABLE `te`s` ( `id` INT )")).toThrow(
      `unexpected "s" at offset 17`
    );
  });

  test(`simple expressions, two statements`, () => {
    expect(
      TableSchema.parse("CREATE TABLE test ( `id` INT, `name` TEXT )")
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT` },
          properties: null,
        },
        {
          format: `column`,
          name: `name`,
          type: { name: `TEXT` },
          properties: null,
        },
      ],
      options: null,
    });
  });

  test(`simple expressions, data type with arguments`, () => {
    expect(
      TableSchema.parse("CREATE TABLE test ( `id` INT(11) )")
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT`, args: [`11`] },
          properties: null,
        },
      ],
      options: null,
    });

    expect(
      TableSchema.parse("CREATE TABLE test ( `id` ENUM('a', 'b', 'c') )")
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `ENUM`, args: [`'a'`, `'b'`, `'c'`] },
          properties: null,
        },
      ],
      options: null,
    });

    expect(
      TableSchema.parse(
        `CREATE TABLE test ( \`id\` INT(1, '2', "3", true, false, NULL) )`
      )
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: {
            name: `INT`,
            args: [`1`, `'2'`, `"3"`, `true`, `false`, `NULL`],
          },
          properties: null,
        },
      ],
      options: null,
    });
  });

  test(`expressions with all possible properties`, () => {
    expect(
      TableSchema.parse(
        "CREATE TABLE test ( `id` INT UNSIGNED NULL DEFAULT NULL ON UPDATE NOW (6) AUTO_INCREMENT INVISIBLE )"
      )
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT` },
          properties: {
            unsigned: true,
            nullable: true,
            default: `NULL`,
            onUpdate: { name: `NOW`, args: [`6`] },
            autoIncrement: true,
            invisible: true,
          },
        },
      ],
      options: null,
    });

    expect(
      TableSchema.parse(
        `CREATE TABLE test ( \`id\` INT NOT NULL ON UPDATE NOW COMMENT 'ex''am''''p"le' )`
      )
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT` },
          properties: {
            onUpdate: { name: `NOW` },
            comment: `ex'am''p"le`,
          },
        },
      ],
      options: null,
    });

    expect(
      TableSchema.parse(
        `CREATE TABLE test ( \`id\` INT NOT NULL ON UPDATE NOW() COMMENT "ex""am""""p'le" )`
      )
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT` },
          properties: {
            onUpdate: { name: `NOW`, args: [] },
            comment: `ex"am""p'le`,
          },
        },
      ],
      options: null,
    });

    expect(
      TableSchema.parse(
        "CREATE TABLE test ( `id` INT ZEROFILL COLLATE utf8mb3_unicode_ci )"
      )
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: `id`,
          type: { name: `INT` },
          properties: {
            zerofill: true,
            collate: `utf8mb3_unicode_ci`,
          },
        },
      ],
      options: null,
    });
  });

  test(`indexes`, () => {
    expect(
      TableSchema.parse(
        "CREATE TABLE test ( `i``d` INT, PRIMARY KEY ( `i``d` ) )"
      )
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: "i`d",
          type: { name: `INT` },
          properties: null,
        },
        {
          format: `index`,
          type: `primaryKey`,
          columns: ["i`d"],
        },
      ],
      options: null,
    });

    expect(
      TableSchema.parse(
        "CREATE TABLE test ( `i``d` INT, UNIQUE KEY ( `i``d` ) )"
      )
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: "i`d",
          type: { name: `INT` },
          properties: null,
        },
        {
          format: `index`,
          type: `unique`,
          columns: ["i`d"],
        },
      ],
      options: null,
    });
  });

  test(`table options`, () => {
    expect(
      TableSchema.parse(
        "CREATE TABLE test ( `id` INT ) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci ROW_FORMAT=COMPACT"
      )
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: "id",
          type: { name: `INT` },
          properties: null,
        },
      ],
      options: {
        engine: "InnoDB",
        autoIncrement: "88",
        defaultCharset: "utf8mb3",
        collate: "utf8mb3_unicode_ci",
        rowFormat: "COMPACT",
      },
    });

    expect(
      TableSchema.parse("CREATE TABLE test ( `id` INT ) COMMENT='te''st'")
    ).toStrictEqual({
      table: `test`,
      statements: [
        {
          format: `column`,
          name: "id",
          type: { name: `INT` },
          properties: null,
        },
      ],
      options: {
        comment: "te'st",
      },
    });
  });

  test(`general examples`, () => {
    expect(
      TableSchema.parse(
        `
        CREATE TABLE Example (
            ID INT,
            Name INT,
            PRIMARY KEY (ID),
            UNIQUE KEY (Name)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COMMENT='Example table for demonstration purposes'
        `
      )
    ).toStrictEqual({
      table: `Example`,
      statements: [
        {
          format: `column`,
          name: "ID",
          type: { name: `INT` },
          properties: null,
        },
        {
          format: `column`,
          name: "Name",
          type: { name: `INT` },
          properties: null,
        },
        {
          format: `index`,
          type: "primaryKey",
          columns: ["ID"],
        },
        {
          format: `index`,
          type: "unique",
          columns: ["Name"],
        },
      ],
      options: {
        engine: "InnoDB",
        comment: "Example table for demonstration purposes",
        defaultCharset: "utf8mb4",
      },
    });
  });
});

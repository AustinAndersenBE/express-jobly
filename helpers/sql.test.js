const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", () => {
  test("should generate correct SQL part and values", () => {
    const dataToUpdate = { firstName: 'Test', lastName: 'User', age: 25 };
    const jsToSql = {
      firstName: "first_name",
      lastName: "last_name"
    };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: `"first_name"=$1, "last_name"=$2, "age"=$3`,
      values: ['Test', 'User', 25]
    });
  });

  test("should throw BadRequestError if dataToUpdate is empty", () => {
    expect(() => {
      sqlForPartialUpdate({}, {})
    }).toThrow(BadRequestError);
  });
});
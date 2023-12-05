const { BadRequestError } = require("../expressError");

/**
 * Generates SQL for partial update of a row in database.
 * 
 * This function generates a SQL update command based on the keys in the 'dataToUpdate' object.
 * It maps the JavaScript style keys to the SQL style columns using the 'jsToSql' object.
 * If a key is not found in 'jsToSql', it is used as-is.
 * 
 * 
 * @param {Object} dataToUpdate 
 * @param {Object} jsToSql 
 * @returns {Object} An object containing two properties:
 * - setCols: A string for the SET clause in SQL query
 * - values: An array of values corresponding to the keys in 'dataToUpdate'
 * 
 * 
 * @throws {BadRequestError} If 'dataToUpdate' is empty
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
    // values: [Aliya, 32]
  };
}

module.exports = { sqlForPartialUpdate };

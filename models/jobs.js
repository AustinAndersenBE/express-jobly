"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  /** Create a job (from data), update db, return new job data.
   * 
   * data should be { title, salary, equity, companyHandle }
   * 
   * Returns { id, title, salary, equity, companyHandle }
   * 
   * Throws BadRequestError is job with same title and company already exists in database
   * 
   */

  static async create({ title, salary, equity, companyHandle }) {

    const duplicateCheck = await db.query(
      `SELECT id
             FROM jobs
             WHERE title = $1 AND company_handle = $2`,
      [title, companyHandle],
    )

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate job: ${title} at ${companyHandle}`);
    }

    const result = await db.query(
      `INSERT INTO jobs
             (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs that match the filters.
   * 
   * Filters can include: { title, minSalary, hasEquity }
   * 
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * 
   * 
   */

  static async findAll({ title, minSalary, hasEquity } = {}) {
    let query = `SELECT id, title, salary, equity, company_handle AS "companyHandle"
                 FROM jobs`;
    let whereExpressions = [];
    let queryValues = [];

    if (title !== undefined) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity === true) {
      whereExpressions.push(`equity > 0`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY title";

    const jobsRes = await db.query(query, queryValues);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   * 
   * Returns { id, title, salary, equity, companyHandle }
   * 
   * Throws NotFoundError if not found.
   * 
   */

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`,
       [id]);
    
    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   * 
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   * 
   * Data can include: { title, salary, equity }
   * 
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
 
    const jsToSql = {
      title: "title", 
      salary: "salary",
      equity: "equity"

    };

    // Remove keys that should not be updated
    delete data.id;
    delete data.companyHandle;

    const { setCols, values } = sqlForPartialUpdate(
        data,
        jsToSql
    );
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
}
  

  /** Delete given job from database; returns undefined.
   * 
   * Throws NotFoundError if job not found.
   */

  static async remove(id) {
    const result = await db.query(
      `DELETE
       FROM jobs
       WHERE id = $1
       RETURNING id`,
       [id]);      
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
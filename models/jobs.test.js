"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Job 2",
    salary: 200,
    equity: "0.2",
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      ...newJob
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`, [job.id]);
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "New Job 2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c1",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "New Job",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
   
    const newJob = {
      title: "New Job for Get",
      salary: 200,
      equity: "0.2",
      companyHandle: "c1"
    };
    let job = await Job.create(newJob);

    let getJob = await Job.get(job.id);
    expect(getJob).toEqual(job);
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "Updated Job",
    salary: 200,
    equity: "0.2",
  };

  test("works", async function () {

    const newJob = {
      title: "New Job for Update",
      salary: 100,
      equity: "0.1",
      companyHandle: "c1"
    };
    let job = await Job.create(newJob);

    let updatedJob = await Job.update(job.id, updateData);
    expect(updatedJob).toEqual({
      id: job.id,
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`, [job.id]);
    expect(result.rows).toEqual([{
      id: job.id,
      companyHandle: "c1",
      ...updateData,
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {

    const newJob = {
      title: "New Job for Remove",
      salary: 100,
      equity: "0.1",
      companyHandle: "c1"
    };
    let job = await Job.create(newJob);

    await Job.remove(job.id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [job.id]);
    expect(res.rows.length).toEqual(0);
  });
});
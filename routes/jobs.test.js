"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const jobs = require("../models/jobs");
const { BadRequestError } = require("../expressError");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let testJobId;

beforeAll(async function () {

    const result = await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES ('Test Job', 10000, 0.1, 'c1')
      RETURNING id`);
    testJobId = result.rows[0].id;
  });

describe("POST /jobs", function () {
    const newJob = {
      title: "New Job",
      salary: 50000,
      equity: 0.1,
      companyHandle: "c1"
    };
  
    test("ok for admin", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "New Job",
          salary: 50000,
          equity: "0.1",
          companyHandle: "c1"
        },
      });
    });
  
    test("unauth for non-admin", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("bad request with missing field", async function () {
        const incompleteJob = {
          title: "New Job",
          salary: 50000,
          // equity field is missing
          companyHandle: "c1"
        };
      
        const resp = await request(app)
          .post("/jobs")
          .send(incompleteJob)
          .set("authorization", `Bearer ${adminToken}`);
        
        expect(resp.statusCode).toEqual(400);
      });

});



describe("GET /jobs", function () {
    test("ok for anon", async function () {
      const resp = await request(app).get("/jobs");
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({
        jobs: [
          {
            id: expect.any(Number),
            title: "Job1",
            salary: 10000,
            equity: "0.1",
            companyHandle: "c1"
          },
          {
            id: expect.any(Number),
            title: "Job2",
            salary: 20000,
            equity: "0.2",
            companyHandle: "c2"
          },
          {
            id: expect.any(Number),
            title: "Job3",
            salary: 30000,
            equity: "0.3",
            companyHandle: "c3"
          },
          {
            id: expect.any(Number),
            title: "Test Job",
            salary: 10000,
            equity: "0.1",
            companyHandle: "c1"
          }
        ],
      });
    });
  
    test("fails: test invalid query", async function () {
      const resp = await request(app).get("/jobs?titlasd=invalid");
      expect(resp.statusCode).toEqual(400);
    });

});

describe("GET /jobs/:id", function () {

    test("works for anon", async function () {
      const resp = await request(app).get(`/jobs/${testJobId}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({
        job: {
          id: testJobId,
          title: expect.any(String),
          salary: expect.any(Number),
          equity: expect.any(String),
          companyHandle: expect.any(String)
        },
      });
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toEqual(404);
    });
  });

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobId}`)
            .send({
                title: "New Job",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
            id: testJobId,
            title: "New Job",
            salary: expect.any(Number),
            equity: expect.any(String),
            companyHandle: expect.any(String)
            },
        });
    });
});

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobId}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: `${testJobId}` });
    });
});
  
  
  
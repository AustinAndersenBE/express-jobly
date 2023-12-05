"use strict";

const bcrypt = require("bcrypt");
const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");
const Company = require("../models/company");
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM users");
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM companies");

    await db.query("DELETE FROM jobs")

    await Company.create({
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
    });
    await Company.create({
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
    });
    await Company.create({
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
    });

    await db.query(`
        INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('Job1', 10000, 0.1, 'c1'),
               ('Job2', 20000, 0.2, 'c2'),
               ('Job3', 30000, 0.3, 'c3')`);

    const hashedPassword1 = await bcrypt.hash("password1", BCRYPT_WORK_FACTOR);
    const hashedPassword2 = await bcrypt.hash("password2", BCRYPT_WORK_FACTOR);
    const hashedPassword3 = await bcrypt.hash("password3", BCRYPT_WORK_FACTOR);
    const adminPassword = await bcrypt.hash("admin", BCRYPT_WORK_FACTOR);

    await db.query(`
        INSERT INTO users (username, password, first_name, last_name, email, is_admin)
        VALUES ('u1', $1, 'U1F', 'U1L', 'user1@user.com', false),
               ('u2', $2, 'U2F', 'U2L', 'user2@user.com', false),
               ('u3', $3, 'U3F', 'U3L', 'user3@user.com', false),
               ('admin', $4, 'Admin', 'User', 'admin@user.com', true)
        RETURNING username`,
        [hashedPassword1, hashedPassword2, hashedPassword3, adminPassword]);
}

async function commonBeforeEach() {
    await db.query("BEGIN");
}

async function commonAfterEach() {
    await db.query("ROLLBACK");
}

async function commonAfterAll() {
    await db.end();
}

const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });
const u2Token = createToken({ username: "u2", isAdmin: false });

module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
    u2Token,
};

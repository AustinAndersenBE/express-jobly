"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, BadRequestError } = require("../expressError");
const userNewSchema = require("../schemas/userNew.json");
const jsonschema = require("jsonschema");
const User = require("../models/user");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}



/** Middleware to use when the user must be an admin.
 * 
 * If not, raises Unauthorized.
 */

function validateAndEnsureAdmin(schema) {
  return async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, schema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const user = res.locals.user;
      if (!user || !user.isAdmin) {
        throw new UnauthorizedError("Must be an admin");
      }
      return next();
    } catch (err) {
      return next(err);
    }
  }
}

function validateUserRegistration(schema) {
  return async function (req, res, next) {
    try {
      
      const validator = jsonschema.validate(req.body, schema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      // Ensure that the user cannot set themselves as an admin
      if (req.body.isAdmin) {
        throw new BadRequestError("Cannot set isAdmin flag during registration");
      }


      // Proceed with the registration process
      return next();
    } catch (err) {
      return next(err);
    }
  }
}




function ensureAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user || !user.isAdmin) {
      throw new UnauthorizedError("Must be an admin");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}


function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) {
      throw new UnauthorizedError("Must be logged in");
    }
    if (!(user.isAdmin || user.username === req.params.username)) {
      throw new UnauthorizedError("Unauthorized");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

async function ensureUserExists(req, res, next) {
  try {
    const userExists = await User.get(req.params.username);
    if (!userExists) {
      throw new NotFoundError(`No user: ${req.params.username}`);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

function validateJobSearch(req, res, next) {
  try {
    const validFilterKeys = ["title", "minSalary", "hasEquity"];
    for (let key in req.query) {
      if (!validFilterKeys.includes(key)) {
        throw new BadRequestError(`Invalid filter key: ${key}`);
      }
    }

    if (req.query.minSalary !== undefined && isNaN(req.query.minSalary)) {
      throw new BadRequestError("minSalary must be a number.");
    }

    if (req.query.hasEquity !== undefined && req.query.hasEquity !== 'true' && req.query.hasEquity !== 'false') {
      throw new BadRequestError("hasEquity must be a boolean.");
    }

    return next();
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  validateAndEnsureAdmin,
  ensureCorrectUserOrAdmin,
  ensureAdmin,
  validateUserRegistration,
  validateJobSearch,
  ensureUserExists
};


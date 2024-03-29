"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, NotFoundError } = require("../expressError");
const { ensureLoggedIn, checkIfAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobQuerySchema = require("../schemas/jobQuery.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Admin authorization required
 */

router.post("/", ensureLoggedIn, checkIfAdmin, async function (req, res, next) {
    // console.log("job post route");

    const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    {required: true}
  );

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

// router.get("/?:q?", async function (req, res, next) {
router.get("/", async function (req, res, next) {

    let q = req.query;

    if (req.query.minSalary !== undefined){
        q.minSalary = Number(q.minSalary);
    }

    if (req.query.hasEquity !== undefined){
        if (req.query.hasEquity === "true"){
            q.hasEquity = true;
        }
        else{
            q.hasEquity = undefined;
        }
    }

  const validator = jsonschema.validate(
    q,
    jobQuerySchema,
    {required: true}
  );

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  let query = q || "";
  const jobs = await Job.findAll(query);
  return res.json({ jobs });
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {

  const id = Number(req.params.id);
  const job = await Job.findById(id);

  console.log("job", job);
  console.log("res.json",res.json({ job }));

  return res.json({ job });
});

/** PATCH /[id] { field1, field2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Admin authorization required
 */

router.patch("/:id", ensureLoggedIn, checkIfAdmin, async function (req, res, next) {
  //console.log("run jobs patch route");

  const validator = jsonschema.validate(
    req.body,
    jobUpdateSchema
  );

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const updatedJob = await Job.update(req.params.id, req.body);
  return res.json(updatedJob);
});

// /** DELETE /[handle]  =>  { deleted: handle }
//  *
//  * Admin authorization required
//  */

router.delete("/:id", ensureLoggedIn, checkIfAdmin, async function (req, res, next) {

  await Job.remove(req.params.id);
  return res.json({ deleted: Number(req.params.id) });
});


module.exports = router;

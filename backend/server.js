/**
 * Copyright (C) Kedar Iyer - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Kedar Iyer kedarmail@gmail.com: August 1, 2024
 */

const express = require("express");
const app = express();
const nodeChildProcess = require("node:child_process");
const util = require("node:util");
const exec = util.promisify(nodeChildProcess.exec);
const port = process.env.PORT || 3000
const db = require('better-sqlite3')('thebitcoindex.db');

// CORS
app.use("/", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST");
  next();
});

app.get("/feestatus/:chain/:currency/:address", async (req, res, next) => {
    console.log(req.params);
    const row = db.prepare(
      "SELECT paid FROM fees_paid WHERE chain = 'zksync' AND address = ?"
    ).get(req.params.address.toLowerCase())
    console.log(row);
    if (row && row.paid === 1) res.status(200).send("paid");
    else res.status(200).send("unpaid");
});

app.get("/invoice/:chain/:currency/:address/:sats", async (req, res, next) => {
  const { chain, currency, address, sats } = req.params;
  const invoicegen = await exec(
    `lncli addinvoice --amt ${sats} --memo "${chain}:${currency}:${address}"`
  );
  const invoice = JSON.parse(invoicegen.stdout).payment_request;
  res.status(200).send(invoice);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

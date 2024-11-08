// ZigZag Lightning DEX
// Copyright (C) 2024 - Kedar Iyer - kedarmail@gmail.com
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const express = require("express");
const app = express();
const nodeChildProcess = require("node:child_process");
const util = require("node:util");
const exec = util.promisify(nodeChildProcess.exec);
const port = process.env.PORT || 3000
const fs = require('fs')

// GLOBALS
const fees_paid = {}

// CONSTANTS
const ANTI_SPAM_FEE = 1000 // sats

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

app.get("/", (req, res, next) => {
  return res.sendFile(__dirname + '/index.html');
})

app.get("/feestatus/:address", async (req, res, next) => {
    if (fees_paid[req.params.address] === 1) res.status(200).send("paid");
    else res.status(200).send("unpaid");
});

app.get("/invoice/fee/:address", async (req, res, next) => {
  const invoicegen = await exec(
    `lncli addinvoice --amt ${ANTI_SPAM_FEE} --memo "fee:${address}"`
  );
  const invoice = JSON.parse(invoicegen.stdout).payment_request;
  res.status(200).send(invoice);
})

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

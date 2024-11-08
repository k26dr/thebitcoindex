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

// CONSTANTS
const ANTI_SPAM_FEE = 1000 // sats
const DATA_FILENAME = 'lightning_dex_data.json'

// GLOBALS
const { fees_paid, preimages } = readFeesFromDisk()

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
  if (chain !== 'optimism' || currency !== 'wbtc') {
    return res.status(400).send("unsupported chain/currency combo. only optimism:wbtc supported for now");
  } 
  if (fees_paid[address] !== 1) {
    return res.status(400).send("pay fee first");
  } else {
    delete fees_paid[address]
  }
  const invoicegen = await exec(
    `lncli addinvoice --amt ${sats} --memo "${chain}:${currency}:${address}"`
  );
  const invoice = JSON.parse(invoicegen.stdout).payment_request;
 
  // TODO: Insert logic here to lock funds up on Optimism

  res.status(200).send(invoice);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err);
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

// Settle incoming trades and fee payments
setInterval(processInvoices, 5000)
async function processInvoices () {
  const invoice_query = await exec(`lncli listinvoices`);
  const invoices = JSON.parse(invoice_query.stdout).invoices;
  const paid_invoices = invoices.filter(i => i.settled);
  for (let invoice of paid_invoices) {
    const memo = invoice.memo;
    if (!memo || !memo.includes(":")) continue;
    if (memo.includes("fee:")) {
      const address = memo.slice(4)
      fees_paid[address] = invoice.settle_date
    }
    if (memo.includes("optimism:wbtc:")) {
      const address = memo.slice(14)
    }
  }

  // Delete old fee data
  const now = Date.now() / 1000 | 0
  for (let address in fees_paid) {
    if (fees_paid[address] < now - 600) {
      delete fees_paid[address]
    }
  }
}

function flushGlobalsToDisk () {
  fs.writeFileSync(DATA_FILENAME, JSON.stringify(fees_paid, null, 2))
}

// Read persistent data from disk
function readFeesFromDisk () {
  if (!fs.existsSync(DATA_FILENAME)) {
    return {}
  }
  const data = fs.readFileSync(DATA_FILENAME, 'utf8')
  return JSON.parse(data)
}

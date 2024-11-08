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
const globals = readGlobalsFromDisk()

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
    if (globals.fees_paid[req.params.address] === 1) res.status(200).send("paid");
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
  if (globals.fees_paid[address] !== 1) {
    return res.status(400).send("pay fee first");
  } else {
    delete globals.fees_paid[address]
  }
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

// Settle incoming trades and fee payments
setInterval(readInvoices, 5000)
async function readInvoices () {
  const invoice_query = await exec(`lncli listinvoices --index_offset ${globals.last_processed_add_index}`);
  const invoices = JSON.parse(invoice_query.stdout).invoices;
  const paid_invoices = invoices.filter(i => i.settled);
  for (let invoice of paid_invoices) {
    if (invoice.add_index <= globals.last_processed_add_index) continue
    globals.last_processed_add_index = invoice.add_index
    const memo = invoice.memo;
    if (!memo || !memo.includes(":")) continue;
    if (memo.includes("fee:")) {
      const address = memo.slice(4)
      globals.fees_paid[address] = 1
    }
    else if (memo.includes("optimism:wbtc:")) {
      const address = memo.slice(14)
    }
  }
}

// Flush persistent data to disk on exit
process.on('exit', flushGlobalsToDisk)
function flushGlobalsToDisk () {
  const globals = { last_processed_add_index, fees_paid }
  fs.writeFileSync(DATA_FILENAME, JSON.stringify(globals, null, 2))
}

// Read persistent data from disk
function readGlobalsFromDisk () {
  if (!fs.existsSync(DATA_FILENAME)) {
    return { last_processed_add_index: 0, fees_paid: {} }
  }
  const data = fs.readFileSync(DATA_FILENAME, 'utf8')
  return JSON.parse(data)
}

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

const nodeChildProcess = require("node:child_process");
const util = require("node:util");
const exec = util.promisify(nodeChildProcess.exec);
const db = require('better-sqlite3')('thebitcoindex.db');

readInvoices();

async function readInvoices () {
  const invoice_query = await exec(
    `lncli listinvoices`
  );
  const invoices = JSON.parse(invoice_query.stdout).invoices;
  const paid_invoices = invoices.filter(i => i.settled);
  for (let invoice of paid_invoices) {
    const memo = invoice.memo;
    if (!memo || !memo.includes(":")) continue;

    const address = invoice.memo.split(":")[2].toLowerCase();
    const timestamp = new Date().toISOString();
    if (invoice.value === '1000') {
      db.prepare(
        "INSERT INTO fees_paid (chain, address, paid, txid, timestamp) VALUES ('zksync', ?, true, ?, ?)"
      ).run(address, invoice.r_hash, timestamp);
    }
  }
  console.log(paid_invoices);
}

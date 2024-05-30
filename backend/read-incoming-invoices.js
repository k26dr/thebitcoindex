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

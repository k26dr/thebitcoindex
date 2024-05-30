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
    if (invoice.value === '1000') {
    }
  }
  console.log(paid_invoices);
}

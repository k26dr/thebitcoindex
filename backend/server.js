const express = require("express");
const app = express();
const nodeChildProcess = require("node:child_process");
const util = require("node:util");
const exec = util.promisify(nodeChildProcess.exec);
const port = process.env.PORT || 3000

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

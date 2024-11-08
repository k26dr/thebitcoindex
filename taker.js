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

// Script to run a swap with a market maker

const { program } = require('commander')

const axios = require('axios')
const marketmaker_url = "http://localhost:3000"
const MY_ETH_ADDRESS = "0x0"

program
  .name("thunderbolt-cli")
  .description("CLI to conduct trustless swaps between Lightning and Ethereum")
  .version("0.0.1")

program.command("listmarketmakers")
  .description("Get a list of available market makers. You can specify your own if you want for most commands")
  .action(listmarketmakers)

program.command("getfeeinvoice")
  .description("Get a fee invoice. Fees have to be paid before you can initiate a swap.")
  .action(getfeeinvoice)

program.parse()

function listmarketmakers() {}

function getfeeinvoice() {
  axios.get(marketmaker_url + "/invoice/fee/" + MY_ETH_ADDRESS)
    .then(r => r.data)
    .then(console.log)
}

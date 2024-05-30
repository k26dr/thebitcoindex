//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AtomicSwap {
  // Hash Tracking for swaps
  // The key for the mappings is the hash
  struct HTLC {
    address receiver;
    address token;
    uint amount;
    uint32 expiry;
  }
  mapping(bytes32 => HTLC) public HASHES;

  event HashCreated(bytes32 indexed hash, address indexed token, address initiator, address receiver, uint256 amount, uint32 expiry);
  event HashRevoked(bytes32 indexed hash);
  event HashProcessed(bytes32 indexed hash);

  function depositToHash(address token, address receiver, uint amount, bytes32 hash, uint32 expiry) public {
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    require(HASHES[hash].amount == 0, "hash is already funded");
    HASHES[hash] = HTLC(receiver, token, amount, expiry);
    emit HashCreated(hash, token, msg.sender, receiver, amount, expiry);
  }

  function unlockHash(bytes32 hash, bytes memory preimage) public {
    require(sha256(preimage) == hash, "preimage does not match hash");
    require(HASHES[hash].amount > 0, "hash is not funded");
    require(block.timestamp < HASHES[hash].expiry, "hash expired");
    IERC20(HASHES[hash].token).transfer(HASHES[hash].receiver, HASHES[hash].amount);
    emit HashProcessed(hash);
    delete HASHES[hash];
  }

  function reclaimHash(bytes32 hash) public {
    require(HASHES[hash].expiry < block.timestamp, "HTLC is active");
    require(HASHES[hash].amount > 0, "hash is not funded");
    IERC20(HASHES[hash].token).transfer(HASHES[hash].receiver, HASHES[hash].amount);
    delete HASHES[hash];
    emit HashRevoked(hash);
  }

}

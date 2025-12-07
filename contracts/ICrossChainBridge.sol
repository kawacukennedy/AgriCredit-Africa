// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICrossChainBridge {
    function sendMessage(uint256 targetChainId, address targetContract, bytes calldata message) external;
    function receiveMessage(bytes calldata message) external;
}
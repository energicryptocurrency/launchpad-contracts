// Copyright 2025 Energi Core

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// Energi Governance system is the fundamental part of Energi Core.

// NOTE: It's not allowed to change the compiler due to byte-to-byte
//       match requirement.

/// @title  OperatorFilter
/// @author Energi Core

pragma solidity 0.8.22;

import { IOperatorRegistry } from "../operator-registry/IOperatorRegistry.sol";

contract OperatorFilter {
    IOperatorRegistry public operatorRegistry; // Address of OperatorRegistry contract

    constructor(address _operatorRegistry) {
        operatorRegistry = IOperatorRegistry(_operatorRegistry);
    }

    /**
     * @notice Internal function to validate a transfer, according to whether the calling address,
     * from address and to address is an EOA or Whitelisted
     * @param from the address of the from target to be validated
     * @param to the address of the to target to be validated
     */
    modifier validateTransfer(address from, address to) {
        // Check for:
        // 1. caller is an EOA
        //      OR
        // 2. caller is Whitelisted
        require(
            msg.sender == tx.origin || operatorRegistry.isWhitelist(msg.sender),
            "OperatorFilter: Sender is not whitelist"
        );

        // Check for:
        // 1. to is an EOA
        //      OR
        // 2. to is Whitelisted
        require(to.code.length == 0 || operatorRegistry.isWhitelist(to), "OperatorFilter: Receiver not whitelist");
        _;
    }
}

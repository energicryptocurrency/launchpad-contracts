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

/// @title  OperatorRegistry
/// @author Energi Core

pragma solidity 0.8.22;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract OperatorRegistry is OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    /**
     * @notice Emits when new whitelist is added
     */
    event WhitelistAdded(address indexed operator);

    /**
     * @notice Emits when a whitelist is removed
     */
    event WhitelistRemoved(address indexed operator);

    /**
     * @notice Emits when a fundReceiver is changed
     */
    event FundReceiverChanged(address indexed oldReceiver, address indexed newReceiver);

    /**
     * @notice Emits when sharePercentageBps is changed
     */
    event SharePercentageBpsChanged(uint256 oldSharePercentage, uint256 newSharePercentage);

    mapping(address => bool) public isWhitelist; // Mapping of addresses which are whitelisted for trade

    address public fundReceiver; // Address of multisig address where 90% of funds will go

    uint256 public sharePercentageBps; // Share of how much % of revenue go to fund receiver

    /**
     * @notice Initialize all dependency contracts
     * @dev Only called once
     */
    function initialize(address fundReceiver_, uint256 sharePercentageBps_) external initializer {
        fundReceiver = fundReceiver_;
        sharePercentageBps = sharePercentageBps_;

        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    /**
     * @notice Add operator in whitelist
     * @dev Only owner can call this function
     * @param _operator ~ address of marketplace contract address
     */
    function addWhitelist(address _operator) external onlyOwner whenNotPaused {
        require(!isWhitelist[_operator], "OperatorRegistry: Already whitelisted");
        isWhitelist[_operator] = true;

        emit WhitelistAdded(_operator);
    }

    /**
     * @notice Remove operator from whitelist
     * @dev Only owner can call this function
     * @param _operator ~ address of marketplace contract address
     */
    function removeWhitelist(address _operator) external onlyOwner whenNotPaused {
        require(isWhitelist[_operator], "OperatorRegistry: Not whitelisted");
        isWhitelist[_operator] = false;

        emit WhitelistRemoved(_operator);
    }

    /**
     * @notice Update fund receiver address
     * @dev Only owner can call this function
     * @param _newFundReceiver ~ address of fund receiver
     */
    function changeFundReceiver(address _newFundReceiver) external onlyOwner whenNotPaused {
        require(_newFundReceiver != fundReceiver, "OperatorRegistry: Already exists");

        address oldFundReceiver = fundReceiver;
        fundReceiver = _newFundReceiver;

        emit FundReceiverChanged(oldFundReceiver, _newFundReceiver);
    }

    /**
     * @notice Update share percentage bps
     * @dev Only owner can call this function
     * @param _sharePercentageBps ~ new share percentage
     */
    function changeSharePercentageBps(uint256 _sharePercentageBps) external onlyOwner whenNotPaused {
        uint256 oldSharePercentageBps = sharePercentageBps;
        sharePercentageBps = _sharePercentageBps;
        emit SharePercentageBpsChanged(oldSharePercentageBps, _sharePercentageBps);
    }

    /**
     * @notice Pause the contract
     * @dev Only owner can call this function
     */
    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Only owner can call this function
     */
    function unpause() external onlyOwner whenPaused {
        _unpause();
    }
}

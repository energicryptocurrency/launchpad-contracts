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

/// @title  IOperatorRegistry
/// @author Energi Core

pragma solidity 0.8.22;

interface IOperatorRegistry {
    function isWhitelist(address _operator) external view returns (bool);

    function fundReceiver() external view returns (address);

    function sharePercentageBps() external view returns (uint256);

    function addWhitelist(address _operator) external;

    function removeWhitelist(address _operator) external;

    function changeFundReceiver(address _fundReceiver) external;

    function changeSharePercentageBps(uint256 _sharePercentageBps) external;

    function pause() external;

    function unpause() external;
}

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

/// @title  GMIERC721RC
/// @author Energi Core

pragma solidity 0.8.22;

import { ERC721Enumerable, ERC721 } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { FixedPoint } from "../lib/FixedPoint.sol";
import { OperatorFilter } from "../lib/OperatorFilter.sol";

contract GMIERC721RC is ERC721Enumerable, Ownable, Pausable, ReentrancyGuard, FixedPoint, OperatorFilter {
    uint256 public maxMintSupply; // Max mintable supply
    uint256 public mintPrice; // Mint price
    uint256 public maxUserMintAmount; // Max mintable amount per user
    uint256 public maxTxMintAmount; // Max mintable amount per tx
    uint256 public mintedAmount; // Tracks minted amount
    uint256 public refundCounter; // Tracks number of refunded NFT
    uint256 public totalMints; // Number of freshly minted NFTs
    uint256 public reservedNFTs; // NFTs to be minted by owner
    uint256 public reservedMints; // Reserved NFTs minted

    uint256[] public refundedTokenIds; // Refunded tokenIds

    bool public presaleActive; // Presale is active or not
    bool public publicsaleActive; // Publicsale is active or not
    uint256 public presaleMintPrice; // Mint price for presale
    uint256 public presaleMaxUserMintAmount; // Max mintable amount per user in presale
    uint256 public presaleMaxTxMintAmount; // Max mintable amount per tx in presale

    mapping(address => uint256) public numberMinted; // total user amount minted
    mapping(address => uint256) public presaleNumberMinted; // total user amount minted in presale
    mapping(uint256 => bool) public isOwnerMint; // if the NFT was freely minted by owner
    mapping(address => uint256) public whitelists; // Whitelist users
    mapping(uint256 => uint256) public refundPrice; // price of nft when it was minted

    string private baseURI;

    string public VERSION = "1.0.0";

    /**
     * @dev triggered afet NFT is refunded
     */
    event Refund(address indexed user, uint256 tokenId, uint256 tokenAmount);

    /**
     * @dev triggered afer maxUserMintAmount is changed
     */
    event MaxUserMintAmountChanged(uint256 newMaxUserMintAmount);

    /**
     * @dev triggered after maxTxMintAmount is changed
     */
    event MaxTxMintAmountChanged(uint256 newMaxTxMintAmount);

    /**
     * @dev triggered afer mintPrice is changed
     */
    event MintPriceChanged(uint256 newMintPrice);

    /**
     * @dev triggered after presaleMaxUserMintAmount is changed
     */
    event PresaleMaxUserMintAmountChanged(uint256 newPresaleMaxUserMintAmount);

    /**
     * @dev triggered after presaleMaxTxMintAmount is changed
     */
    event PresaleMaxTxMintAmountChanged(uint256 newPresaleMaxTxMintAmount);

    /**
     * @dev triggered after presaleMintPrice is changed
     */
    event PresaleMintPriceChanged(uint256 newPresaleMintPrice);

    /**
     * @dev triggered after whitelist address is added
     */
    event WhitelistAdded(address indexed users);

    /**
     * @dev triggered after whitelist address is removed
     */
    event WhitelistRemoved(address indexed users);

    /**
     * @dev triggered after presale status is changed
     */
    event PresaleToggled(bool presaleStatus);

    /**
     * @dev triggered after publicsale status is changed
     */
    event PublicsaleToggled(bool publicsaleStatus);

    /**
     * @dev triggered after the owner sets the base uri
     */
    event SetBaseUri(string uri);

    /**
     * @dev triggered after NFT is minted
     */
    event Minted(address indexed user, uint256 quantity);

    /**
     * @dev triggered after NFT is minted in presale
     */
    event PresaleMinted(address indexed user, uint256 quantity);

    /**
     * @dev triggered after NFT is minted by owner
     */
    event OwnerMinted(address indexed user, uint256 quantity);

    /**
     * @dev Contracts cannot mint NFT
     */
    modifier noContracts() {
        require(!Address.isContract(msg.sender), "Contracts are not allowed");
        _;
    }

    /**
     * @dev Constructor that is used to set state variables
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        uint256 maxMintSupply_,
        uint256 mintPrice_,
        uint256 maxUserMintAmount_,
        uint256 maxTxMintAmount_,
        uint256 presaleMintPrice_,
        uint256 presaleMaxUserMintAmount_,
        uint256 presaleMaxTxMintAmount_,
        address owner_,
        address operatorRegistry_
    ) ERC721(name_, symbol_) OperatorFilter(operatorRegistry_) {
        // require(mintPrice_ > 1 ether, "Mint price should be more than 1 NRG"); // Not required in other chains as it could be very expensive
        maxMintSupply = maxMintSupply_;
        mintPrice = mintPrice_;
        baseURI = baseURI_;
        maxUserMintAmount = maxUserMintAmount_;
        maxTxMintAmount = maxTxMintAmount_;
        presaleMintPrice = presaleMintPrice_;
        presaleMaxUserMintAmount = presaleMaxUserMintAmount_;
        presaleMaxTxMintAmount = presaleMaxTxMintAmount_;
        _transferOwnership(owner_);
        reservedNFTs = FixedPoint.getPercentageOf(maxMintSupply_, 20); // 20% of maxMintSupply
    }

    /**
     * @dev Allows anyone to mint
     *
     * Requirements:
     *
     * - Caller cannot be contract
     * - Public sale must be active
     * - Value sent must be correct
     * - Total user amount minted cannot be above max user mint amount
     * - Total number minted cannot be above max mint supply
     */
    function mint(uint256 _quantity) external payable whenNotPaused noContracts nonReentrant {
        require(publicsaleActive, "Publicsale is not active");

        _mintTokens(msg.sender, _quantity, mintPrice, maxTxMintAmount, maxUserMintAmount, numberMinted[msg.sender]);
        numberMinted[msg.sender] += _quantity;

        emit Minted(msg.sender, _quantity);
    }

    /**
     * @dev Allows whitelist address to  to mint
     *
     * Requirements:
     *
     * - Caller cannot be contract
     * - Presale must be active
     * - Value sent must be correct
     * - Sender must be whitelisted
     * - Total user amount minted cannot be above presale max user mint amount
     * - Total number minted cannot be above max mint supply
     */
    function presaleMint(uint256 _quantity) external payable whenNotPaused noContracts nonReentrant {
        require(presaleActive, "Presale is not active");
        require(whitelists[msg.sender] > 0, "Not whitelisted");

        if (presaleMintPrice == 0) {
            require(reservedMints + _quantity <= reservedNFTs, "Minted all reserved NFTs");
            reservedMints += _quantity;
        }

        _mintTokens(
            msg.sender,
            _quantity,
            presaleMintPrice,
            presaleMaxTxMintAmount,
            whitelists[msg.sender],
            presaleNumberMinted[msg.sender]
        );
        presaleNumberMinted[msg.sender] += _quantity;

        emit PresaleMinted(msg.sender, _quantity);
    }

    /**
     * @dev Refunds all tokenIds, burn tokens and send corresponding NRG to user
     *
     * Requirements:
     *
     * - The caller must own all token ids
     */
    function refund(uint256[] calldata _tokenIds) external nonReentrant {
        uint256 refundAmount = 0;
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(msg.sender == ownerOf(tokenId), "Not owner");
            require(isOwnerMint[_tokenIds[i]] == false, "Owner mint");
            require(refundPrice[tokenId] > 0, "Free NFTs can't be refunded");
            _burn(tokenId);
            uint256 tokenAmount = refundPrice[tokenId];

            refundAmount += tokenAmount;
            refundedTokenIds.push(tokenId);
            emit Refund(msg.sender, tokenId, tokenAmount);
        }

        mintedAmount -= _tokenIds.length;
        refundCounter += _tokenIds.length;
        if (refundAmount > 0) {
            _transferNRG(msg.sender, refundAmount);
        }
    }

    /**
     * @dev Allows owner to mint
     *
     * Requirements:
     *
     * - The caller must be the owner
     * - Total number minted cannot be above max mint supply
     */
    function ownerMint(address _to, uint256 _quantity) external onlyOwner nonReentrant {
        require(mintedAmount + _quantity <= maxMintSupply, "Max supply");
        require(reservedMints + _quantity <= reservedNFTs, "Minted all reserved NFTs");
        mintedAmount += _quantity;

        for (uint256 i = 0; i < _quantity; i++) {
            if (totalMints == maxMintSupply && refundedTokenIds.length > 0) {
                for (uint j = 0; j < refundedTokenIds.length; j++) {
                    _safeMint(_to, refundedTokenIds[j]);
                    isOwnerMint[refundedTokenIds[j]] = true;
                    _removeTokenId(j);
                }
            } else {
                uint256 nextTokenId = totalMints + 1;
                _safeMint(_to, nextTokenId);
                isOwnerMint[nextTokenId] = true;
                totalMints += 1;
            }
        }

        reservedMints += _quantity;

        emit OwnerMinted(_to, _quantity);
    }

    /**
     * @dev Returns true if the given token id can be refunded. Only occurs if the token id has not been
     * refunded, hasn't been minted by the owner
     */
    function canBeRefunded(uint256 _tokenId) public view returns (bool) {
        require(_exists(_tokenId), "Token not exists");
        return !isOwnerMint[_tokenId];
    }

    /**
     * @dev Returns base uri
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Sets base uri
     */
    function setBaseURI(string memory _uri) external onlyOwner {
        baseURI = _uri;
        emit SetBaseUri(_uri);
    }

    /**
     *
     * @dev whitelist addresses for presale
     */
    function addWhitelist(address[] memory _users, uint256[] memory _limit) external onlyOwner {
        require(_users.length == _limit.length, "Arrays length mismatched");
        for (uint256 i = 0; i < _users.length; i++) {
            require(_users[i] != address(0), "Invalid address");

            whitelists[_users[i]] = _limit[i];
            emit WhitelistAdded(_users[i]);
        }
    }

    /**
     *
     * @dev remove whitelist addresses from presale
     */
    function removeWhitelist(address[] memory _users) external onlyOwner {
        for (uint256 i = 0; i < _users.length; i++) {
            require(_users[i] != address(0), "Invalid address");
            if (whitelists[_users[i]] > 0) {
                whitelists[_users[i]] = 0;
                emit WhitelistRemoved(_users[i]);
            }
        }
    }

    /**
     * @dev Toggle presale status
     */
    function togglePresale() external onlyOwner {
        presaleActive = !presaleActive;
        emit PresaleToggled(!presaleActive);
    }

    /**
     * @dev Toggle publicsale status
     */
    function togglePublicsale() external onlyOwner {
        publicsaleActive = !publicsaleActive;
        emit PublicsaleToggled(!publicsaleActive);
    }

    /**
     * @dev configure public sale variables
     */
    function publicsaleConfig(
        uint256 _maxUserMintAmount,
        uint256 _maxTxMintAmount,
        bool _publicsaleStatus
    ) external onlyOwner {
        _setMaxUserMintAmount(_maxUserMintAmount);
        _setTxMintAmount(_maxTxMintAmount);
        publicsaleActive = _publicsaleStatus;
    }

    /**
     * @dev configure pre sale variables
     */
    function presaleConfig(
        uint256 _maxUserMintAmount,
        uint256 _maxTxMintAmount,
        bool _presaleStatus
    ) external onlyOwner {
        _setPresaleMaxUserMintAmount(_maxUserMintAmount);
        _setPresaleTxMintAmount(_maxTxMintAmount);
        presaleActive = _presaleStatus;
    }

    /**
     * @dev Pause and unpause the contract
     */
    function togglePause() external onlyOwner {
        if (paused()) {
            _unpause();
        } else {
            _pause();
        }
    }

    /**
     * @dev Sets maximum nft minted by user
     */
    function _setMaxUserMintAmount(uint256 _maxUserMintAmount) internal {
        maxUserMintAmount = _maxUserMintAmount;
        emit MaxUserMintAmountChanged(_maxUserMintAmount);
    }

    /**
     * @dev Sets maximum nft minted in one tx
     */
    function _setTxMintAmount(uint256 _maxTxMintAmount) internal {
        maxTxMintAmount = _maxTxMintAmount;
        emit MaxTxMintAmountChanged(_maxTxMintAmount);
    }

    /**
     * @dev Sets maximum nft minted by user in presale
     */
    function _setPresaleMaxUserMintAmount(uint256 _presaleMaxUserMintAmount) internal {
        presaleMaxUserMintAmount = _presaleMaxUserMintAmount;
        emit PresaleMaxUserMintAmountChanged(_presaleMaxUserMintAmount);
    }

    /**
     * @dev Sets maximum nft minted in one tx in presale
     */
    function _setPresaleTxMintAmount(uint256 _presaleMaxTxMintAmount) internal {
        presaleMaxTxMintAmount = _presaleMaxTxMintAmount;
        emit PresaleMaxTxMintAmountChanged(_presaleMaxTxMintAmount);
    }

    /**
     * @dev Transfers NRG from contract to address
     */
    function _transferNRG(address _to, uint256 _value) internal {
        payable(_to).transfer(_value);
    }

    /**
     * @dev Removed element from refundedTokenIds array
     * @param _index Index of element
     */
    function _removeTokenId(uint256 _index) internal {
        if (_index >= refundedTokenIds.length) return;

        for (uint i = _index; i < refundedTokenIds.length - 1; i++) {
            refundedTokenIds[i] = refundedTokenIds[i + 1];
        }
        refundedTokenIds.pop();
    }

    /**
     * @dev Internal function to mint NFTs
     */
    function _mintTokens(
        address _to,
        uint256 _quantity,
        uint256 _price,
        uint256 _maxTxMintAmount,
        uint256 _maxUserMintAmount,
        uint256 _userMints
    ) internal {
        require(msg.value == _quantity * _price, "Bad value");
        require(_quantity <= _maxTxMintAmount, "Max tx amount");
        require(_userMints + _quantity <= _maxUserMintAmount, "Max amount");
        require(mintedAmount + _quantity <= maxMintSupply, "Max supply");
        mintedAmount += _quantity;

        for (uint256 i = 0; i < _quantity; i++) {
            if (totalMints == maxMintSupply && refundedTokenIds.length > 0) {
                for (uint j = 0; j < refundedTokenIds.length; j++) {
                    _safeMint(_to, refundedTokenIds[j]);
                    refundPrice[refundedTokenIds[j]] = _price;
                    _removeTokenId(j);
                }
            } else {
                uint256 nextTokenId = totalMints + 1;
                _safeMint(_to, nextTokenId);
                refundPrice[nextTokenId] = _price;
                _transferNRG(operatorRegistry.fundReceiver(), (_price * operatorRegistry.sharePercentageBps()) / 10000);
                totalMints += 1;
            }
        }
    }

    /**
     * @inheritdoc ERC721
     * @dev Note it will validate the from and to address in the allowlist
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721) validateTransfer(from, to) {
        super._transfer(from, to, tokenId);
    }

    /**
     * @notice receives ETH
     */
    receive() external payable {}
}

const { ethers } = require("hardhat");
const { verify } = require("../../utils/verify");

/**
 * NOTE: Change below variables for your NFT Collection
 */
const name = "Test NFT"; // Name of collection
const symbol = "TNFT"; // Symbol of collection
const baseURI = "baseuri.io/"; // Base metadata uri
const maxMintSupply = 100; // Total NFTs for sale
const mintPrice = "1000000000000000000"; // Mint price per NFT
const maxUserMintAmount = 3; // Max NFT to be minted by user
const maxTxMintAmount = 3; // Max NFT to be minted by user in one tx
const presaleMintPrice = "1000000000000000000"; // Mint price per NFT in presale
const presaleMaxUserMintAmount = 3; // Max NFT to be minted by user in presale
const presaleMaxTxMintAmount = 3; // Max NFT to be minted by user in one tx in presale
const owner = "0x80876c44F31fce49384DdDb28B22a185AFF3f2a3"; // Owner of collection
const operatorRegistryProxy = "0x0eEeDaa574Be044468096eEcfbBbBE128eBd25f7"; // Operator registry contract address

async function main() {
  const gmiERC721R = await ethers.deployContract("GMIERC721RC", [
    name,
    symbol,
    baseURI,
    maxMintSupply,
    mintPrice,
    maxUserMintAmount,
    maxTxMintAmount,
    presaleMintPrice,
    presaleMaxUserMintAmount,
    presaleMaxTxMintAmount,
    owner,
    operatorRegistryProxy,
  ]);
  await gmiERC721R.waitForDeployment();

  console.log(
    `
    NFT is deployed at ${await gmiERC721R.getAddress()}
    `,
  );

  if (network.name !== "hardhat") {
    await verify(
      await gmiERC721R.getAddress(),
      [
        name,
        symbol,
        baseURI,
        maxMintSupply,
        mintPrice,
        maxUserMintAmount,
        maxTxMintAmount,
        presaleMintPrice,
        presaleMaxUserMintAmount,
        presaleMaxTxMintAmount,
        owner,
        operatorRegistryProxy,
      ],
      "contracts/erc721c/GMIERC721RC.sol:GMIERC721RC",
    );
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

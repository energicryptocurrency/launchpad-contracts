const { expect } = require("chai");
const { ethers } = require("hardhat");
const { it, describe } = require("mocha");

describe("GMIERC721RC test", async () => {
  let gmiERC721R;
  let gmiERC721RFreePresale;
  let owner;
  let minter1;
  let minter2;
  let other;
  let stranger;
  let fundReceiver;
  let operatorRegistry;
  let operatorRegistryProxy;
  let operatorRegistryProxyAdmin;
  let operatorRegistryProxyContract;

  const name = "Test NFT";
  const symbol = "TNFT";
  const baseURI = "baseuri.io/";
  const maxMintSupply = 100;
  const mintPrice = "10000000000000000000";
  const maxUserMintAmount = 5;
  const maxTxMintAmount = 3;
  const presaleMintPrice = "1000000000000000000";
  const presaleMaxUserMintAmount = 5;
  const presaleMaxTxMintAmount = 3;
  const sharePercentageBps = 9000; // 90%

  beforeEach(async () => {
    [owner, minter1, minter2, stranger, fundReceiver, other, ...addrs] = await ethers.getSigners();

    operatorRegistryProxyAdmin = await ethers.deployContract("OperatorRegistryProxyAdmin", []);

    await operatorRegistryProxyAdmin.waitForDeployment();

    operatorRegistry = await ethers.deployContract("OperatorRegistry", []);

    await operatorRegistry.waitForDeployment();

    operatorRegistryProxy = await ethers.deployContract("OperatorRegistryProxy", [
      await operatorRegistry.getAddress(),
      await operatorRegistryProxyAdmin.getAddress(),
      "0x",
    ]);

    await operatorRegistryProxy.waitForDeployment();

    operatorRegistryProxyContract = await ethers.getContractAt(
      "OperatorRegistry",
      await operatorRegistryProxy.getAddress(),
    );

    await operatorRegistryProxyContract.initialize(
      await fundReceiver.getAddress(),
      sharePercentageBps,
    );

    gmiERC721R = await ethers.deployContract("GMIERC721RC", [
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
      owner.address,
      await operatorRegistryProxy.getAddress(),
    ]);

    gmiERC721R.waitForDeployment();

    gmiERC721RFreePresale = await ethers.deployContract("GMIERC721RC", [
      name,
      symbol,
      baseURI,
      maxMintSupply,
      mintPrice,
      maxUserMintAmount,
      maxTxMintAmount,
      0,
      presaleMaxUserMintAmount,
      presaleMaxTxMintAmount,
      owner.address,
      await operatorRegistryProxy.getAddress(),
    ]);

    gmiERC721RFreePresale.waitForDeployment();
  });

  describe("deployment and constructor", () => {
    it("should return owner", async () => {
      const result = await gmiERC721R.owner();
      expect(result).to.be.equal(owner.address);
    });

    it("should return paused", async () => {
      const result = await gmiERC721R.paused();
      expect(result).to.be.equal(false);
    });

    it("should return presaleActive", async () => {
      const result = await gmiERC721R.presaleActive();
      expect(result).to.be.equal(false);
    });

    it("should return name", async () => {
      const result = await gmiERC721R.name();
      expect(result).to.be.equal(name);
    });

    it("should return symbol", async () => {
      const result = await gmiERC721R.symbol();
      expect(result).to.be.equal(symbol);
    });

    it("should return mintPrice", async () => {
      const result = await gmiERC721R.mintPrice();
      expect(result).to.be.equal(mintPrice);
    });

    it("should return maxUserMintAmount", async () => {
      const result = await gmiERC721R.maxUserMintAmount();
      expect(result).to.be.equal(maxUserMintAmount);
    });

    it("should return maxTxMintAmount", async () => {
      const result = await gmiERC721R.maxTxMintAmount();
      expect(result).to.be.equal(maxTxMintAmount);
    });

    it("should return presaleMintPrice", async () => {
      const result = await gmiERC721R.presaleMintPrice();
      expect(result).to.be.equal(presaleMintPrice);
    });

    it("should return presaleMaxUserMintAmount", async () => {
      const result = await gmiERC721R.presaleMaxUserMintAmount();
      expect(result).to.be.equal(presaleMaxUserMintAmount);
    });

    it("should return presaleMaxTxMintAmount", async () => {
      const result = await gmiERC721R.presaleMaxTxMintAmount();
      expect(result).to.be.equal(presaleMaxTxMintAmount);
    });
  });

  describe("mint()", () => {
    it("should mint", async () => {
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.connect(minter1).mint(1, { value: mintPrice });

      const balance = await gmiERC721R.balanceOf(minter1.address);
      expect(balance).to.be.equal(1);
      const numberMinted = await gmiERC721R.numberMinted(minter1.address);
      expect(numberMinted).to.be.equal(1);
      const mintedAmount = await gmiERC721R.mintedAmount();
      expect(mintedAmount).to.be.equal(1);
    });

    it("should mint more than 1 NFT", async () => {
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.connect(minter1).mint(2, { value: "20000000000000000000" });

      const balance = await gmiERC721R.balanceOf(minter1.address);
      expect(balance).to.be.equal(2);
      const numberMinted = await gmiERC721R.numberMinted(minter1.address);
      expect(numberMinted).to.be.equal(2);
      const mintedAmount = await gmiERC721R.mintedAmount();
      expect(mintedAmount).to.be.equal(2);
    });

    it("should not mint when paused", async () => {
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.togglePause();

      await expect(
        gmiERC721R.connect(minter1).mint(2, { value: "20000000000000000000" }),
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should  mint when presale is active", async () => {
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.togglePresale();
      await gmiERC721R.connect(minter1).mint(2, { value: "20000000000000000000" });
    });

    it("should not mint when price is not corect", async () => {
      await gmiERC721R.togglePublicsale();
      await expect(
        gmiERC721R.connect(minter1).mint(2, { value: "10000000000000000000" }),
      ).to.be.revertedWith("Bad value");
    });

    it("should not mint when tx mint amount is not valid", async () => {
      await gmiERC721R.togglePublicsale();
      await expect(
        gmiERC721R.connect(minter1).mint(maxTxMintAmount + 1, { value: "40000000000000000000" }),
      ).to.be.revertedWith("Max tx amount");
    });

    it("should not mint when max user mint amount is not valid", async () => {
      await gmiERC721R.publicsaleConfig(maxUserMintAmount, 10, true);
      await expect(
        gmiERC721R.connect(minter1).mint(maxUserMintAmount + 1, { value: "60000000000000000000" }),
      ).to.be.revertedWith("Max amount");
    });

    it("should not mint when max supply is sold", async () => {
      await gmiERC721R.publicsaleConfig(200, 100, true);
      await gmiERC721R.connect(minter1).mint(1, { value: "10000000000000000000" });
      await expect(
        gmiERC721R.connect(minter1).mint(100, { value: "1000000000000000000000" }),
      ).to.be.revertedWith("Max supply");
    });
  });

  describe("presaleMint()", () => {
    it("should mint more than 1 NFT", async () => {
      await gmiERC721R.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R.togglePresale();
      await gmiERC721R.connect(minter1).presaleMint(2, { value: "2000000000000000000" });

      const balance = await gmiERC721R.balanceOf(minter1.address);
      expect(balance).to.be.equal(2);
      const numberMinted = await gmiERC721R.presaleNumberMinted(minter1.address);
      expect(numberMinted).to.be.equal(2);
      const mintedAmount = await gmiERC721R.mintedAmount();
      expect(mintedAmount).to.be.equal(2);
    });

    it("should not mint when paused", async () => {
      await gmiERC721R.togglePause();
      await gmiERC721R.togglePresale();
      await expect(
        gmiERC721R.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should not mint when presale is not active", async () => {
      await gmiERC721R.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await expect(
        gmiERC721R.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Presale is not active");
    });

    it("should not mint when price is not corect", async () => {
      await gmiERC721R.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R.togglePresale();

      await expect(
        gmiERC721R.connect(minter1).presaleMint(2, { value: "1000000000000000000" }),
      ).to.be.revertedWith("Bad value");
    });

    it("should not mint when tx mint amount is not valid", async () => {
      await gmiERC721R.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R.togglePresale();

      await expect(
        gmiERC721R
          .connect(minter1)
          .presaleMint(presaleMaxTxMintAmount + 1, { value: "4000000000000000000" }),
      ).to.be.revertedWith("Max tx amount");
    });

    it("should not mint when max user mint amount is not valid", async () => {
      await gmiERC721R.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R.togglePresale();
      await gmiERC721R.presaleConfig(maxUserMintAmount, 10, true);
      await expect(
        gmiERC721R
          .connect(minter1)
          .presaleMint(presaleMaxUserMintAmount + 1, { value: "6000000000000000000" }),
      ).to.be.revertedWith("Max amount");
    });

    it("should not mint when max supply is sold", async () => {
      await gmiERC721R.addWhitelist([minter1.address], [300]);
      await gmiERC721R.togglePresale();
      await gmiERC721R.presaleConfig(200, 100, true);
      await gmiERC721R.connect(minter1).presaleMint(1, { value: "1000000000000000000" });
      await expect(
        gmiERC721R.connect(minter1).presaleMint(100, { value: "100000000000000000000" }),
      ).to.be.revertedWith("Max supply");
    });

    it("should not mint when not whitelist", async () => {
      await gmiERC721R.togglePresale();
      await expect(
        gmiERC721R.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Not whitelisted");
    });
  });

  describe("ownerMint()", () => {
    it("should owner mint", async () => {
      await gmiERC721R.ownerMint(minter1.address, 1);
      const result = await gmiERC721R.isOwnerMint(1);
      expect(result).to.be.equal(true);
    });

    it("should owner mint when reserved limit hits", async () => {
      await gmiERC721R.ownerMint(minter1.address, (maxMintSupply * 20) / 100);
    });

    it("should not owner mint when sender is not owner", async () => {
      await expect(gmiERC721R.connect(stranger).ownerMint(minter1.address, 1)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("setBaseURI()", () => {
    it("should setBaseURI()", async () => {
      await gmiERC721R.setBaseURI("testbase.io/");
    });

    it("should not set base uri when sender is not owner", async () => {
      await expect(gmiERC721R.connect(stranger).setBaseURI("testbase.io/")).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("set max user mint amount", () => {
    it("should set max user mint amount", async () => {
      await gmiERC721R.publicsaleConfig(1, maxTxMintAmount, false);
      const result = await gmiERC721R.maxUserMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max user mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R.connect(stranger).publicsaleConfig(1, maxTxMintAmount, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set max tx mint amount", () => {
    it("should set max tx mint amount", async () => {
      await gmiERC721R.publicsaleConfig(maxUserMintAmount, 1, false);
      const result = await gmiERC721R.maxTxMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R.connect(stranger).publicsaleConfig(maxUserMintAmount, 1, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set tx mint amount", () => {
    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R.connect(stranger).publicsaleConfig(maxUserMintAmount, maxTxMintAmount, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set max user mint amount in presale", () => {
    it("should set max user mint amount", async () => {
      await gmiERC721R.presaleConfig(1, presaleMaxTxMintAmount, true);
      const result = await gmiERC721R.presaleMaxUserMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max user mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R.connect(stranger).presaleConfig(1, presaleMaxTxMintAmount, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set max tx mint amount in presale", () => {
    it("should set max tx mint amount", async () => {
      await gmiERC721R.presaleConfig(presaleMaxUserMintAmount, 1, true);
      const result = await gmiERC721R.presaleMaxTxMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R.connect(stranger).presaleConfig(presaleMaxUserMintAmount, 1, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set presale max tx amount", () => {
    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R
          .connect(stranger)
          .presaleConfig(presaleMaxUserMintAmount, presaleMaxTxMintAmount, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("addWhitelist()", () => {
    it("should add whitelist", async () => {
      await gmiERC721R.addWhitelist(
        [minter1.address, minter2.address],
        [presaleMaxUserMintAmount, presaleMaxUserMintAmount],
      );
      const result = await gmiERC721R.whitelists(minter1.address);
      expect(result).to.be.equal(presaleMaxUserMintAmount);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R
          .connect(stranger)
          .addWhitelist(
            [minter1.address, minter2.address],
            [presaleMaxUserMintAmount, presaleMaxUserMintAmount],
          ),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("removeWhitelist()", () => {
    it("should add whitelist", async () => {
      await gmiERC721R.addWhitelist(
        [minter1.address, minter2.address],
        [presaleMaxTxMintAmount, presaleMaxTxMintAmount],
      );
      await gmiERC721R.removeWhitelist([minter1.address, minter2.address]);
      const result = await gmiERC721R.whitelists(minter1.address);
      expect(result).to.be.equal(0);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R.connect(stranger).removeWhitelist([minter1.address, minter2.address]),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("pause", () => {
    it("should pause the contract", async () => {
      const result = await gmiERC721R.paused();
      expect(result).to.be.equal(false);
    });

    it("only owner can pause the contract", async () => {
      await expect(gmiERC721R.connect(stranger).togglePause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("togglePause", () => {
    it("should pause the contract", async () => {
      const result = await gmiERC721R.paused();
      expect(result).to.be.equal(false);
    });

    it("only owner can unpause the contract", async () => {
      await expect(gmiERC721R.connect(stranger).togglePause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("refund()", () => {
    it("should refund", async () => {
      await other.sendTransaction({
        to: await gmiERC721R.getAddress(),
        value: "18000000000000000000",
      });
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.connect(minter1).mint(2, { value: "20000000000000000000" });
      const prevContractBalance = await ethers.provider.getBalance(await gmiERC721R.getAddress());
      await gmiERC721R.connect(minter1).refund([1, 2]);
      const afterContractBalance = await ethers.provider.getBalance(await gmiERC721R.getAddress());
      expect(prevContractBalance).to.be.equal("20000000000000000000");
      expect(afterContractBalance).to.be.equal("0");
    });

    it("should not refund with 0 price", async () => {
      await gmiERC721RFreePresale.presaleConfig(
        presaleMaxUserMintAmount,
        presaleMaxTxMintAmount,
        true,
      );
      await gmiERC721RFreePresale.addWhitelist([minter1.address], [10]);
      await gmiERC721RFreePresale.connect(minter1).presaleMint(2, { value: 0 });
      await expect(gmiERC721RFreePresale.connect(minter1).refund([1, 2])).to.be.revertedWith(
        "Free NFTs can't be refunded",
      );
    });

    it("should not refund if user is not owner of NFT", async () => {
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.connect(minter1).mint(2, { value: "20000000000000000000" });
      await expect(gmiERC721R.connect(minter2).refund([1, 2])).to.be.revertedWith("Not owner");
    });
    it("should not refund if NFT is minted by owner", async () => {
      gmiERC721R.togglePause();
      await gmiERC721R.ownerMint(minter1.address, 2);
      await expect(gmiERC721R.connect(minter1).refund([1, 2])).to.be.revertedWith("Owner mint");
    });

    it("should mint one fresh and one burned NFT", async () => {
      await gmiERC721R.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R.connect(minter1).mint(maxMintSupply - 1, { value: "990000000000000000000" });
      await gmiERC721R.connect(minter1).refund([1]);
      await gmiERC721R.connect(minter2).mint(2, { value: "20000000000000000000" });
      await gmiERC721R.connect(minter2).refund([1]);
    });

    it("should mint refunded NFT", async () => {
      await gmiERC721R.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R.connect(minter1).mint(maxMintSupply, { value: "1000000000000000000000" });
      await gmiERC721R.connect(minter1).refund([1, 2]);

      await gmiERC721R.connect(minter2).mint(1, { value: "10000000000000000000" });
      const ownerOf1 = await gmiERC721R.ownerOf(1);
      const ownerOf3 = await gmiERC721R.ownerOf(1);
      expect(ownerOf1).to.be.equal(minter2.address);
      expect(ownerOf3).to.be.equal(minter2.address);
    });

    it("should refund again", async () => {
      await gmiERC721R.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R.connect(minter1).mint(maxMintSupply, { value: "1000000000000000000000" });
      await gmiERC721R.connect(minter1).refund([1, 2]);

      await gmiERC721R.connect(minter2).mint(2, { value: "20000000000000000000" });
      await gmiERC721R.connect(minter2).refund([1]);
    });

    it("should refund again in presale", async () => {
      await gmiERC721R.togglePresale();
      await gmiERC721R.addWhitelist(
        [minter1.address, minter2.address],
        [maxMintSupply, maxMintSupply],
      );
      await gmiERC721R.presaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R
        .connect(minter1)
        .presaleMint(maxMintSupply, { value: "100000000000000000000" });
      await gmiERC721R.connect(minter1).refund([1]);

      await gmiERC721R.connect(minter2).presaleMint(1, { value: "1000000000000000000" });
      await gmiERC721R.connect(minter2).refund([1]);
    });

    it("should ownermint refunded NFTs", async () => {
      await gmiERC721R.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R.connect(minter1).mint(maxMintSupply, { value: "1000000000000000000000" });
      await gmiERC721R.connect(minter1).refund([1, 2]);

      await gmiERC721R.ownerMint(minter2.address, 2);
      const ownerOf1 = await gmiERC721R.ownerOf(1);
      const ownerOf2 = await gmiERC721R.ownerOf(2);

      expect(ownerOf1).to.be.equal(minter2.address);
      expect(ownerOf2).to.be.equal(minter2.address);
    });

    it("should check mintAmount and refundCounter", async () => {
      await other.sendTransaction({
        to: await gmiERC721R.getAddress(),
        value: "20000000000000000000",
      });
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.connect(minter1).mint(2, { value: "20000000000000000000" });
      const mintAmountBefore = await gmiERC721R.mintedAmount();
      await gmiERC721R.connect(minter1).refund([1, 2]);
      const mintAmountAfter = await gmiERC721R.mintedAmount();
      const refundCounter = await gmiERC721R.refundCounter();
      expect(mintAmountBefore).to.be.equal(2);
      expect(mintAmountAfter).to.be.equal(0);
      expect(refundCounter).to.be.equal(2);
    });
  });

  describe("transfers", () => {
    let nftReceiver;
    beforeEach(async () => {
      nftReceiver = await ethers.deployContract("NFTReceiver", []);

      await nftReceiver.waitForDeployment();
    });

    it("should transfer NFT to whitelisted contract", async () => {
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.connect(minter1).mint(1, { value: mintPrice });

      await operatorRegistryProxyContract.addWhitelist(await nftReceiver.getAddress());

      await gmiERC721R
        .connect(minter1)
        .safeTransferFrom(await minter1.getAddress(), await nftReceiver.getAddress(), 1);
    });

    it("should not transfer NFT to non whitelisted contract", async () => {
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.connect(minter1).mint(1, { value: mintPrice });

      await expect(
        gmiERC721R
          .connect(minter1)
          .safeTransferFrom(await minter1.getAddress(), await nftReceiver.getAddress(), 1),
      ).to.be.rejectedWith("OperatorFilter: Receiver not whitelist");
    });

    it("should send to EOA", async () => {
      await gmiERC721R.togglePublicsale();
      await gmiERC721R.connect(minter1).mint(1, { value: mintPrice });

      await gmiERC721R
        .connect(minter1)
        .safeTransferFrom(await minter1.getAddress(), await minter2.getAddress(), 1);
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { it } = require("mocha");

describe("GMIERC721R80C test", async () => {
  let gmiERC721R80;
  let gmiERC721R80FreePresale;
  let owner;
  let minter1;
  let minter2;
  let minter3;
  let minter4;
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
    [owner, minter1, minter2, minter3, minter4, stranger, other, fundReceiver, ...addrs] =
      await ethers.getSigners();

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

    gmiERC721R80 = await ethers.deployContract("GMIERC721R80C", [
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

    gmiERC721R80.waitForDeployment();

    gmiERC721R80FreePresale = await ethers.deployContract("GMIERC721R80C", [
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

    gmiERC721R80FreePresale.waitForDeployment();
  });

  describe("deployment and constructor", () => {
    it("should return owner", async () => {
      const result = await gmiERC721R80.owner();
      expect(result).to.be.equal(owner.address);
    });

    it("should return paused", async () => {
      const result = await gmiERC721R80.paused();
      expect(result).to.be.equal(false);
    });

    it("should return 20% of max supply", async () => {
      const result = await gmiERC721R80.reservedNFTs();
      expect(result).to.be.equal((maxMintSupply * 20) / 100);
    });

    it("should return presaleActive", async () => {
      const result = await gmiERC721R80.presaleActive();
      expect(result).to.be.equal(false);
    });

    it("should return name", async () => {
      const result = await gmiERC721R80.name();
      expect(result).to.be.equal(name);
    });

    it("should return symbol", async () => {
      const result = await gmiERC721R80.symbol();
      expect(result).to.be.equal(symbol);
    });

    it("should return mintPrice", async () => {
      const result = await gmiERC721R80.mintPrice();
      expect(result).to.be.equal(mintPrice);
    });

    it("should return maxUserMintAmount", async () => {
      const result = await gmiERC721R80.maxUserMintAmount();
      expect(result).to.be.equal(maxUserMintAmount);
    });

    it("should return maxTxMintAmount", async () => {
      const result = await gmiERC721R80.maxTxMintAmount();
      expect(result).to.be.equal(maxTxMintAmount);
    });

    it("should return presaleMintPrice", async () => {
      const result = await gmiERC721R80.presaleMintPrice();
      expect(result).to.be.equal(presaleMintPrice);
    });

    it("should return presaleMaxUserMintAmount", async () => {
      const result = await gmiERC721R80.presaleMaxUserMintAmount();
      expect(result).to.be.equal(presaleMaxUserMintAmount);
    });

    it("should return presaleMaxTxMintAmount", async () => {
      const result = await gmiERC721R80.presaleMaxTxMintAmount();
      expect(result).to.be.equal(presaleMaxTxMintAmount);
    });
  });

  describe("mint()", () => {
    it("should mint", async () => {
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.connect(minter1).mint(1, { value: mintPrice });

      const balance = await gmiERC721R80.balanceOf(minter1.address);
      expect(balance).to.be.equal(1);
      const numberMinted = await gmiERC721R80.numberMinted(minter1.address);
      expect(numberMinted).to.be.equal(1);
      const mintedAmount = await gmiERC721R80.mintedAmount();
      expect(mintedAmount).to.be.equal(1);
    });

    it("should mint more than 1 NFT", async () => {
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.connect(minter1).mint(2, { value: "20000000000000000000" });

      const balance = await gmiERC721R80.balanceOf(minter1.address);
      expect(balance).to.be.equal(2);
      const numberMinted = await gmiERC721R80.numberMinted(minter1.address);
      expect(numberMinted).to.be.equal(2);
      const mintedAmount = await gmiERC721R80.mintedAmount();
      expect(mintedAmount).to.be.equal(2);
    });

    it("should not mint when paused", async () => {
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.togglePause();

      await expect(
        gmiERC721R80.connect(minter1).mint(2, { value: "20000000000000000000" }),
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should mint when presale is active", async () => {
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.togglePresale();

      await gmiERC721R80.connect(minter1).mint(2, { value: "20000000000000000000" });
    });

    it("should not mint when price is not corect", async () => {
      await gmiERC721R80.togglePublicsale();
      await expect(
        gmiERC721R80.connect(minter1).mint(2, { value: "10000000000000000000" }),
      ).to.be.revertedWith("Bad value");
    });

    it("should not mint when tx mint amount is not valid", async () => {
      await gmiERC721R80.togglePublicsale();
      await expect(
        gmiERC721R80.connect(minter1).mint(maxTxMintAmount + 1, { value: "40000000000000000000" }),
      ).to.be.revertedWith("Max tx amount");
    });

    it("should not mint when max user mint amount is not valid", async () => {
      await gmiERC721R80.publicsaleConfig(maxUserMintAmount, 10, true);
      await expect(
        gmiERC721R80
          .connect(minter1)
          .mint(maxUserMintAmount + 1, { value: "60000000000000000000" }),
      ).to.be.revertedWith("Max amount");
    });

    it("should not mint when max supply is sold", async () => {
      await gmiERC721R80.publicsaleConfig(200, 100, true);
      await gmiERC721R80.connect(minter1).mint(1, { value: "10000000000000000000" });
      await expect(
        gmiERC721R80.connect(minter1).mint(100, { value: "1000000000000000000000" }),
      ).to.be.revertedWith("Max supply");
    });
  });

  describe("presaleMint()", () => {
    it("cannot mint more than 20% when presale price is 0", async () => {
      await gmiERC721R80FreePresale.togglePresale();
      await gmiERC721R80FreePresale.addWhitelist([minter1.address], [maxMintSupply]);
      await expect(
        gmiERC721R80FreePresale.connect(minter1).presaleMint(21, { value: "21000000000000000000" }),
      ).to.be.revertedWith("Minted all reserved NFTs");
    });

    it("should mint", async () => {
      await gmiERC721R80.togglePresale();
      await gmiERC721R80.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      const balanceOfOwnerBefore = await ethers.provider.getBalance(owner.address);
      await gmiERC721R80.connect(minter1).presaleMint(1, { value: presaleMintPrice });

      const balanceOfOwner = await ethers.provider.getBalance(owner.address);
      expect(balanceOfOwner - balanceOfOwnerBefore).to.be.equal("200000000000000000");
      const balanceOfContract = await ethers.provider.getBalance(await gmiERC721R80.getAddress());
      expect(balanceOfContract).to.be.equal("80000000000000000");
      const balance = await gmiERC721R80.balanceOf(minter1.address);
      expect(balance).to.be.equal(1);
      const numberMinted = await gmiERC721R80.presaleNumberMinted(minter1.address);
      expect(numberMinted).to.be.equal(1);
      const mintedAmount = await gmiERC721R80.mintedAmount();
      expect(mintedAmount).to.be.equal(1);
    });

    it("should mint with 0 price", async () => {
      await gmiERC721R80FreePresale.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R80FreePresale.togglePresale();
      await gmiERC721R80FreePresale.presaleConfig(
        presaleMaxUserMintAmount,
        presaleMaxTxMintAmount,
        true,
      );
      await gmiERC721R80FreePresale.connect(minter1).presaleMint(1, { value: 0 });

      const balance = await gmiERC721R80FreePresale.balanceOf(minter1.address);
      expect(balance).to.be.equal(1);
      const numberMinted = await gmiERC721R80FreePresale.presaleNumberMinted(minter1.address);
      expect(numberMinted).to.be.equal(1);
      const mintedAmount = await gmiERC721R80FreePresale.mintedAmount();
      expect(mintedAmount).to.be.equal(1);
    });

    it("should mint more than 1 NFT", async () => {
      await gmiERC721R80.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R80.togglePresale();
      await gmiERC721R80.connect(minter1).presaleMint(2, { value: "2000000000000000000" });

      const balance = await gmiERC721R80.balanceOf(minter1.address);
      expect(balance).to.be.equal(2);
      const numberMinted = await gmiERC721R80.presaleNumberMinted(minter1.address);
      expect(numberMinted).to.be.equal(2);
      const mintedAmount = await gmiERC721R80.mintedAmount();
      expect(mintedAmount).to.be.equal(2);
    });

    it("should not mint when paused", async () => {
      await gmiERC721R80.togglePresale();
      await gmiERC721R80.togglePause();
      await gmiERC721R80.addWhitelist([minter1.address], [100]);

      await expect(
        gmiERC721R80.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should not mint when presale is not active", async () => {
      await gmiERC721R80.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await expect(
        gmiERC721R80.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Presale is not active");
    });

    it("should not mint when price is not corect", async () => {
      await gmiERC721R80.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R80.togglePresale();

      await expect(
        gmiERC721R80.connect(minter1).presaleMint(2, { value: "1000000000000000000" }),
      ).to.be.revertedWith("Bad value");
    });

    it("should not mint when tx mint amount is not valid", async () => {
      await gmiERC721R80.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R80.togglePresale();

      await expect(
        gmiERC721R80
          .connect(minter1)
          .presaleMint(presaleMaxTxMintAmount + 1, { value: "4000000000000000000" }),
      ).to.be.revertedWith("Max tx amount");
    });

    it("should not mint when max user mint amount is not valid", async () => {
      await gmiERC721R80.addWhitelist([minter1.address], [presaleMaxUserMintAmount]);
      await gmiERC721R80.togglePresale();
      await gmiERC721R80.presaleConfig(presaleMaxUserMintAmount, 10, true);
      await expect(
        gmiERC721R80
          .connect(minter1)
          .presaleMint(presaleMaxUserMintAmount + 1, { value: "6000000000000000000" }),
      ).to.be.revertedWith("Max amount");
    });

    it("should not mint when max supply is sold", async () => {
      await gmiERC721R80.addWhitelist([minter1.address], [300]);
      await gmiERC721R80.togglePresale();
      await gmiERC721R80.presaleConfig(200, 100, true);
      await gmiERC721R80.connect(minter1).presaleMint(1, { value: "1000000000000000000" });
      await expect(
        gmiERC721R80.connect(minter1).presaleMint(100, { value: "100000000000000000000" }),
      ).to.be.revertedWith("Max supply");
    });

    it("should not mint when not whitelist", async () => {
      await gmiERC721R80.togglePresale();
      await expect(
        gmiERC721R80.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Not whitelisted");
    });
  });

  describe("ownerMint()", () => {
    it("should owner mint", async () => {
      await gmiERC721R80.ownerMint(minter1.address, 1);
      const result = await gmiERC721R80.isOwnerMint(1);
      expect(result).to.be.equal(true);
    });

    it("should owner mint when reserved limit hits", async () => {
      await gmiERC721R80.ownerMint(minter1.address, (maxMintSupply * 20) / 100);
    });

    it("should not owner mint when reserved limit exceeds", async () => {
      await expect(
        gmiERC721R80.ownerMint(minter1.address, (maxMintSupply * 20) / 100 + 1),
      ).to.be.revertedWith("Minted all reserved NFTs");
    });

    it("should not owner mint when sender is not owner", async () => {
      await expect(gmiERC721R80.connect(stranger).ownerMint(minter1.address, 1)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("setBaseURI()", () => {
    it("should setBaseURI()", async () => {
      await gmiERC721R80.setBaseURI("testbase.io/");
    });

    it("should not set base uri when sender is not owner", async () => {
      await expect(gmiERC721R80.connect(stranger).setBaseURI("testbase.io/")).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("set max user mint amount", () => {
    it("should set max user mint amount", async () => {
      await gmiERC721R80.publicsaleConfig(1, maxTxMintAmount, false);
      const result = await gmiERC721R80.maxUserMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max user mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R80.connect(stranger).publicsaleConfig(1, maxTxMintAmount, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set tx max mint amount", () => {
    it("should set max tx mint amount", async () => {
      await gmiERC721R80.publicsaleConfig(maxUserMintAmount, 1, false);
      const result = await gmiERC721R80.maxTxMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R80.connect(stranger).publicsaleConfig(maxUserMintAmount, 1, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set set max tx mint amount", () => {
    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R80
          .connect(stranger)
          .presaleConfig(presaleMaxUserMintAmount, presaleMaxTxMintAmount, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set max user mint amount in presale", () => {
    it("should set max user mint amount", async () => {
      await gmiERC721R80.presaleConfig(1, presaleMaxTxMintAmount, true);
      const result = await gmiERC721R80.presaleMaxUserMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max user mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R80.connect(stranger).presaleConfig(1, presaleMaxTxMintAmount, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set tx max mint amount in presale", () => {
    it("should set max tx mint amount", async () => {
      await gmiERC721R80.presaleConfig(presaleMaxUserMintAmount, 1, true);
      const result = await gmiERC721R80.presaleMaxTxMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R80.connect(stranger).presaleConfig(presaleMaxUserMintAmount, 1, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set presale max tx mint amount", () => {
    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R80
          .connect(stranger)
          .presaleConfig(presaleMaxUserMintAmount, presaleMaxTxMintAmount, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("addWhitelist()", () => {
    it("should add whitelist", async () => {
      await gmiERC721R80.addWhitelist(
        [minter1.address, minter2.address],
        [presaleMaxUserMintAmount, presaleMaxUserMintAmount],
      );
      const result = await gmiERC721R80.whitelists(minter1.address);
      expect(result).to.be.equal(presaleMaxUserMintAmount);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R80
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
      await gmiERC721R80.addWhitelist(
        [minter1.address, minter2.address],
        [presaleMaxUserMintAmount, presaleMaxUserMintAmount],
      );
      await gmiERC721R80.removeWhitelist([minter1.address, minter2.address]);
      const result = await gmiERC721R80.whitelists(minter1.address);
      expect(result).to.be.equal(0);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721R80.connect(stranger).removeWhitelist([minter1.address, minter2.address]),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("pause", () => {
    it("should pause the contract", async () => {
      await gmiERC721R80.togglePause();
      const result = await gmiERC721R80.paused();
      expect(result).to.be.equal(true);
    });

    it("only owner can pause the contract", async () => {
      await expect(gmiERC721R80.connect(stranger).togglePause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("unpause", () => {
    it("should pause the contract", async () => {
      const result = await gmiERC721R80.paused();
      expect(result).to.be.equal(false);
    });

    it("only owner can unpause the contract", async () => {
      await expect(gmiERC721R80.connect(stranger).togglePause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("refund()", () => {
    it("should not refund with 0 price", async () => {
      await gmiERC721R80FreePresale.presaleConfig(maxUserMintAmount, maxTxMintAmount, true);
      await gmiERC721R80FreePresale.addWhitelist([minter1.address], [10]);
      await gmiERC721R80FreePresale.connect(minter1).presaleMint(2, { value: 0 });
      await expect(gmiERC721R80FreePresale.connect(minter1).refund([1, 2])).to.be.revertedWith(
        "Free NFTs can't be refunded",
      );
    });

    it("should refund", async () => {
      await other.sendTransaction({
        to: await gmiERC721R80.getAddress(),
        value: "14400000000000000000",
      });
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.connect(minter1).mint(2, { value: "20000000000000000000" });
      const prevContractBalance = await ethers.provider.getBalance(await gmiERC721R80.getAddress());
      await gmiERC721R80.connect(minter1).refund([1, 2]);
      const afterContractBalance = await ethers.provider.getBalance(
        await gmiERC721R80.getAddress(),
      );
      expect(prevContractBalance).to.be.equal("16000000000000000000");
      expect(afterContractBalance).to.be.equal("0");
    });

    it("should not refund if user is not owner of NFT", async () => {
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.connect(minter1).mint(2, { value: "20000000000000000000" });
      await expect(gmiERC721R80.connect(minter2).refund([1, 2])).to.be.revertedWith("Not owner");
    });

    it("should not refund if NFT is minted by owner", async () => {
      gmiERC721R80.togglePause();
      await gmiERC721R80.ownerMint(minter1.address, 2);
      await expect(gmiERC721R80.connect(minter1).refund([1, 2])).to.be.revertedWith("Owner mint");
    });

    it("should mint refunded NFT with 80% of price", async () => {
      await gmiERC721R80.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80.connect(minter1).mint(maxMintSupply, { value: "1000000000000000000000" });
      await gmiERC721R80.connect(minter1).refund([1, 2]);

      await gmiERC721R80.connect(minter2).mint(1, { value: "8000000000000000000" });
      const ownerOf1 = await gmiERC721R80.ownerOf(1);
      const ownerOf3 = await gmiERC721R80.ownerOf(1);
      expect(ownerOf1).to.be.equal(minter2.address);
      expect(ownerOf3).to.be.equal(minter2.address);
    });

    it("should mint fresh and remint in one transaction", async () => {
      await gmiERC721R80.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80
        .connect(minter1)
        .mint(maxMintSupply - 1, { value: "990000000000000000000" });
      await gmiERC721R80.connect(minter1).refund([1, 2]);

      await gmiERC721R80.connect(minter2).mint(3, { value: "26000000000000000000" });
      const ownerOf1 = await gmiERC721R80.ownerOf(1);
      const ownerOf3 = await gmiERC721R80.ownerOf(1);
      expect(ownerOf1).to.be.equal(minter2.address);
      expect(ownerOf3).to.be.equal(minter2.address);
    });

    it("should refund again", async () => {
      await gmiERC721R80.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80.connect(minter1).mint(maxMintSupply, { value: "1000000000000000000000" });
      await gmiERC721R80.connect(minter1).refund([3, 4]);

      await gmiERC721R80.connect(minter2).mint(2, { value: "16000000000000000000" });
      await gmiERC721R80.connect(minter2).refund([3]);
    });

    it("should mint fresh and remint in 1 tx", async () => {
      await gmiERC721R80.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80
        .connect(minter1)
        .mint(maxMintSupply - 1, { value: "990000000000000000000" });
      await gmiERC721R80.connect(minter1).refund([3, 4]);

      await gmiERC721R80.connect(minter2).mint(2, { value: "18000000000000000000" });
    });

    it("should mint fresh and remint in 1 tx for presale", async () => {
      gmiERC721R80.togglePresale();
      gmiERC721R80.addWhitelist([minter1.address, minter2.address], [maxMintSupply, maxMintSupply]);
      await gmiERC721R80.presaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80
        .connect(minter1)
        .presaleMint(maxMintSupply - 1, { value: "99000000000000000000" });
      await gmiERC721R80.connect(minter1).refund([3, 4]);

      await gmiERC721R80.connect(minter2).presaleMint(2, { value: "1800000000000000000" });
    });

    it("should refund again in presale", async () => {
      gmiERC721R80.togglePresale();
      gmiERC721R80.addWhitelist([minter1.address, minter2.address], [maxMintSupply, maxMintSupply]);
      await gmiERC721R80.presaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80
        .connect(minter1)
        .presaleMint(maxMintSupply, { value: "100000000000000000000" });
      await gmiERC721R80.connect(minter1).refund([1]);

      await gmiERC721R80.connect(minter2).presaleMint(1, { value: "800000000000000000" });
      await gmiERC721R80.connect(minter2).refund([1]);
    });

    it("should ownermint refunded NFTs", async () => {
      await gmiERC721R80.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80.connect(minter3).mint(maxMintSupply, { value: "1000000000000000000000" });
      await gmiERC721R80.connect(minter3).refund([1, 2]);

      await gmiERC721R80.ownerMint(minter4.address, 2);
      const ownerOf1 = await gmiERC721R80.ownerOf(1);
      const ownerOf2 = await gmiERC721R80.ownerOf(2);

      expect(ownerOf1).to.be.equal(minter4.address);
      expect(ownerOf2).to.be.equal(minter4.address);
    });

    it("should be 100% refundable if re minted", async () => {
      await gmiERC721R80.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80.connect(minter3).mint(maxMintSupply, { value: "1000000000000000000000" });
      await gmiERC721R80.connect(minter3).refund([1]);
      const contractBalanceBeforeRemint = await ethers.provider.getBalance(
        gmiERC721R80.getAddress(),
      );

      await gmiERC721R80.connect(minter4).mint(1, { value: "8000000000000000000" });
      await gmiERC721R80.connect(minter4).refund([1]);
      const contractBalanceAfterRemint = await ethers.provider.getBalance(
        gmiERC721R80.getAddress(),
      );
      expect(contractBalanceAfterRemint).to.be.equal(contractBalanceBeforeRemint);
    });

    it("should be 100% refundable if re minted", async () => {
      await gmiERC721R80.publicsaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80.connect(minter3).mint(maxMintSupply, { value: "1000000000000000000000" });
      await gmiERC721R80.connect(minter3).refund([1]);
      const contractBalanceBeforeRemint = await ethers.provider.getBalance(
        gmiERC721R80.getAddress(),
      );

      await gmiERC721R80.connect(minter4).mint(1, { value: "8000000000000000000" });
      await gmiERC721R80.connect(minter4).refund([1]);
      const contractBalanceAfterRemint = await ethers.provider.getBalance(
        gmiERC721R80.getAddress(),
      );
      expect(contractBalanceAfterRemint).to.be.equal(contractBalanceBeforeRemint);
    });

    it("should be 100% refundable if re minted in presale", async () => {
      gmiERC721R80.addWhitelist([minter1.address, minter2.address], [maxMintSupply, maxMintSupply]);
      await gmiERC721R80.presaleConfig(maxMintSupply, maxMintSupply, true);
      await gmiERC721R80
        .connect(minter1)
        .presaleMint(maxMintSupply, { value: "100000000000000000000" });
      await gmiERC721R80.connect(minter1).refund([1]);
      const contractBalanceBeforeRemint = await ethers.provider.getBalance(
        gmiERC721R80.getAddress(),
      );

      await gmiERC721R80.connect(minter2).presaleMint(1, { value: "800000000000000000" });
      await gmiERC721R80.connect(minter2).refund([1]);
      const contractBalanceAfterRemint = await ethers.provider.getBalance(
        gmiERC721R80.getAddress(),
      );
      expect(contractBalanceAfterRemint).to.be.equal(contractBalanceBeforeRemint);
    });

    it("should check mintAmount and refundCounter", async () => {
      await other.sendTransaction({
        to: await gmiERC721R80.getAddress(),
        value: "14400000000000000000",
      });

      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.connect(minter1).mint(2, { value: "20000000000000000000" });
      const mintAmountBefore = await gmiERC721R80.mintedAmount();
      await gmiERC721R80.connect(minter1).refund([1, 2]);
      const mintAmountAfter = await gmiERC721R80.mintedAmount();
      const refundCounter = await gmiERC721R80.refundCounter();
      expect(mintAmountBefore).to.be.equal(2);
      expect(mintAmountAfter).to.be.equal(0);
      expect(refundCounter).to.be.equal(2);
    });
  });

  it("should not mint 2 remints", async () => {
    await gmiERC721R80.publicsaleConfig(maxMintSupply, maxMintSupply, true);
    await gmiERC721R80.connect(minter1).mint(maxMintSupply, { value: "1000000000000000000000" });
    await gmiERC721R80.connect(minter1).refund([1, 2]);

    await gmiERC721R80.connect(minter2).mint(1, { value: "8000000000000000000" });
  });

  it("should not mint 2 remints in presale", async () => {
    await gmiERC721R80.presaleConfig(maxMintSupply, maxMintSupply, true);
    await gmiERC721R80.addWhitelist([minter1, minter2], [maxMintSupply, maxMintSupply]);
    await gmiERC721R80
      .connect(minter1)
      .presaleMint(maxMintSupply, { value: "100000000000000000000" });
    await gmiERC721R80.connect(minter1).refund([1, 2]);

    await gmiERC721R80.connect(minter2).presaleMint(1, { value: "800000000000000000" });
  });

  describe("transfers", () => {
    let nftReceiver;
    beforeEach(async () => {
      nftReceiver = await ethers.deployContract("NFTReceiver", []);

      await nftReceiver.waitForDeployment();
    });

    it("should transfer NFT to whitelisted contract", async () => {
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.connect(minter1).mint(1, { value: mintPrice });

      await operatorRegistryProxyContract.addWhitelist(await nftReceiver.getAddress());

      await gmiERC721R80
        .connect(minter1)
        .safeTransferFrom(await minter1.getAddress(), await nftReceiver.getAddress(), 1);
    });

    it("should not transfer NFT to non whitelisted contract", async () => {
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.connect(minter1).mint(1, { value: mintPrice });

      await expect(
        gmiERC721R80
          .connect(minter1)
          .safeTransferFrom(await minter1.getAddress(), await nftReceiver.getAddress(), 1),
      ).to.be.rejectedWith("OperatorFilter: Receiver not whitelist");
    });

    it("should send to EOA", async () => {
      await gmiERC721R80.togglePublicsale();
      await gmiERC721R80.connect(minter1).mint(1, { value: mintPrice });

      await gmiERC721R80
        .connect(minter1)
        .safeTransferFrom(await minter1.getAddress(), await minter2.getAddress(), 1);
    });
  });
});

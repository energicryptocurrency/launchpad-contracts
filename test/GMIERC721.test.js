const { expect } = require("chai");
const { ethers } = require("hardhat");
const { it } = require("mocha");

describe("GMIERC721 test", async () => {
  let gmiERC721;
  let owner;
  let minter1;
  let minter2;
  let stranger;

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

  beforeEach(async () => {
    [owner, minter1, minter2, stranger, ...addrs] = await ethers.getSigners();

    gmiERC721 = await ethers.deployContract("GMIERC721", [
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
    ]);

    gmiERC721.waitForDeployment();
  });

  describe("deployment and constructor", () => {
    it("should return owner", async () => {
      const result = await gmiERC721.owner();
      expect(result).to.be.equal(owner.address);
    });

    it("should return paused", async () => {
      const result = await gmiERC721.paused();
      expect(result).to.be.equal(false);
    });

    it("should return presaleActive", async () => {
      const result = await gmiERC721.presaleActive();
      expect(result).to.be.equal(false);
    });

    it("should return name", async () => {
      const result = await gmiERC721.name();
      expect(result).to.be.equal(name);
    });

    it("should return symbol", async () => {
      const result = await gmiERC721.symbol();
      expect(result).to.be.equal(symbol);
    });

    it("should return mintPrice", async () => {
      const result = await gmiERC721.mintPrice();
      expect(result).to.be.equal(mintPrice);
    });

    it("should return maxUserMintAmount", async () => {
      const result = await gmiERC721.maxUserMintAmount();
      expect(result).to.be.equal(maxUserMintAmount);
    });

    it("should return maxTxMintAmount", async () => {
      const result = await gmiERC721.maxTxMintAmount();
      expect(result).to.be.equal(maxTxMintAmount);
    });

    it("should return presaleMintPrice", async () => {
      const result = await gmiERC721.presaleMintPrice();
      expect(result).to.be.equal(presaleMintPrice);
    });

    it("should return presaleMaxUserMintAmount", async () => {
      const result = await gmiERC721.presaleMaxUserMintAmount();
      expect(result).to.be.equal(presaleMaxUserMintAmount);
    });

    it("should return presaleMaxTxMintAmount", async () => {
      const result = await gmiERC721.presaleMaxTxMintAmount();
      expect(result).to.be.equal(presaleMaxTxMintAmount);
    });
  });

  describe("mint()", () => {
    it("should mint", async () => {
      await gmiERC721.togglePublicsale();
      await gmiERC721.connect(minter1).mint(1, { value: mintPrice });

      const balance = await gmiERC721.balanceOf(minter1.address);
      expect(balance).to.be.equal(1);
      const numberMinted = await gmiERC721.numberMinted(minter1.address);
      expect(numberMinted).to.be.equal(1);
      const mintedAmount = await gmiERC721.mintedAmount();
      expect(mintedAmount).to.be.equal(1);
    });

    it("should mint more than 1 NFT", async () => {
      await gmiERC721.togglePublicsale();
      await gmiERC721.connect(minter1).mint(2, { value: "20000000000000000000" });

      const balance = await gmiERC721.balanceOf(minter1.address);
      expect(balance).to.be.equal(2);
      const numberMinted = await gmiERC721.numberMinted(minter1.address);
      expect(numberMinted).to.be.equal(2);
      const mintedAmount = await gmiERC721.mintedAmount();
      expect(mintedAmount).to.be.equal(2);
    });

    it("should not mint when paused", async () => {
      await gmiERC721.togglePublicsale();
      await gmiERC721.togglePause();
      await expect(
        gmiERC721.connect(minter1).mint(2, { value: "20000000000000000000" }),
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should mint when publicsale is active", async () => {
      await gmiERC721.togglePublicsale();
      await gmiERC721.connect(minter1).mint(2, { value: "20000000000000000000" });
    });

    it("should not mint when price is not corect", async () => {
      await gmiERC721.togglePublicsale();
      await expect(
        gmiERC721.connect(minter1).mint(2, { value: "10000000000000000000" }),
      ).to.be.revertedWith("Bad value");
    });

    it("should not mint when tx mint amount is not valid", async () => {
      await gmiERC721.togglePublicsale();
      await expect(
        gmiERC721.connect(minter1).mint(maxTxMintAmount + 1, { value: "40000000000000000000" }),
      ).to.be.revertedWith("Max tx amount");
    });

    it("should not mint when max user mint amount is not valid", async () => {
      await gmiERC721.publicsaleConfig(mintPrice, maxUserMintAmount, 10, true);
      await expect(
        gmiERC721.connect(minter1).mint(maxUserMintAmount + 1, { value: "60000000000000000000" }),
      ).to.be.revertedWith("Max amount");
    });

    it("should not mint when max supply is sold", async () => {
      await gmiERC721.publicsaleConfig(mintPrice, 200, 100, true);
      await gmiERC721.connect(minter1).mint(1, { value: "10000000000000000000" });
      await expect(
        gmiERC721.connect(minter1).mint(100, { value: "1000000000000000000000" }),
      ).to.be.revertedWith("Max supply");
    });
  });

  describe("presaleMint()", () => {
    it("should mint", async () => {
      await gmiERC721.addWhitelist([minter1.address], [maxUserMintAmount]);
      await gmiERC721.togglePresale();
      await gmiERC721.connect(minter1).presaleMint(1, { value: presaleMintPrice });

      const balance = await gmiERC721.balanceOf(minter1.address);
      expect(balance).to.be.equal(1);
      const numberMinted = await gmiERC721.presaleNumberMinted(minter1.address);
      expect(numberMinted).to.be.equal(1);
      const mintedAmount = await gmiERC721.mintedAmount();
      expect(mintedAmount).to.be.equal(1);
    });

    it("should mint more than 1 NFT", async () => {
      await gmiERC721.togglePresale();
      await gmiERC721.addWhitelist([minter1.address], [maxUserMintAmount]);
      await gmiERC721.connect(minter1).presaleMint(2, { value: "2000000000000000000" });

      const balance = await gmiERC721.balanceOf(minter1.address);
      expect(balance).to.be.equal(2);
      const numberMinted = await gmiERC721.presaleNumberMinted(minter1.address);
      expect(numberMinted).to.be.equal(2);
      const mintedAmount = await gmiERC721.mintedAmount();
      expect(mintedAmount).to.be.equal(2);
    });

    it("should not mint when paused", async () => {
      await gmiERC721.togglePause();
      await gmiERC721.togglePresale();
      await expect(
        gmiERC721.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should not mint when presale is not active", async () => {
      await gmiERC721.addWhitelist([minter1.address], [maxUserMintAmount]);

      await expect(
        gmiERC721.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Presale is not active");
    });

    it("should not mint when price is not corect", async () => {
      await gmiERC721.addWhitelist([minter1.address], [maxUserMintAmount]);
      await gmiERC721.togglePresale();

      await expect(
        gmiERC721.connect(minter1).presaleMint(2, { value: "1000000000000000000" }),
      ).to.be.revertedWith("Bad value");
    });

    it("should not mint when tx mint amount is not valid", async () => {
      await gmiERC721.addWhitelist([minter1.address], [maxUserMintAmount]);
      await gmiERC721.togglePresale();

      await expect(
        gmiERC721
          .connect(minter1)
          .presaleMint(presaleMaxTxMintAmount + 1, { value: "4000000000000000000" }),
      ).to.be.revertedWith("Max tx amount");
    });

    it("should not mint when max user mint amount is not valid", async () => {
      await gmiERC721.addWhitelist([minter1.address], [maxUserMintAmount]);
      await gmiERC721.togglePresale();
      await gmiERC721.presaleConfig(presaleMintPrice, presaleMaxUserMintAmount, 10, true);

      await expect(
        gmiERC721
          .connect(minter1)
          .presaleMint(presaleMaxUserMintAmount + 1, { value: "6000000000000000000" }),
      ).to.be.revertedWith("Max amount");
    });

    it("should not mint when max supply is sold", async () => {
      await gmiERC721.addWhitelist([minter1.address], [300]);
      await gmiERC721.togglePresale();
      await gmiERC721.presaleConfig(presaleMintPrice, 200, 100, true);
      await gmiERC721.connect(minter1).presaleMint(1, { value: "1000000000000000000" });
      await expect(
        gmiERC721.connect(minter1).presaleMint(100, { value: "100000000000000000000" }),
      ).to.be.revertedWith("Max supply");
    });

    it("should not mint when not whitelist", async () => {
      await gmiERC721.togglePresale();
      await expect(
        gmiERC721.connect(minter1).presaleMint(2, { value: "2000000000000000000" }),
      ).to.be.revertedWith("Not whitelisted");
    });
  });

  describe("ownerMint()", () => {
    it("should owner mint", async () => {
      await gmiERC721.ownerMint(minter1.address, 1);
      const result = await gmiERC721.isOwnerMint(1);
      expect(result).to.be.equal(true);
    });

    it("should not owner mint when sender is not owner", async () => {
      await expect(gmiERC721.connect(stranger).ownerMint(minter1.address, 1)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("setBaseURI()", () => {
    it("should setBaseURI()", async () => {
      await gmiERC721.setBaseURI("testbase.io/");
    });

    it("should not set base uri when sender is not owner", async () => {
      await expect(gmiERC721.connect(stranger).setBaseURI("testbase.io/")).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("set max user mint amount", () => {
    it("should set max user mint amount", async () => {
      await gmiERC721.publicsaleConfig(mintPrice, 1, maxTxMintAmount, false);
      const result = await gmiERC721.maxUserMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max user mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721.connect(stranger).publicsaleConfig(mintPrice, 1, maxTxMintAmount, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set tx max mint amount", () => {
    it("should set max tx mint amount", async () => {
      await gmiERC721.publicsaleConfig(mintPrice, maxUserMintAmount, 1, false);
      const result = await gmiERC721.maxTxMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721.connect(stranger).publicsaleConfig(mintPrice, maxUserMintAmount, 1, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set mint price", () => {
    it("should set mint price", async () => {
      await gmiERC721.publicsaleConfig(1, maxUserMintAmount, maxTxMintAmount, false);
      const result = await gmiERC721.mintPrice();
      expect(result).to.be.equal(1);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721.connect(stranger).publicsaleConfig(1, maxUserMintAmount, maxTxMintAmount, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set max user mint amount in presale", () => {
    it("should set max user mint amount", async () => {
      await gmiERC721.presaleConfig(presaleMintPrice, 1, presaleMaxTxMintAmount, true);
      const result = await gmiERC721.presaleMaxUserMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max user mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721
          .connect(stranger)
          .presaleConfig(presaleMintPrice, 1, presaleMaxTxMintAmount, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set tx max mint amount in presale", () => {
    it("should set max tx mint amount", async () => {
      await gmiERC721.presaleConfig(presaleMintPrice, presaleMaxUserMintAmount, 1, true);
      const result = await gmiERC721.presaleMaxTxMintAmount();
      expect(result).to.be.equal(1);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721
          .connect(stranger)
          .presaleConfig(presaleMintPrice, presaleMaxUserMintAmount, 1, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("set presale mint price", () => {
    it("should set mint price", async () => {
      await gmiERC721.presaleConfig(1, presaleMaxUserMintAmount, presaleMaxTxMintAmount, true);
      const result = await gmiERC721.presaleMintPrice();
      expect(result).to.be.equal(1);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721
          .connect(stranger)
          .presaleConfig(1, presaleMaxUserMintAmount, presaleMaxTxMintAmount, true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("addWhitelist()", () => {
    it("should add whitelist", async () => {
      await gmiERC721.addWhitelist(
        [minter1.address, minter2.address],
        [maxUserMintAmount, maxUserMintAmount],
      );
      const result = await gmiERC721.whitelists(minter1.address);
      expect(result).to.be.equal(maxUserMintAmount);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721
          .connect(stranger)
          .addWhitelist([minter1.address, minter2.address], [maxUserMintAmount, maxUserMintAmount]),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("removeWhitelist()", () => {
    it("should add whitelist", async () => {
      await gmiERC721.addWhitelist([minter1.address], [maxUserMintAmount]);
      await gmiERC721.removeWhitelist([minter1.address, minter2.address]);
      const result = await gmiERC721.whitelists(minter1.address);
      expect(result).to.be.equal(0);
    });

    it("should not set max tx mint amount when sender is not owner", async () => {
      await expect(
        gmiERC721.connect(stranger).removeWhitelist([minter1.address, minter2.address]),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("pause", () => {
    it("should pause the contract", async () => {
      await gmiERC721.togglePause();
      const result = await gmiERC721.paused();
      expect(result).to.be.equal(true);
    });

    it("only owner can pause the contract", async () => {
      await expect(gmiERC721.connect(stranger).togglePause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("unpause", () => {
    it("should pause the contract", async () => {
      await gmiERC721.togglePause();
      await gmiERC721.togglePause();
      const result = await gmiERC721.paused();
      expect(result).to.be.equal(false);
    });

    it("only owner can unpause the contract", async () => {
      await expect(gmiERC721.connect(stranger).togglePause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });
});

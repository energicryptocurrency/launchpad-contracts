const { expect } = require("chai");
const { ethers } = require("hardhat");
const { it, describe } = require("mocha");

describe("Operator Registry test", async () => {
  let owner;
  let stranger;
  let fundReceiver;
  let operatorRegistry;
  let operatorRegistryProxy;
  let operatorRegistryProxyAdmin;
  let operatorRegistryProxyContract;
  const sharePercentageBps = 9000; // 90%

  beforeEach(async () => {
    [owner, stranger, fundReceiver, ...addrs] = await ethers.getSigners();

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
  });

  describe("deployment and constructor", () => {
    it("should return owner", async () => {
      const result = await operatorRegistryProxyContract.owner();
      expect(result).to.be.equal(owner.address);
    });

    it("should return paused", async () => {
      const result = await operatorRegistryProxyContract.paused();
      expect(result).to.be.equal(false);
    });

    it("should return fund receiver", async () => {
      const result = await operatorRegistryProxyContract.fundReceiver();
      expect(result).to.be.equal(fundReceiver.address);
    });

    it("should return share percentage bps", async () => {
      const result = await operatorRegistryProxyContract.sharePercentageBps();
      expect(result).to.be.equal("9000");
    });
  });

  describe("pause", () => {
    it("should pause the contract", async () => {
      await operatorRegistryProxyContract.pause();
      const result = await operatorRegistryProxyContract.paused();

      expect(result).to.be.equal(true);
    });

    it("only owner can pause the contract", async () => {
      await expect(operatorRegistryProxyContract.connect(stranger).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("unpause", () => {
    it("should unpause the contract", async () => {
      await operatorRegistryProxyContract.pause();
      await operatorRegistryProxyContract.unpause();

      const result = await operatorRegistryProxyContract.paused();

      expect(result).to.be.equal(false);
    });

    it("only owner can pause the contract", async () => {
      await operatorRegistryProxyContract.pause();

      await expect(operatorRegistryProxyContract.connect(stranger).unpause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("addWhitelist()", () => {
    it("should add whitelist", async () => {
      await operatorRegistryProxyContract.addWhitelist(stranger.address);

      const result = await operatorRegistryProxyContract.isWhitelist(stranger.address);

      expect(result).to.be.equal(true);
    });

    it("only owner can add whitelist", async () => {
      await expect(
        operatorRegistryProxyContract.connect(stranger).addWhitelist(stranger.address),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("only add non whitelisted address", async () => {
      await operatorRegistryProxyContract.addWhitelist(stranger.address);

      await expect(operatorRegistryProxyContract.addWhitelist(stranger.address)).to.be.revertedWith(
        "OperatorRegistry: Already whitelisted",
      );
    });
  });

  describe("removeWhitelist()", () => {
    it("should remove whitelist", async () => {
      await operatorRegistryProxyContract.addWhitelist(stranger.address);

      await operatorRegistryProxyContract.removeWhitelist(stranger.address);

      const result = await operatorRegistryProxyContract.isWhitelist(stranger.address);

      expect(result).to.be.equal(false);
    });

    it("only owner can remove whitelist", async () => {
      await operatorRegistryProxyContract.addWhitelist(stranger.address);

      await expect(
        operatorRegistryProxyContract.connect(stranger).removeWhitelist(stranger.address),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("only remove  whitelisted address", async () => {
      await expect(
        operatorRegistryProxyContract.removeWhitelist(stranger.address),
      ).to.be.revertedWith("OperatorRegistry: Not whitelisted");
    });
  });

  describe("changeFundReceiver()", () => {
    it("should change fund receiver", async () => {
      await operatorRegistryProxyContract.changeFundReceiver(stranger.address);

      const result = await operatorRegistryProxyContract.fundReceiver();

      expect(result).to.be.equal(stranger.address);
    });

    it("only owner can change fund receiver", async () => {
      await expect(
        operatorRegistryProxyContract.connect(stranger).changeFundReceiver(stranger.address),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("changeSharePercentageBps()", () => {
    it("should change share percentage bps", async () => {
      await operatorRegistryProxyContract.changeSharePercentageBps(1000);

      const result = await operatorRegistryProxyContract.sharePercentageBps();

      expect(result).to.be.equal(1000);
    });

    it("only owner can change share percentage bps", async () => {
      await expect(
        operatorRegistryProxyContract.connect(stranger).changeSharePercentageBps(1000),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

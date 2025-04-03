const { ethers } = require("hardhat");

const fundReceiver = "0x3c94e4ad6bcae45e69aa821e700bdb1199460e7c";
const sharePercentageBps = 9000; // 90%

async function main() {
  const operatorRegistryProxyAdmin = await ethers.deployContract("OperatorRegistryProxyAdmin", []);

  await operatorRegistryProxyAdmin.waitForDeployment();

  const operatorRegistry = await ethers.deployContract("OperatorRegistry", []);

  await operatorRegistry.waitForDeployment();

  const operatorRegistryProxy = await ethers.deployContract("OperatorRegistryProxy", [
    await operatorRegistry.getAddress(),
    await operatorRegistryProxyAdmin.getAddress(),
    "0x",
  ]);

  await operatorRegistryProxy.waitForDeployment();

  const operatorRegistryProxyContract = await ethers.getContractAt(
    "OperatorRegistry",
    await operatorRegistryProxy.getAddress(),
  );

  await operatorRegistryProxyContract.initialize(
    await fundReceiver.getAddress(),
    sharePercentageBps,
  );

  console.log(`
    OperatorRegistryProxyAdmin: ${await operatorRegistryProxyAdmin.getAddress()}
    OperatorRegistryProxy:      ${await operatorRegistryProxy.getAddress()}
    OperatorRegistry:           ${await operatorRegistry.getAddress()}
  `);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

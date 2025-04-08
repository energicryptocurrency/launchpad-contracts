# GMI Launchpad contracts

This repo contains all contracts related to the GMI Launchpad project

## Project Status

The GMI Launchpad Contracts repo is under active maintenance by Energi

## Authors and acknowledgment

- [@zakialam](https://github.com/zalam003)
- [@leon](https://github.com/LeonDolinar)
- [@haidar.ali](https://github.com/haidaralimasu)

## Quickstart

**Requirements**

- node v18.17.0
- yarn v1.22.19

**Clone the repo**

clone the repo

**Setup env file**

```sh
cp .env.example .env
```

**Install all dependencies**

```sh
yarn
```

**Setup enviorment variables in** `.env`

```sh
INFURA_PROJECT_ID='Infura project id'
WALLET_PRIVATE_KEY='Your wallet private key'
ETHERSCAN_API_KEY='Etherscan api key'
```

**Run test cases**

```sh
yarn test
```

**Format code**

```sh
yarn lint
```

**Deploy standard NFT contracts on testnet**

```sh
npx hardhat run scripts/deploy-erc721.js --network energiTestnet
```

**Deploy 100% refundable NFT contracts on testnet**

```sh
npx hardhat run scripts/deploy-erc721r.js --network energiTestnet
```

**Deploy 80% refundable NFT contracts on testnet**

```sh
npx hardhat run scripts/deploy-erc721r80.js --network energiTestnet
```


**Deploy standard NFT contracts on mainnet**

```sh
npx hardhat run scripts/deploy-erc721.js --network energiMainnet
```

**Deploy 100% refundable NFT contracts on mainnet**

```sh
npx hardhat run scripts/deploy-erc721r.js --network energiMainnet
```

**Deploy 80% refundable NFT contracts on mainnet**

```sh
npx hardhat run scripts/deploy-erc721r80.js --network energiMainnet
```

**Deploy standard ERC721C NFT contract**

```sh
npx hardhat run scripts/erc721c/deploy-erc721c.js --network <network name>
```

**Deploy 100% refundable ERC721C NFT contract**

```sh
npx hardhat run scripts/erc721c/deploy-erc721rc.js --network <network name>
```

**Deploy 80% refundable ERC721C NFT contract**

```sh
npx hardhat run scripts/erc721c/deploy-erc721r80c.js --network <network name>
```

## Documentation

Details of contracts and available functions can be found in the following documents:

NOTE: Contracts with C in there names follows ERC721C standard where trading of those NFTs is limited to selected marketplaces.

- [Standard NFT Contracts and Standard ERC721C NFT Contracts](./docs/Standard.md)
- [100% Refundable NFT Contracts and 100% Refundable ERC721C NFT Contracts](./docs/Refundable100.md)
- [80% Refundable NFT Contracts and 80% Refundable ERC721C NFT Contracts](./docs/Refundable80.md)



## License

GMI Launchpad Contracts repo is available under the MIT license. See the [LICENSE](LICENSE) file for more info.

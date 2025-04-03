# 80% Refundable NFT Contracts and 80% Refundable ERC721C NFT Contracts

Refundable NFT collection contract means anyone can mint NFTs and pay for them, the NFT holder can refund their NFT anytime and get a 80% refund

## Functions

1. `name` - Name of collection

2. `symbol` - Symbol of collection

3. `baseURI` - Base metadata uri of collection

4. `maxMintSupply` - Total supply of NFT to mints

5. `mintPrice` - Price per NFT (in NRG)

6. `maxUserMintAmount` - Max mintable amount per user

7. `maxTxMintAmount` -  Max mintable amount per tx

8. `mintedAmount` - Total minted NFT

9. `presaleActive` - Presale status

10. `publicsaleActive` - Publicsale status

11. `presaleMintPrice` - Price per NFT in presale

12. `presaleMaxUserMintAmount` - Max mintable amount per user in presale

13. `presaleMaxTxMintAmount` - Max mintable amount per tx in presale

14. `numberMinted` - Total user amount minted

15. `presaleNumberMinted` Total user amount minted in presale

16. `isOwnerMint` - If the NFT was freely minted by owner

17. `whitelists` - If address is whitelist or not

18. `mint` - Mints NFT to user 
- Caller cannot be contract
- Public sale must be active
- Value sent must be correct
- Total user amount minted cannot be above max user mint amount
- Total number minted cannot be above max mint supply
- 20% of value goes to owner

19. `presaleMint` - Allows whitelist address to  to mint
- Caller cannot be contract
- Presale must be active
- Value sent must be correct
- Sender must be whitelisted
- Total user amount minted cannot be above presale max user mint amount
- Total number minted cannot be above max mint supply

20. `ownerMint` - Allows owner to mint
- The caller must be the owner
- Total number minted cannot be above max mint supply

21. `refund` - Refunds NFT, burn token and send corresponding 80% NRG to user
- The caller must own NFT

22. `setBaseURI` - Sets base uri

23. `publicsaleConfig` -  Sets public sale variables ~ mint price, max user mint amount, max tx mint amount and presale status

24. `presaleConfig` - Sets presale sale variables ~ mint price, max user mint amount, max tx mint amount and presale status

25. `addWhitelist` -  Witelist addresses for presale

26. `removeWhitelist` - Remove whitelist addresses from presale

27. `pause` - Pause mint

28. `unpause` - Unpause mint

29. `togglePresale` - Toggle presale status

30. `togglePublicsale` - Toggle public status



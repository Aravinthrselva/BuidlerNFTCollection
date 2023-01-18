const {ethers} = require("hardhat");
require("dotenv").config({path: ".env"});
const {WHITELIST_CONTRACT_ADDRESS, METADATA_URL} = require("../constants"); 

async function main() {

const whitelistContract = WHITELIST_CONTRACT_ADDRESS; // Address of the whitelist dapp contract 
const metadataURL = METADATA_URL;  // URL from where we can extract the metadata for a Crypto Dev NFT


const cryptoDevsContract  = await ethers.getContractFactory("CryptoDevs");

// deploying the contract, passing two values to the constructor of CryptoDevs contract

const deployedCryptoDevsContract = await cryptoDevsContract.deploy(metadataURL, whitelistContract); 

await deployedCryptoDevsContract.deployed(); // waiting for it to finish deploying

console.log("Address of the deployed contract : ", deployedCryptoDevsContract.address);


}


// call the main() and catch any errors 

main()
.then(() => process.exit(0))
.catch((err) => {
  console.log("Error shown: ", err);
  process.exit(1);
});

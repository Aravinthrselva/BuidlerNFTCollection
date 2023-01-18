//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";



 /**
      * baseTokenURI is for computing {tokenURI}. 
      * If set, the resulting URI for each
      * token will be the concatenation of the `baseURI` and the `tokenId`.
      */

contract CryptoDevs is ERC721Enumerable, Ownable {

    string _baseTokenURI;
    uint public _price = 0.01 ether;
    uint public maxTokenIds = 20;
    uint public tokenIds;

    bool public _paused;
    bool public presaleStarted;
    uint256 public presaleEndtime;

    IWhitelist whitelist;


    modifier onlyWhenNotPaused {
        require(!_paused, "Contract has been paused");
        _;
    }


 /**
      * @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
      * name in our case is `Crypto Devs` and symbol is `CD`.
      * Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.
      * It also initializes an instance of whitelist interface.
      */

constructor (string memory baseURI, address whitelistContract) ERC721("Web3 Buidler", "W3B-NFT") {
    _baseTokenURI = baseURI;
    whitelist = IWhitelist(whitelistContract);
}

function startPresale() public onlyOwner {
presaleStarted = true;

presaleEndtime = block.timestamp + 10 minutes;
} 

function presaleMint() public payable onlyWhenNotPaused {
    require(presaleStarted && block.timestamp < presaleEndtime , "Presale hasnt started yet");
    require(whitelist.whitelistedAddresses(msg.sender), "sorry, you are not allowlisted");
    require(tokenIds < maxTokenIds, "Uh..OH.. minted out");
    require(msg.value >= _price, "Not enough funds to cover mint price");

    tokenIds += 1;
   //_safeMint is a safer version of the _mint function as it ensures that
   // if the address being minted to is a contract, then it knows how to deal with ERC721 tokens
   // If the address being minted to is not a contract, it works the same way as _mint
    _safeMint(msg.sender, tokenIds);
}


    /**
    * @dev mint allows a user to mint 1 NFT per transaction after the presale has ended.
    */
function mint() public payable onlyWhenNotPaused {
    require(presaleStarted && block.timestamp >= presaleEndtime, "Wait, Presale ongoing");
    require(tokenIds < maxTokenIds, "AUh..OH.. minted out");
    require(msg.value >= _price, "Not enough funds to cover mint price");

    tokenIds += 1;
    _safeMint(msg.sender, tokenIds);
}


    /**
    * @dev _baseURI overides the Openzeppelin's ERC721 implementation which by default
    * returned an empty string for the baseURI
    */
function _baseURI() internal view virtual override returns (string memory) {
   return _baseTokenURI; 
}


    /**
    * setPaused is used to pause or unpause the contract in case of emergency
      */

function setPaused(bool val) public onlyOwner{
    _paused = val;
}

     /**
    * withdraw sends all the ether in the contract
    * to the owner of the contract
      */
function withdraw() public onlyOwner {

    address _owner = owner();
    uint256 amount = address(this).balance;

    (bool sent, ) = _owner.call{value:amount}("");
    require(sent, "ETH Send transaction failed");
}

// Function to receive Ether. msg.data must be empty
receive() external payable{}

// Fallback function is called when msg.data is present
fallback() external payable{}

}

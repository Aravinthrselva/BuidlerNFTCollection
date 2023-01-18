import Head from "next/head";
import {useState, useEffect, useRef} from "react";  
import {providers, Contract, utils} from "ethers";
import Web3Modal from "web3modal"
import styles from "../styles/Home.module.css";
import {NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI} from "../constants/index.js"
// import { get } from "http";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  
  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] =  useState(false);
  const [loading, setLoading] = useState(false);

  //_tokenIds is a `Big Number`. hence we track the number value as a string 
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");


  const getProviderOrSigner = async(needSigner = false) => {

    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();
    
    if(chainId !== 5) {
      window.alert("Please connect to Goerli Network");
      throw new Error("Not Connected to Goerli")
    }

    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };
  // The useEffect runs as the website is loaded and checks if the wallet is connected, and prompts the user to connect
  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  
  const getOwner = async() => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);   
      const _ownerAddress = await nftContract.owner();


      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);

      const signerAddress = await signer.getAddress();

      if(_ownerAddress.toLowerCase() === signerAddress.toLowerCase()) {
        setIsOwner(true);
      }
      
    } catch (err) {
      console.error(err);
    }
  }


  //Allow the owner to start the presale for the NFT Collection
  const startPresale = async() => {
    try{
       // signer is needed here since this is a 'write' transaction.
        const signer = await getProviderOrSigner(true);
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

        const tx = await nftContract.startPresale();
        setLoading(true);
        await tx.wait();
        setLoading(false);

        await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  const checkIfPresaleStarted = async() => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const _presaleStarted = await nftContract.presaleStarted();

      if(!_presaleStarted) {
       await getOwner();
      }

      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch(err) {
      console.error(err);
      return false;
    }
  };

  const checkIfPresaleEnded = async() => {
    try {
      const provider =  await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      // Date.now() returns time in milliseconds
      const _presaleEndtime = await nftContract.presaleEndtime();
      const currentTime = Math.floor (Date.now()/1000)
      // _presaleEndtime is a Big Number, so we are using the lt(less than function) instead of `<`
      const hasEnded = _presaleEndtime.lt(currentTime);

      if(hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch(err) {
      console.error(err);
      return false;
    }
  };

  // Mint an NFT during presale
  const presaleMint = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

       // call the presaleMint from the contract, only whitelisted addresses would be able to mint
      const tx = await nftContract.presaleMint({
        // value signifies the cost of one crypto dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted a buidler NFT to your wallet");

    } catch (err) {
      console.error(err);
    }
  };

  // Mint an NFT after the presale is over
  const publicMint = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const tx = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted a buidler NFT to your wallet");

    } catch(err) {
      console.error(err);
    }
  };

  //connectWallet: Connects the MetaMask wallet

  const connectWallet = async() => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    }
    catch(err) {
      console.log(err);
    }
  };


  const getTokenIdsMinted = async() => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const _tokenIdsminted = await nftContract.tokenIds();

      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIdsminted.toString());

    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if(!walletConnected) {

      web3ModalRef.current = new Web3Modal({
        network : "goerli",
        providerOptions : {},
        disableInjectedProvider: false,
      });

      connectWallet();
    // check if presale has started and ended 
     const _presaleStarted = checkIfPresaleStarted();
     if(_presaleStarted){
      checkIfPresaleEnded();
     }
     getTokenIdsMinted();

    // Set an interval which gets called every 5 seconds to check presale has ended 

    const presaleCheckInterval = setInterval(async function () {
      const _presaleStarted = await checkIfPresaleStarted();
      if(_presaleStarted) {
        const _presaleEnded = await checkIfPresaleEnded();
        if(_presaleEnded) {
          clearInterval(presaleCheckInterval);
        }
      }

    }, 5 * 1000);

    setInterval(async function () {
      await getTokenIdsMinted();      
    }, 5 *1000);
  }
  }, [walletConnected]);



  const renderButton = () => {


    if(!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect Wallet
        </button>
      );
    }

    if(loading) {
      return( 
      <button className={styles.button}>
        Loading...
      </button>
      );
       
    }

    if(isOwner && !presaleStarted) {
       return(
        <button className={styles.button} onClick={startPresale}>
          Start Presale
        </button>
       );
    }

    if(!presaleStarted) {
      return(
        <div className={styles.description}>
          Hold your horses degen, Presale hasn't started yet 😎
        </div>
      );
    }

    if(presaleStarted && !presaleEnded) {
      return(
        <div>
        <div className={styles.description}>
          Presale is live. You can mint your Buidler NFT, if your address is on the Allowlist 📃
        </div>
        <button className={styles.button} onClick={presaleMint}>
          Presale Mint 💦
        </button>
        </div>
      );

    }

    if(presaleStarted && presaleEnded) {
      return(
        <div>
        <div className={styles.description}>
          Public Sale has started. Crank up that gas bruh ☝
        </div>
        <button className={styles.button} onClick={publicMint}>
          Public Mint
        </button>
        </div>
      );

    }
  };

  return (
  <div>
    <Head>
      <title> Buidler </title>
      <meta name="description" content="Whitelist-Dapp"/>
      <link rel="icon" href="/favicon.ico"/>
    </Head>
    <div className={styles.main} >
      <div>
        <h1 className={styles.title}>
          Hey BUIDLER!
        </h1>
        <div className={styles.description}>
          We know you want to join the Web3 Revolution 👇
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/20 Minted
        </div>
        {renderButton()}
      </div>
      <div>
      <img className={styles.img} src="./cryptoDevs/1.svg"/>
      </div>
   </div>
   <footer className={styles.footer}>
    Built with 💛 by AvantGard
   </footer>

  </div>
  );

}
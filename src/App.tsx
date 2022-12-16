// importfunctionalities
import React from 'react';
import logo from './logo.svg';
import './App.css';
import {  
  Keypair,
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { error } from 'console';
import { errorMonitor } from 'stream';
window.Buffer = window.Buffer || require("buffer").Buffer;

 // create types
type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

/**
 * @description gets Phantom provider, if it exists
 */
const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");       
const newPair = new Keypair();
const privateKey = newPair.secretKey;
const sourceWallet = Keypair.fromSecretKey(privateKey);

function App() { 
  // create state variable for the provider
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );  

  // create state variable for the Phantom wallet key
  const [walletKey, setWalletKey] = useState<PhantomProvider | undefined>(
    undefined
  );

  // create state variable for the source wallet
  const [sourceWalletBalance, setSourceWalletBalance] = useState(
    0
  );
  
  // create state variable for the target wallet
  const [targetWalletBalance, setTargetWalletBalance] = useState(
    0
  );

  // create state variable to disable or enable the button
  const [buttonEnabled, setbuttonEnabled] = useState(
    true
  );

  // create state variable to disable or enable the button
  const [isError, setIsError] = useState(
    false
  );

  // this is the function that runs whenever the component updates (e.g. render, refresh)
  useEffect(() => {
    const provider = getProvider();

    // if the phantom provider exists, set this as the provider
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  /**
   * @description prompts user to create a new Solana account and Airdrop 2 SOL.
   * This function is called when the connect create a new Solana account is clicked
   */
  const createAccount = async () => {    
      try {
        setIsError(false);

        setbuttonEnabled(false);

        const sourceBeforeAirdropWalletBalance = await connection.getBalance(sourceWallet.publicKey);
        setSourceWalletBalance(sourceBeforeAirdropWalletBalance);

        const sourceAirDropSignature = await connection.requestAirdrop(
            new PublicKey(sourceWallet.publicKey),
            2 * LAMPORTS_PER_SOL
        );

        // Latest blockhash (unique identifer of the block) of the cluster
        let latestBlockHash = await connection.getLatestBlockhash();

        // Confirm transaction using the last valid block height (refers to its time)
        // to check for transaction expiration
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: sourceAirDropSignature
        });

        const sourceAfterAirdropWalletBalance = await connection.getBalance(sourceWallet.publicKey);
        setSourceWalletBalance(sourceAfterAirdropWalletBalance);

        setbuttonEnabled(true);
      } catch (error) {
        setIsError(true);

        setbuttonEnabled(true);
      }
  };

  /**
   * @description prompts user to connect wallet if it exists.
   * This function is called when the connect wallet button is clicked
   */
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

    // checks if phantom wallet exists
    if (solana) {
      try {
        const response = await solana.connect();
        
        setIsError(false);

        setbuttonEnabled(false);

        const sourceBeforeConnectWalletBalance = await connection.getBalance(sourceWallet.publicKey);
        setSourceWalletBalance(sourceBeforeConnectWalletBalance);

        setWalletKey(response.publicKey.toString());

        const sourceAfterConnectWalletBalance = await connection.getBalance(sourceWallet.publicKey);
        setSourceWalletBalance(sourceAfterConnectWalletBalance);
        
        const targetWallet = new PublicKey(response.publicKey.toString());
        const targetAfterConnectWalletBalance = await connection.getBalance(targetWallet);
        setTargetWalletBalance(targetAfterConnectWalletBalance);

        setbuttonEnabled(true);
      } catch (error) {
        setIsError(true);

        setbuttonEnabled(true);
      }
    }
  };

  /**
   * @description prompts user to transfer to new wallet.
   * This function is called when the transfer to new wallet is clicked
   */
   const performTransaction = async () => {
    // @ts-ignore
    const { solana } = window;

    // checks if phantom wallet exists
    if (solana) {
      try {
        const response = await solana.connect();
        const targetWallet = new PublicKey(response.publicKey.toString());

        setIsError(false);

        setbuttonEnabled(false);

        const sourceBeforeTransferWalletBalance = await connection.getBalance(sourceWallet.publicKey);
        setSourceWalletBalance(sourceBeforeTransferWalletBalance);

        var transaction = new Transaction().add(
          SystemProgram.transfer({
              fromPubkey: sourceWallet.publicKey,
              toPubkey: targetWallet,
              lamports: LAMPORTS_PER_SOL / 800
          })
        );

        // Sign transaction
        var signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [sourceWallet]
        );

        const sourceAfterTransferWalletBalance = await connection.getBalance(sourceWallet.publicKey);
        setSourceWalletBalance(sourceAfterTransferWalletBalance);
 
        const targetAfterTransferWalletBalance = await connection.getBalance(targetWallet);
        setTargetWalletBalance(targetAfterTransferWalletBalance);

        setbuttonEnabled(true);
      } catch (error) {
        setIsError(true);

        setbuttonEnabled(true);
      }
    }
  };

  // HTML code for the app
  return (
    <div className="App">
      <header className="App-header">
        <h2>Perform a connection, airdrop & transfer to a Phantom Wallet</h2>
      </header>

      {provider && !walletKey && sourceWalletBalance === 0 && buttonEnabled == true && (
        <button
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={createAccount}
        >
          Create a new Solana account
        </button>
      )}

      {provider && !walletKey && sourceWalletBalance === 0 && buttonEnabled == false && (
        <button disabled 
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
        >
          Create a new Solana account
        </button>
      )}

      {provider && !walletKey && sourceWalletBalance > 0 && buttonEnabled == true && (
        <button
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}

      {provider && !walletKey && sourceWalletBalance > 0 && buttonEnabled == false && (
        <button disabled
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
        >
          Connect Wallet
        </button>
      )}

      {provider && walletKey && sourceWalletBalance > 0 && buttonEnabled == true && (
        <button
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={performTransaction}
        >
          Transfer to Phantom Wallet
        </button>
      )}

      {provider && walletKey && sourceWalletBalance > 0 && buttonEnabled == false && (
        <button disabled
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
        >
          Transfer to Phantom Wallet
        </button>
      )}

      {!provider && (
        <p>
          No provider found. Install{" "}
          <a href="https://phantom.app/">Phantom Browser extension</a>
        </p>
      )}

      <p>BAL: {sourceWalletBalance / LAMPORTS_PER_SOL} SOL</p>
      <p>PHANTOM BAL: {targetWalletBalance / LAMPORTS_PER_SOL} SOL</p>

      <p>{isError == true && sourceWalletBalance === 0 && buttonEnabled == true && (
        "An error occurred while performing a connection or Airdrop!"
        )}
      </p>

      <p>{isError == true && provider && !walletKey && sourceWalletBalance > 0 && buttonEnabled == true && (
        "An error occurred while connecting to Phantom Wallet!"
        )}
      </p>

      <p>{isError == true && provider && walletKey && sourceWalletBalance > 0 && buttonEnabled == true && (
        "An error occurred while transferring SOL to Phantom Wallet!"
        )}
      </p>
    </div>    
  );
}

export default App;

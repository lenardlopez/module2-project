import {
  Keypair,
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

/**
 * Connecion to the network
 */
let connection: Connection;

/**
* Keypair associated to the fees' payer
*/
let payer: Keypair;

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<void> {
// export async function establishConnection() {
    // Step 1: Connect to the Solana Devnet
    /* Get the connection object and retrieve the 
     version from the connection object. */

    //Insert the Step 1 code from the tutorial here
    // Step 1: Connect to the Solana Devnet
    connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', version);
    // return connection;
}

/**
 * Generate an account to pay for everything
 */
export async function establishPayer(): Promise<void> {
// export async function establishPayer() {
    //Step 2: Generate a keypair - this would be an account that pays for the calls to the program

    //Insert the Step 2 code from the tutorial here
    payer = Keypair.generate();
    console.log("Public Key of Payer is:", payer.publicKey);

    //Step 3: Requesting an airdrop

    //Insert the Step 3 code from the tutorial here
    //Step 3: Requesting an airdrop
    const sig = await connection.requestAirdrop(
        payer.publicKey,
        2 * LAMPORTS_PER_SOL,
    );

    await connection.confirmTransaction(sig);

    console.log(
        'Using account',
        payer.publicKey.toBase58(),
        'containing',
        2 * LAMPORTS_PER_SOL,
        'SOL to pay for fees',
    );
    // return connection;
}

/**
 * Check if the hello world BPF program has been deployed
 */
// export async function checkProgram(conn: Connection, fromPubKey: PublicKey, toPubkey: PublicKey): Promise<void> {
// export async function checkProgram(toPubkey: PublicKey): Promise<void> {
export async function checkProgram(): Promise<void> {        
    // Send money from "from" wallet and into "to" wallet
    console.log('1');
    let toPubkey = Keypair.generate().publicKey;
    var transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: toPubkey,
            lamports: LAMPORTS_PER_SOL / 2000
        })
    );
    console.log('2');
    // Sign transaction
    var signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
    );
    console.log('Signature is ', signature);

    const fromFinalWalletBalance = await connection.getBalance(
        payer.publicKey
    );
    console.log(`5) from Wallet balance: ${parseInt(fromFinalWalletBalance.toString()) / LAMPORTS_PER_SOL} SOL`);

    const toFinalWalletBalance = await connection.getBalance(
        toPubkey
    );
    console.log(`6) to Wallet balance: ${parseInt(toFinalWalletBalance.toString()) / LAMPORTS_PER_SOL} SOL`);

}
  
import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import * as fs from "fs";
import bs58 from "bs58";
import * as path from "path";

async function main() {
    console.log("Setting up MediChain (MCI) Dummy Token on Solana Devnet...");

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Generate a new keypair for the "server" or "admin" wallet that will mint the tokens
    const payer = Keypair.generate();
    console.log(`Generated new admin wallet address: ${payer.publicKey.toBase58()}`);
    console.log(`Private Key (keep secret!): ${bs58.encode(payer.secretKey)}`);

    // Airdrop SOL so it can pay for fees
    console.log("Requesting Airdrop of 1 SOL for fees...");
    try {
        const signature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature, 'confirmed');
        console.log("Airdrop successful!");
    } catch (e) {
        console.error("Airdrop failed. Devnet faucet might be rate limited.", e);
        console.log("Please manually fund the wallet using https://faucet.solana.com/");
        return;
    }

    // Create the SPL Token
    console.log("Creating new SPL token mint...");
    const mint = await createMint(
        connection,
        payer, // Payer of the transaction
        payer.publicKey, // Account that will control the minting
        null, // Account that will control the freezing of tokens
        9 // Decimals
    );

    console.log(`Token Mint Address: ${mint.toBase58()}`);

    // Update .env file
    const envPath = path.resolve(__dirname, '../.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Check if variables already exist
    const mintRegex = /NEXT_PUBLIC_MCI_TOKEN_MINT=(.*)/;
    const adminKeyRegex = /SOLANA_ADMIN_PRIVATE_KEY=(.*)/;

    if (mintRegex.test(envContent)) {
        envContent = envContent.replace(mintRegex, `NEXT_PUBLIC_MCI_TOKEN_MINT=${mint.toBase58()}`);
    } else {
        envContent += `\nNEXT_PUBLIC_MCI_TOKEN_MINT=${mint.toBase58()}`;
    }

    if (adminKeyRegex.test(envContent)) {
        envContent = envContent.replace(adminKeyRegex, `SOLANA_ADMIN_PRIVATE_KEY=${bs58.encode(payer.secretKey)}`);
    } else {
        envContent += `\nSOLANA_ADMIN_PRIVATE_KEY=${bs58.encode(payer.secretKey)}`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log(".env file updated successfully with NEXT_PUBLIC_MCI_TOKEN_MINT and SOLANA_ADMIN_PRIVATE_KEY.");
    console.log("Done!");
}

main().catch(console.error);

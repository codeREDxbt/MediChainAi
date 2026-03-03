import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/jwt";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import bs58 from "bs58";

export async function POST(req: Request) {
    try {
        const token = (await cookies()).get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = getJwtSecret();
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.sub as string;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.walletAddress) {
            return NextResponse.json({ error: "Wallet not found for user" }, { status: 400 });
        }

        // Solana Reward Logic
        const { amount } = await req.json();

        if (!amount || typeof amount !== 'number') {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        const adminKeyBase58 = process.env.SOLANA_ADMIN_PRIVATE_KEY;
        const testMintStr = process.env.NEXT_PUBLIC_MCI_TOKEN_MINT;

        if (!adminKeyBase58 || !testMintStr) {
            return NextResponse.json({ error: "Server Solana keys not configured" }, { status: 500 });
        }

        const adminKeypair = Keypair.fromSecretKey(bs58.decode(adminKeyBase58));
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const mint = new PublicKey(testMintStr);
        const recipient = new PublicKey(user.walletAddress);

        // Calculate actual units (9 decimals standard for SPL)
        const tokenAmount = amount * Math.pow(10, 9);

        // Get or Create the Associated Token Account for the User
        const userAta = await getOrCreateAssociatedTokenAccount(
            connection,
            adminKeypair, // Payer
            mint,
            recipient
        );

        // Mint token directly to User ATA
        const signature = await mintTo(
            connection,
            adminKeypair,
            mint,
            userAta.address,
            adminKeypair.publicKey, // Mint authority
            tokenAmount
        );

        return NextResponse.json({
            success: true,
            message: `Airdropped ${amount} MCI`,
            txHash: signature
        });

    } catch (error: any) {
        console.error("Airdrop Error:", error);
        return NextResponse.json({ error: "Failed to airdrop tokens", details: error.message }, { status: 500 });
    }
}

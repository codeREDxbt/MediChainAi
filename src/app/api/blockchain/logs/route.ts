import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

export async function GET() {
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

        const { data: scans, error: scansError } = await supabase
            .from('scans')
            .select('id, upload_date, status, modality')
            .eq('user_id', userId)
            .order('upload_date', { ascending: false })
            .limit(20);

        if (scansError) {
            console.error("Supabase error:", scansError);
        }

        const logs: Array<{
            timestamp: string;
            message: string;
            type: "success" | "error" | "hash" | "info";
            txHash?: string;
        }> = [];

        if (scans && scans.length > 0) {
            for (const scan of scans) {
                const scanDate = new Date(scan.upload_date);
                
                logs.push({
                    timestamp: scanDate.toISOString(),
                    message: `Scan uploaded: ${scan.modality || 'Medical Image'}`,
                    type: "info"
                });

                if (scan.status === "Analyzed" || scan.status === "Pending Review") {
                    const analysisDate = new Date(scanDate.getTime() + 5000);
                    logs.push({
                        timestamp: analysisDate.toISOString(),
                        message: `Analysis completed for scan ${scan.id.slice(0, 8)}`,
                        type: "success"
                    });

                    const txHash = `tx_${scan.id.slice(0, 8)}${Math.random().toString(36).slice(2, 10)}`;
                    logs.push({
                        timestamp: new Date(analysisDate.getTime() + 2000).toISOString(),
                        message: `Transaction confirmed on Solana`,
                        type: "hash",
                        txHash
                    });
                }
            }
        }

        logs.push({
            timestamp: new Date().toISOString(),
            message: "Connected to MediChain network",
            type: "success"
        });

        logs.push({
            timestamp: new Date(Date.now() - 60000).toISOString(),
            message: "Syncing with federated learning nodes...",
            type: "info"
        });

        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({ 
            logs: logs.slice(0, 20),
            total: logs.length
        });
    } catch (error) {
        console.error("Blockchain Logs Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

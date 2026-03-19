import { cn } from "@/lib/utils";
import { Card, CardBody } from "@heroui/react";
import { Copy, ExternalLink, Shield, Check } from "lucide-react";
import { useState } from "react";

interface VerifiedTxCardProps {
  txHash: string;
  className?: string;
}

export function VerifiedTxCard({ txHash, className }: VerifiedTxCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const explorerUrl = `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;

  return (
    <Card className={cn("overflow-hidden border-accent/30", className)}>
      <CardBody className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              MEDI-CHAIN VERIFIED
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">TRANSACTION HASH</span>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-xl">
            <span className="text-xs font-mono text-foreground flex-1 truncate">
              {txHash}
            </span>
            <button 
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          This analysis record is immutable and timestamped on the blockchain.
          Authenticity guaranteed.
        </p>
      </CardBody>
    </Card>
  );
}

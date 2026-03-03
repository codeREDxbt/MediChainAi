"use client";

import { Button } from "@heroui/react";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
            <div className="text-center space-y-6 px-4">
                <h1 className="text-6xl font-bold text-foreground">500</h1>
                <h2 className="text-2xl font-semibold text-muted-foreground">
                    Server Error
                </h2>
                <p className="text-lg text-muted-foreground max-w-md">
                    Something went wrong. Our team has been notified.
                </p>
                <div className="flex gap-4 justify-center pt-4">
                    <Button
                        color="primary"
                        size="lg"
                        onPress={() => reset()}
                    >
                        Try Again
                    </Button>
                    <Button
                        variant="bordered"
                        size="lg"
                        onPress={() => window.location.href = "/auth"}
                    >
                        Go Home
                    </Button>
                </div>
                {process.env.NODE_ENV === "development" && error.message && (
                    <div className="mt-6 p-4 bg-destructive/10 rounded-lg text-left">
                        <p className="text-sm font-mono text-destructive">{error.message}</p>
                    </div>
                )}
            </div>
        </main>
    );
}

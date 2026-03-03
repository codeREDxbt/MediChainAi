import Link from "next/link";

export const metadata = {
    title: "Page Not Found - MediChainAI",
    description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
            <div className="text-center space-y-6 px-4">
                <h1 className="text-6xl font-bold text-foreground">404</h1>
                <h2 className="text-2xl font-semibold text-muted-foreground">
                    Page Not Found
                </h2>
                <p className="text-lg text-muted-foreground max-w-md">
                    The page you're looking for doesn't exist. It might have been moved or deleted.
                </p>
                <div className="flex gap-4 justify-center pt-4">
                    <Link
                        href="/auth"
                        className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-500 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-emerald-500/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                    >
                        Return to Home
                    </Link>
                    <Link
                        href="/auth"
                        className="inline-flex h-11 items-center justify-center rounded-md border border-slate-700 bg-transparent px-8 text-sm font-medium shadow-sm transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </main>
    );
}

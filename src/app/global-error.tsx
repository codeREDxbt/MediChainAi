"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <main className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
                    <div className="text-center space-y-6">
                        <h1 className="text-4xl font-bold">Critical Error</h1>
                        <p className="text-slate-400">
                            A critical error occurred while rendering the application. Please refresh the page.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </main>
            </body>
        </html>
    );
}

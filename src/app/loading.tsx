"use client";

import { MultiStepLoader } from "@/components/ui/multi-step-loader";

const loadingStates = [
    { text: "Initializing secure connection..." },
    { text: "Verifying blockchain ledger..." },
    { text: "Connecting to federated nodes..." },
    { text: "Loading user profile..." }
];

export default function GlobalLoading() {
    return (
        <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center">
            <MultiStepLoader
                loadingStates={loadingStates}
                loading={true}
                duration={1000}
                loop={true}
            />
        </div>
    );
}

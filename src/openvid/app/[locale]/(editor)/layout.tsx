"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { RecordingProvider } from "@/hooks/RecordingContext";
import RecordingOverlay from "../../components/ui/RecordingOverlay";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <RecordingProvider>
                <div className="min-h-screen bg-neutral-950">
                    {children}
                </div>
                <RecordingOverlay />
            </RecordingProvider>
        </AuthProvider>
    );
}

import Header from "@/app/components/common/Header";
import RecordingOverlay from "@/app/components/ui/RecordingOverlay";
import { RecordingProvider } from "@/hooks/RecordingContext";
import { AuthProvider } from "@/hooks/useAuth";
import "../../globals.css";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <RecordingProvider>
                <div className="flex h-screen flex-col text-neutral-300 bg-gradient-radial-primary overflow-hidden">
                    <Header />
                    <main className="flex-1 w-full overflow-hidden">
                        {children}
                    </main>
                </div>
                <RecordingOverlay />
            </RecordingProvider>
        </AuthProvider>
    );
}

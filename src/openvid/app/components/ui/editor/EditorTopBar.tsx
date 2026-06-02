"use client";

import { Icon } from "@iconify/react";
import { ExportDropdown } from "../ExportDropdown";
import type { ExportQuality, ExportProgress } from "@/types";
import type { EditorMode } from "@/types/editor-mode.types";
import { useEffect, useState } from "react";

import { gooeyToast } from "goey-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { TooltipAction } from "@/components/ui/tooltip-action";
import { useCredits } from "@/hooks/useCredits";
import { UpgradeModal } from "../UpgradeModal";
import { ShinyText } from "@/components/ui/ShinyText";
import { createClient } from "@/utils/supabase/client";


interface ImageExportProgress {
    status: "idle" | "preparing" | "rendering" | "complete" | "error";
    progress: number;
    message: string;
}

interface EditorTopBarProps {
    onExport: (quality: ExportQuality) => void;
    exportProgress: ExportProgress;
    hasTransparentBackground?: boolean;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    // Photo mode props
    editorMode?: EditorMode;
    onImageExport?: (format: ImageExportFormat, quality: number, scale: number) => void;
    imageExportProgress?: ImageExportProgress;
    canvasWidth?: number;
    canvasHeight?: number;
    onDownloadOriginal?: () => void;
}

export function EditorTopBar({
    onExport,
    exportProgress,
    hasTransparentBackground,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    editorMode = "video",
    onImageExport,
    imageExportProgress,
    canvasWidth = 1920,
    canvasHeight = 1080,
    onDownloadOriginal,
}: EditorTopBarProps) {

    const isPhotoMode = editorMode === "photo";
    const t = useTranslations("editor.topBar");
    // Removed local showAlert and prevStatus state since gooeyToast is handled globally
    const { user, profile, signOut, loading } = useAuth();
    const { credits } = useCredits();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const isPremium = credits?.tier === "premium";
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSignIn = async () => {
        setIsLoggingIn(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
            if (error) {
                console.error("Sign in error:", error);
                gooeyToast.error("Failed to sign in. Please try again.");
            } else {
                gooeyToast.success("Signed in successfully!");
            }
        } catch (error) {
            console.error("Sign in error:", error);
            gooeyToast.error("An unexpected error occurred during sign in.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            window.location.href = window.location.pathname === '/' ? '/index.html?page=home' : window.location.pathname + '?page=home';
        } catch (error) {
            console.error("Error signing out:", error);
            setIsLoggingOut(false);
        }
    };

    const meta = user?.user_metadata || {};
    const displayName =
        profile?.first_name ||
        profile?.full_name ||
        user?.name ||
        meta.full_name ||
        meta.name ||
        user?.email?.split("@")[0] ||
        t("auth.defaultUser");

    const avatarUrl =
        profile?.avatar_url ||
        user?.avatar ||
        user?.picture ||
        meta.avatar_url ||
        meta.picture ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

    const provider = profile?.provider || meta.provider || "email";

    useEffect(() => {
        if (exportProgress.status === "error") {
            gooeyToast.error(t("exportError.title") || "Error exporting", { 
                description: `${exportProgress.message || ""}. ${t("exportError.tip") || ""}` 
            });
        }
    }, [exportProgress.status, exportProgress.message, t]);

    return (
        <div className="h-13 border-b border-white/10 flex items-center justify-between px-3 shrink-0 relative">
            <div className="flex-1"></div>

            <div className="flex items-center ml-auto">
                <div className="flex items-center gap-2 border-r border-white/10 pr-3">
                    <TooltipAction label={canUndo ? t("history.undo") : t("history.noUndo")}>
                        <button
                            onClick={onUndo}
                            disabled={!canUndo}
                            className={`transition-colors ${canUndo ? "hover:text-white text-white/70" : "opacity-30 cursor-not-allowed text-white/30"
                                }`}
                        >
                            <Icon icon="mdi:undo" width="20" />
                        </button>
                    </TooltipAction>
                    <TooltipAction label={canRedo ? t("history.redo") : t("history.noRedo")}>
                        <button
                            onClick={onRedo}
                            disabled={!canRedo}
                            className={`transition-colors ${canRedo ? "hover:text-white text-white/70" : "opacity-30 cursor-not-allowed text-white/60"
                                }`}
                        >
                            <Icon icon="mdi:redo" width="20" />
                        </button>
                    </TooltipAction>
                </div>
                <ExportDropdown
                    onExport={onExport}
                    exportProgress={exportProgress}
                    hasTransparentBackground={hasTransparentBackground}
                    onDownloadOriginal={onDownloadOriginal}
                />


                {loading ? (
                    <div className="flex items-center gap-2 pl-3 border-l border-white/10 ml-1">
                        <div className="hidden sm:flex flex-col items-end gap-1.5">
                            <div className="w-16 h-2.5 bg-white/10 rounded-sm animate-pulse"></div>
                            <div className="w-24 h-2 bg-white/10 rounded-sm animate-pulse"></div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse border border-white/10 shrink-0"></div>
                    </div>
                ) : !user ? (
                    <div className="pl-3 border-l border-white/10 ml-1 flex items-center h-8">
                        <button
                            onClick={handleSignIn}
                            disabled={isLoggingIn}
                            className="text-sm font-medium text-white/80 hover:text-white transition-colors bg-transparent border-0 cursor-pointer outline-none flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {isLoggingIn && <Icon icon="svg-spinners:ring-resize" className="size-3.5" />}
                            {t("auth.signIn")}
                        </button>
                    </div>
                ) : (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className="flex items-center gap-2 pl-3 border-l border-white/10 ml-1 hover:opacity-80 transition-opacity focus:outline-none"
                                aria-label={t("auth.userMenu")}
                            >
                                <div className="h-8 w-8 rounded-full border border-white/10 bg-neutral-900 overflow-hidden shrink-0 relative">
                                    <Image src={avatarUrl} alt={displayName} fill sizes="32px" className="object-cover" unoptimized crossOrigin="anonymous" />
                                </div>
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className="min-w-55 bg-black border border-white/25 rounded-lg shadow-xl p-1 z-9999"
                                sideOffset={5}
                                align="end"
                            >
                                <div className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-white truncate">{displayName}</p>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded border leading-none font-bold uppercase tracking-wider shrink-0 ${
                                            isPremium 
                                                ? "bg-indigo-950 text-indigo-300 border-indigo-500/35" 
                                                : "bg-white/10 text-neutral-300 border-white/10"
                                        }`}>
                                            {isPremium ? "PRO" : "FREE"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 truncate mt-0.5">{user.email}</p>
                                    <p className="text-[10px] text-neutral-500 mt-1 capitalize">
                                        {t("auth.connectedWith", { provider })}
                                    </p>
                                </div>
                                
                                {!isPremium && (
                                    <DropdownMenu.Item asChild>
                                        <button
                                            onClick={() => setIsUpgradeModalOpen(true)}
                                            className="flex items-center justify-between w-full px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-white/5 rounded-lg transition-all cursor-pointer group outline-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon icon="solar:stars-bold" className="size-4 text-amber-400 group-hover:text-amber-300 transition-colors animate-pulse shrink-0" />
                                                <ShinyText
                                                    text={t("auth.upgradeToPro")}
                                                    speed={2}
                                                    color="hsl(0 0% 70% / 0.85)"
                                                    shineColor="#ffffff"
                                                    className="font-bold text-sm bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent"
                                                />
                                            </div>
                                            <Icon icon="solar:alt-arrow-right-linear" className="size-4 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
                                        </button>
                                    </DropdownMenu.Item>
                                )}



                                <DropdownMenu.Item asChild>
                                    <button
                                        onClick={handleSignOut}
                                        disabled={isLoggingOut}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Icon icon="solar:logout-2-linear" className="size-4" />
                                        {isLoggingOut ? t("auth.signingOut") : t("auth.signOut")}
                                    </button>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                )}
            </div>

            {/* Premium Upgrade Modal */}
            <UpgradeModal
                open={isUpgradeModalOpen}
                onOpenChange={setIsUpgradeModalOpen}
                userEmail={user?.email}
                userId={user?.id}
            />
        </div>
    );
}
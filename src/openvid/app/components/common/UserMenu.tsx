"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/useAuth";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useCredits } from "@/hooks/useCredits";
import { UpgradeModal } from "@/app/components/ui/UpgradeModal";

import { AnimatePresence } from "framer-motion";
import { SupportActionSheet } from "./SupportActionSheet";
import { ShinyText } from "@/components/ui/ShinyText";


export function UserMenu() {
  const t = useTranslations('userMenu');
  const { user, profile, signOut, loading } = useAuth();
  const { credits } = useCredits();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);

  const isPremium = credits?.tier === "premium";

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 h-11">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 animate-pulse border border-white/5 shrink-0"></div>
        <div className="hidden sm:block w-24 h-4 rounded-md bg-white/10 animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4 h-11">
        <Button variant="primary" asChild>
          <Link
            href="/login"
            className="text-md font-medium text-white hover:text-white/90 transition-colors"
          >
            {t('login')}
          </Link>
        </Button>
      </div>
    );
  }

  const meta = user.user_metadata || {};
  const displayName = profile?.first_name || profile?.full_name || user.name || meta.full_name || meta.name || user.email?.split("@")[0] || t('defaultUser');
  const avatarUrl = profile?.avatar_url || user.avatar || user.picture || meta.avatar_url || meta.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;
  const provider = profile?.provider || meta.provider || "email";

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 rounded-full hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label={t('ariaLabel')}
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
              <Image src={avatarUrl} alt={displayName} fill sizes="36px" className="object-cover" crossOrigin="anonymous" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 leading-none shrink-0">
              <span className="text-sm font-medium text-neutral-300 max-w-25 truncate">
                {displayName}
              </span>
              {isPremium && (
                <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded border border-indigo-400/30 leading-none font-bold uppercase tracking-wider shrink-0 select-none">
                  PRO
                </span>
              )}
            </div>
            <Icon icon="solar:alt-arrow-down-linear" className="hidden sm:block size-4 text-neutral-400" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-50 bg-black border border-white/25 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            sideOffset={8}
            align="end"
          >
            <div className="px-3 py-2 mb-1">
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
                {t('connectedWith', { provider })}
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
                      text={t('upgradeToPro')}
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
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer outline-none"
              >
                <Icon icon="hugeicons:home-11" className="size-4" aria-hidden="true" />
                {t('home')}
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/editor"
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer outline-none"
              >
                <Icon icon="solar:video-frame-cut-2-linear" className="size-4" aria-hidden="true" />
                <span>{t('editor')}</span>
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setShowSupportSheet(true)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer outline-none"
            >
              <Icon icon="solar:help-outline" className="size-4" aria-hidden="true" />
              <span>{t('helpSupport')}</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/privacy"
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer outline-none"
              >
                <Icon icon="solar:document-text-outline" className="size-4" aria-hidden="true" />
                <span>{t('privacyLicense')}</span>
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={handleSignOut}
              disabled={isLoggingOut}
              className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" className="size-4" aria-hidden="true" />
                  <span>{t('loggingOut')}</span>
                </>
              ) : (
                <>
                  <Icon icon="solar:logout-2-linear" className="size-4" aria-hidden="true" />
                  <span>{t('logout')}</span>
                </>
              )}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Premium Upgrade Modal */}
      <UpgradeModal
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        userEmail={user?.email}
        userId={user?.id}
      />

      {/* Help & Support Sheet */}
      <AnimatePresence>
        {showSupportSheet && (
          <SupportActionSheet
            user={user}
            displayName={displayName}
            onClose={() => setShowSupportSheet(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
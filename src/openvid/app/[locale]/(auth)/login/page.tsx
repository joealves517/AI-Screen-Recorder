"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Link, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

type OAuthProvider = "google" | "github" | "twitch";

interface ProviderConfig {
  name: string;
  icon: string;
  provider: OAuthProvider;
  bgClass: string;
  iconColor?: string;
}

const providers: ProviderConfig[] = [
  {
    name: "Google",
    icon: "material-icon-theme:google",
    provider: "google",
    bgClass: "border-white/10 bg-transparent hover:bg-white/5",
  }
];

const column1Images = [
  "/images/scroll/vscode.avif",
  "/images/scroll/shadcn.avif",
  "/images/carousel/images/dash-dark.avif",
  "/images/scroll/magic.avif",
  "/images/scroll/lumina.avif",
];

const column2Images = [
  "/images/scroll/godly.avif",
  "/images/carousel/images/openvid.avif",
  "/images/scroll/daily.avif",
  "/images/scroll/onyx.avif",
  "/images/scroll/hapyrobot.avif",
];

export default function Login() {
  const t = useTranslations('login');
  const router = useRouter();
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const col1Extended = [...column1Images, ...column1Images];
  const col2Extended = [...column2Images, ...column2Images];

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    try {
      setLoading(provider);
      setError(null);

      // Invoke local mock auth client
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider
      });

      if (signInError) {
        throw signInError;
      }

      // Local mock login succeeded! Wait a bit for realistic loading visual, then redirect to home
      setTimeout(() => {
        router.push('/');
      }, 800);
      
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err);
      setError(
        err instanceof Error
          ? err.message
          : t('errors.generic')
      );
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] grid lg:grid-cols-2 text-white selection:bg-white/30" role="main">
      <div className="relative flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32">

        <div className="absolute top-8 left-8 sm:left-12 lg:left-16">
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-500 hover:text-white hover:bg-white/5 tracking-wide text-xs uppercase"
            asChild
          >
            <Link href="/">
              <Icon icon="solar:arrow-left-linear" className="mr-2" width="16" />
              {t('backToHome')}
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-sm mx-auto mt-16 lg:mt-0">
          <div className="mb-10">
            <Image src="/images/logo-vidflow.png" alt="VidFlow logo" width={60} height={60} className="mb-4" />
            <h1 className="text-3xl sm:text-4xl font-light tracking-tighter text-white mb-3">
              {t('title')}
            </h1>
            <p className="text-neutral-300 text-md font-light tracking-wide">
              {t('subtitle')}
            </p>
          </div>

          <div className="space-y-4" role="group" aria-label={t('providers.groupLabel') || 'Sign in options'}>
            {providers.map((providerConfig) => (
              <Button
                key={providerConfig.provider}
                onClick={() => handleOAuthSignIn(providerConfig.provider)}
                disabled={loading !== null}
                variant="outline"
                size="lg"
                className={`w-full h-12 gap-3 text-white transition-all font-light rounded-none ${providerConfig.bgClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={`${t(`providers.${providerConfig.provider}`)} sign in`}
              >
                {loading === providerConfig.provider ? (
                  <>
                    <Icon
                      icon="svg-spinners:ring-resize"
                      className="w-5 h-5"
                    />
                    <span>{t('providers.loading')}</span>
                  </>
                ) : (
                  <>
                    <Icon
                      icon={providerConfig.icon}
                      className={`${providerConfig.iconColor || 'text-white'} size-5`}
                    />
                    <span>{t(`providers.${providerConfig.provider}`)}</span>
                  </>
                )}
              </Button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded" role="alert" aria-live="polite">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <p className="mt-12 text-md text-neutral-300 leading-relaxed font-light">
            {t.rich('disclaimer', {
              terms: (chunks) => <Link href="/terms" target="_blank" className="text-neutral-300 hover:text-white underline decoration-white/30 underline-offset-4 transition-colors">{chunks}</Link>,
              privacy: (chunks) => <Link href="/privacy" target="_blank" className="text-neutral-300 hover:text-white underline decoration-white/30 underline-offset-4 transition-colors">{chunks}</Link>
            })}
          </p>
        </div>
      </div>
      
      {/* Sliding Image Grid columns marquee */}
      <div className="hidden lg:block relative w-full h-full border-l border-white/10 bg-[#020203] overflow-hidden" aria-hidden="true">
        {/* Style tag injected inside the container */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scrollUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          @keyframes scrollDown {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0); }
          }
          .animate-scroll-up {
            animation: scrollUp 45s linear infinite;
          }
          .animate-scroll-down {
            animation: scrollDown 45s linear infinite;
          }
          .animate-scroll-up:hover, .animate-scroll-down:hover {
            animation-play-state: paused;
          }
        `}} />

        {/* Ambient glow blobs */}
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-cyan-600/15 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Vertical fading mask to elegantly fade out grid items on top and bottom edges */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#020203] via-[#020203]/70 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020203] via-[#020203]/70 to-transparent z-20 pointer-events-none"></div>

        {/* Diagonal mesh pattern overlay for high-end feel */}
        <div className="absolute inset-0 bg-[radial-gradient(white_0.5px,transparent_0.5px)] bg-size-[40px_40px] opacity-[0.2] pointer-events-none z-10"></div>

        {/* Dual-column dynamic sliding marquee grid */}
        <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4 z-0">
          
          {/* Column 1: Scrolls Up */}
          <div className="flex flex-col gap-4 animate-scroll-up">
            {col1Extended.map((src, i) => (
              <div 
                key={`col1-${i}`}
                className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/5 bg-[#09090b] shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-[1.03] hover:border-white/20 group/item cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-10 pointer-events-none" />
                <img 
                  src={src} 
                  alt="" 
                  className="w-full h-full object-cover filter contrast-[1.05] brightness-[0.75] saturate-[1.05] group-hover/item:brightness-100 transition-all duration-500" 
                />
                <div 
                  className="absolute inset-0 z-15 pointer-events-none" 
                  style={{
                    background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.5) 100%)',
                    mixBlendMode: 'multiply'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Column 2: Scrolls Down */}
          <div className="flex flex-col gap-4 animate-scroll-down">
            {col2Extended.map((src, i) => (
              <div 
                key={`col2-${i}`}
                className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/5 bg-[#09090b] shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-[1.03] hover:border-white/20 group/item cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-10 pointer-events-none" />
                <img 
                  src={src} 
                  alt="" 
                  className="w-full h-full object-cover filter contrast-[1.05] brightness-[0.75] saturate-[1.05] group-hover/item:brightness-100 transition-all duration-500" 
                />
                <div 
                  className="absolute inset-0 z-15 pointer-events-none" 
                  style={{
                    background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.5) 100%)',
                    mixBlendMode: 'multiply'
                  }}
                />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
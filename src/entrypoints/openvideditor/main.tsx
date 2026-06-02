import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Home from '@/app/[locale]/(home)/page.tsx';
import HomeLayout from '@/app/[locale]/(home)/layout.tsx';
import Editor from '@/app/[locale]/(editor)/editor/page.tsx';
import EditorLayout from '@/app/[locale]/(editor)/layout.tsx';
import Login from '@/app/[locale]/(auth)/login/page.tsx';
import Privacy from '@/app/[locale]/(legal)/privacy/page.tsx';
import Terms from '@/app/[locale]/(legal)/terms/page.tsx';
import LegalLayout from '@/app/[locale]/(legal)/layout.tsx';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocale } from 'next-intl';
import '@/app/globals.css';
import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';

function AppRouter() {
  const [route, setRoute] = useState<'home' | 'editor' | 'login' | 'privacy' | 'terms'>(() => {
    // Detect route based on URL search params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (page === 'editor') return 'editor';
      if (page === 'login') return 'login';
      if (page === 'privacy') return 'privacy';
      if (page === 'terms') return 'terms';
    }
    return 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (page === 'editor') {
        setRoute('editor');
      } else if (page === 'login') {
        setRoute('login');
      } else if (page === 'privacy') {
        setRoute('privacy');
      } else if (page === 'terms') {
        setRoute('terms');
      } else {
        setRoute('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (newRoute: 'home' | 'editor' | 'login' | 'privacy' | 'terms', searchParams: string = '') => {
    let newUrl = `${window.location.pathname}?page=${newRoute}`;
    if (searchParams) {
      const cleanedParams = searchParams.startsWith('?') || searchParams.startsWith('&') 
        ? searchParams.substring(1) 
        : searchParams;
      newUrl += `&${cleanedParams}`;
    }
    window.history.pushState({}, '', newUrl);
    setRoute(newRoute);
    
    // Scroll to top of the page when navigating
    window.scrollTo(0, 0);
  };

  // Expose the navigate function globally so our mocked next/navigation can call it
  if (typeof window !== 'undefined') {
    (window as any).navigateExtension = navigate;
  }

  if (route === 'editor') {
    return (
      <EditorLayout>
        <TooltipProvider delayDuration={200}>
          <Editor />
        </TooltipProvider>
      </EditorLayout>
    );
  }

  if (route === 'login') {
    return (
      <TooltipProvider delayDuration={200}>
        <Login />
      </TooltipProvider>
    );
  }

  if (route === 'privacy') {
    return (
      <LegalLayout>
        <TooltipProvider delayDuration={200}>
          <Privacy />
        </TooltipProvider>
      </LegalLayout>
    );
  }

  if (route === 'terms') {
    return (
      <LegalLayout>
        <TooltipProvider delayDuration={200}>
          <Terms />
        </TooltipProvider>
      </LegalLayout>
    );
  }

  // Otherwise render the homepage landing layout
  const locale = useLocale();
  return (
    <HomeLayout>
      <TooltipProvider delayDuration={200}>
        <Home params={Promise.resolve({ locale })} />
      </TooltipProvider>
    </HomeLayout>
  );
}

// Add DOM container check for safe WXT build/prerender evaluation
if (typeof document !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    ReactDOM.createRoot(container).render(
      <React.StrictMode>
        <GooeyToaster position="top-center" theme="dark" duration={4000} bounce={0.1} />
        <AppRouter />
      </React.StrictMode>
    );
  }
}

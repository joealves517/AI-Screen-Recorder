import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Editor from '@/app/[locale]/(editor)/editor/page.tsx';
import EditorLayout from '@/app/[locale]/(editor)/layout.tsx';
import Login from '@/app/[locale]/(auth)/login/page.tsx';
import { TooltipProvider } from "@/components/ui/tooltip";
import '@/app/globals.css';
import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';

function AppRouter() {
  const [route, setRoute] = useState<'editor' | 'login'>(() => {
    // Detect route based on URL search params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (page === 'login') return 'login';
    }
    return 'editor';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (page === 'login') {
        setRoute('login');
      } else {
        setRoute('editor');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (newRoute: 'editor' | 'login', searchParams: string = '') => {
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

  if (route === 'login') {
    return (
      <TooltipProvider delayDuration={200}>
        <Login />
      </TooltipProvider>
    );
  }

  return (
    <EditorLayout>
      <TooltipProvider delayDuration={200}>
        <Editor />
      </TooltipProvider>
    </EditorLayout>
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


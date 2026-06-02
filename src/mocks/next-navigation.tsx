import React from 'react';

export function useRouter() {
  return {
    push: (url: string, options?: { locale?: string }) => {
      // Determine target locale
      let newLocale = options?.locale;
      
      // Preserve active locale from URL if not specified in options
      if (!newLocale && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        newLocale = params.get('locale') || undefined;
      }
      
      // 1. Extract query parameters from the destination URL
      const urlParts = url.split('?');
      const destPath = urlParts[0];
      const destQueryParams = new URLSearchParams(urlParts[1] || '');

      // 2. Build merged search parameters
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      
      // Merge destination parameters into navigation params
      destQueryParams.forEach((value, key) => {
        params.set(key, value);
      });

      if (newLocale) {
        params.set('locale', newLocale);
        if (typeof window !== 'undefined') {
          localStorage.setItem('VidFlow-locale', newLocale);
        }
      }

      // Filter out 'page' parameter to prevent duplications in main.tsx
      const extensionParams = new URLSearchParams(params.toString());
      extensionParams.delete('page');

      if (destPath.startsWith('/editor')) {
        if (typeof window !== 'undefined' && (window as any).navigateExtension) {
          (window as any).navigateExtension('editor', extensionParams.toString());
        } else {
          params.set('page', 'editor');
          const basePath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
          window.location.href = `${basePath}?${params.toString()}`;
        }
      } else if (destPath.startsWith('/login')) {
        if (typeof window !== 'undefined' && (window as any).navigateExtension) {
          (window as any).navigateExtension('login', extensionParams.toString());
        } else {
          params.set('page', 'login');
          const basePath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
          window.location.href = `${basePath}?${params.toString()}`;
        }
      } else if (destPath.startsWith('/privacy')) {
        if (typeof window !== 'undefined' && (window as any).navigateExtension) {
          (window as any).navigateExtension('privacy', extensionParams.toString());
        } else {
          params.set('page', 'privacy');
          const basePath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
          window.location.href = `${basePath}?${params.toString()}`;
        }
      } else if (destPath.startsWith('/terms')) {
        if (typeof window !== 'undefined' && (window as any).navigateExtension) {
          (window as any).navigateExtension('terms', extensionParams.toString());
        } else {
          params.set('page', 'terms');
          const basePath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
          window.location.href = `${basePath}?${params.toString()}`;
        }
      } else if (destPath === '/' || destPath === '/home') {
        if (typeof window !== 'undefined' && (window as any).navigateExtension) {
          (window as any).navigateExtension('home', extensionParams.toString());
        } else {
          params.set('page', 'home');
          const basePath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
          window.location.href = `${basePath}?${params.toString()}`;
        }
      } else {
        // For other routes (like hash scroll), update search params state and change hash
        const basePath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
        const newUrl = `${basePath}?${params.toString()}${url}`;
        window.history.pushState({}, '', newUrl);
        window.location.hash = url;
      }
    },
    replace: (url: string, options?: { locale?: string }) => {
      useRouter().push(url, options);
    },
    prefetch: () => {},
    back: () => window.history.back(),
  };
}

export function usePathname() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page === 'editor') {
      return '/editor';
    } else if (page === 'login') {
      return '/login';
    } else if (page === 'privacy') {
      return '/privacy';
    } else if (page === 'terms') {
      return '/terms';
    }
  }
  return '/';
}

export function useSearchParams() {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
}

export const Link = React.forwardRef<HTMLAnchorElement, any>(
  ({ href, children, onClick, ...props }, ref) => {
    const router = useRouter();
    
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) onClick(e);
      
      // If it's an internal link, intercept and use our router
      if (href && (href.startsWith('/') || href.startsWith('#'))) {
        e.preventDefault();
        router.push(href);
      }
    };

    return (
      <a href={href} ref={ref} onClick={handleLinkClick} {...props}>
        {children}
      </a>
    );
  }
);
Link.displayName = 'Link';

export function redirect(url: string) {
  useRouter().push(url);
}

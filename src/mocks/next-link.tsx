import React from 'react';
import { useRouter } from './next-navigation';

export default function MockLink({ href, children, onClick, ...props }: any) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);

    // Intercept internal routing
    if (href && (href.startsWith('/') || href.startsWith('#'))) {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

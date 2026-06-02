import React from 'react';

export default function MockImage({ src, alt, className, ...props }: any) {
  return <img src={src} alt={alt} className={className} {...props} />;
}

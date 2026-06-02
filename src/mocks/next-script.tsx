import React from 'react';

export default function MockScript({ children, ...props }: any) {
  return <script {...props}>{children}</script>;
}

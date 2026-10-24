'use client';
import { kit } from './kit';
export function Providers({ children }: { children: React.ReactNode }) {
  return <kit.Provider>{children}</kit.Provider>;
}

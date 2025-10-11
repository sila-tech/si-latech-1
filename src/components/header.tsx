import Link from 'next/link';
import { SiLatechIcon } from '@/components/icons';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <SiLatechIcon className="h-8 w-8 text-primary" />
            <span className="font-bold sm:inline-block font-headline text-lg">
              SI-LATECH
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

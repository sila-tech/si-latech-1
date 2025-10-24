import Link from 'next/link';
import Image from 'next/image';
import type { SVGProps } from 'react';
import { logoUrl } from '@/lib/branding';

function SiLatechIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...props}
    >
      <path
        fill="currentColor"
        d="M17.435 2.065a2 2 0 0 1 1.732 1l3.464 6a2 2 0 0 1 0 2l-3.464 6a2 2 0 0 1-1.732 1H6.565a2 2 0 0 1-1.732-1l-3.464-6a2 2 0 0 1 0-2l3.464-6a2 2 0 0 1 1.732-1h10.87ZM8.353 7.647a.5.5 0 0 0-.706.706L10.294 11H8.5a2.5 2.5 0 0 0 0 5h3.147l-2.647 2.647a.5.5 0 1 0 .706.706L13.707 15H15.5a2.5 2.5 0 0 0 0-5H12.353l2.647-2.647a.5.5 0 0 0-.706-.706L10.293 9H8.353Z"
      />
    </svg>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {logoUrl.endsWith('.svg') ? (
              <SiLatechIcon className="h-8 w-8 text-primary" />
            ) : (
              <Image src={logoUrl} alt="SI-LATECH Logo" width={32} height={32} className="text-primary" />
            )}
            <span className="font-bold sm:inline-block font-headline text-lg">
              SI-LATECH
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

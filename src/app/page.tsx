
'use client';
import { Header } from '@/components/header';
import { CalculatorShell } from '@/components/silacalc/calculator-shell';
import { useCalculator } from '@/context/calculator-context';
import { useEffect } from 'react';

export default function Home() {
  // The CalculatorShell now handles its own data loading,
  // so we can pass null to signify no initial project.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <CalculatorShell initialProjectData={null} />
      </main>
    </div>
  );
}

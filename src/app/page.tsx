
'use client';
import { Header } from '@/components/header';
import { CalculatorShell } from '@/components/silacalc/calculator-shell';
import { useCalculator } from '@/context/calculator-context';
import { useEffect } from 'react';

export default function Home() {
  const { clearCalculator } = useCalculator();

  // Clear any loaded project when visiting the home page
  useEffect(() => {
    clearCalculator();
  }, [clearCalculator]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <CalculatorShell />
      </main>
    </div>
  );
}

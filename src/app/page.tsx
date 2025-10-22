import { Header } from '@/components/header';
import { CalculatorShell } from '@/components/silacalc/calculator-shell';
import { ProjectsList } from '@/components/silacalc/projects-list';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <ProjectsList />
        <CalculatorShell />
      </main>
    </div>
  );
}

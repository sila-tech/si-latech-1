import { Button } from './ui/button';

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center bg-cover bg-center rounded-xl overflow-hidden min-h-[400px] bg-gray-200 dark:bg-gray-800">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative text-center p-8 text-white">
        <h1 className="text-4xl lg:text-6xl font-extrabold mb-4">
          Sila Standard Home
        </h1>
        <p className="text-lg lg:text-xl mb-8">
          The best tool for calculating home building costs.
        </p>
        <Button variant="default" size="lg">
          Get Started
        </Button>
      </div>
    </section>
  );
}

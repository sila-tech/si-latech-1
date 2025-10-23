import Image from "next/image";
import { Button } from "./ui/button";

export function Hero() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1542621334-a254cf47733d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Construction project background"
        layout="fill"
        objectFit="cover"
        className="z-0"
        data-ai-hint="construction site"
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white p-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Precision in Precast
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-primary-foreground/90">
          Calculate materials for your beam and block slab projects with ease and accuracy.
        </p>
        <div className="mt-8 flex gap-x-4">
          <Button size="lg" asChild>
            <a href="#calculator">Start Calculating</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

    
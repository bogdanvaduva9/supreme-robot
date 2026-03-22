import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold tracking-tight mb-4">
          Life<span className="text-accent">Sim</span>
        </h1>
        <p className="text-xl text-muted mb-2">
          Live a life from birth to death.
        </p>
        <p className="text-muted mb-12">
          Every choice shapes your story. An AI narrator simulates the world around you —
          the people you meet, the events that unfold, and the consequences of your decisions.
        </p>
        <Link
          href="/new-game"
          className="inline-block px-8 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dim transition-colors text-lg"
        >
          New Life
        </Link>
      </div>
    </main>
  );
}

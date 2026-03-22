'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { apiUrl } from '../../lib/utils/api';

function AccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/access'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (res.ok) {
        const from = searchParams.get('from') || '/';
        router.push(from);
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid access key.');
        setKey('');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Life<span className="text-accent">Sim</span>
          </h1>
          <span className="inline-block px-2 py-0.5 text-xs font-mono bg-warning/10 text-warning border border-warning/30 rounded">
            INTERNAL ALPHA
          </span>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-8">
          <p className="text-muted text-sm text-center mb-6">
            Enter your access key to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Access key"
                autoFocus
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-danger text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !key}
              className="w-full py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Don&apos;t have a key?{' '}
          <a
            href="mailto:bogdan@romania-atlas.com"
            className="text-accent hover:underline"
          >
            Request access
          </a>
        </p>
      </div>
    </main>
  );
}

export default function AccessPage() {
  return (
    <Suspense>
      <AccessForm />
    </Suspense>
  );
}

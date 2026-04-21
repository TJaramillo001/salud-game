'use client';

import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class GameErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[GameErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
                    <div className="text-5xl">😵</div>
                    <h1 className="text-2xl font-bold">Something went wrong</h1>
                    <p className="max-w-sm text-sm text-neutral-400">
                        An unexpected error occurred. Try again or start a new game.
                    </p>
                    <div className="flex gap-3">
                        <button
                            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200"
                            onClick={() => this.setState({ error: null })}
                        >
                            Try again
                        </button>
                        <button
                            className="rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
                            onClick={() => {
                                this.setState({ error: null });
                                window.location.href = '/';
                            }}
                        >
                            Go home
                        </button>
                    </div>
                </main>
            );
        }

        return this.props.children;
    }
}

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Admin ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
          <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-slate-900/90 p-6 shadow-2xl text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-xl font-black mb-2">Dashboard failed to load</h1>
            <p className="text-sm text-slate-300 mb-5">
              The admin dashboard is showing a safe fallback instead of a blank screen. Please reload to continue.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full rounded-xl bg-brand-yellow px-4 py-3 font-black text-gray-950 hover:bg-yellow-400 transition"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, ErrorInfo, ReactNode } from 'react';
import { captureError } from '../../observability/sentry';

interface Props {
  children: ReactNode;
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/lifecycle errors anywhere below it so a single bad component
 * shows a recovery screen instead of a blank page, and reports the error to
 * Sentry when it is configured.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack });
    console.error('Unhandled UI error:', error, errorInfo);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div style={styles.wrap} role="alert">
        <div style={styles.card}>
          <div style={styles.emoji} aria-hidden="true">😵‍💫</div>
          <h1 style={styles.title}>Something went wrong</h1>
          <p style={styles.body}>
            Sorry — this page hit an unexpected error. Your tickets and wallet are safe.
          </p>
          {import.meta.env.DEV && (
            <pre style={styles.pre}>{error.message}</pre>
          )}
          <div style={styles.actions}>
            <button style={styles.primary} onClick={() => window.location.reload()}>
              Reload page
            </button>
            <button style={styles.secondary} onClick={this.reset}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#f9fafb',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  card: {
    maxWidth: '440px',
    width: '100%',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  },
  emoji: { fontSize: '44px', lineHeight: 1, marginBottom: '12px' },
  title: { margin: '0 0 8px', fontSize: '22px', color: '#111827' },
  body: { margin: '0 0 20px', fontSize: '15px', color: '#4b5563', lineHeight: 1.5 },
  pre: {
    textAlign: 'left',
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '12px',
    color: '#b91c1c',
    overflowX: 'auto',
    marginBottom: '20px',
    whiteSpace: 'pre-wrap',
  },
  actions: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' },
  primary: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#10b981',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondary: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

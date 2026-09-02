import ReactDOM from 'react-dom/client';
import App from './App';
import { initSentry } from './observability/sentry';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './i18n/config';
import './index.css';

// No-op unless VITE_SENTRY_DSN is set at build time.
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

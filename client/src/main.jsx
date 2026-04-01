import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

console.log('🚀 App starting...');
console.log('Environment:', import.meta.env.VITE_API_URL);

const root = document.getElementById('root');
console.log('Root element:', root);

if (!root) {
  console.error('❌ Root element not found!');
} else {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  console.log('✅ App rendered');
}

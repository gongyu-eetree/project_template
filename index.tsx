import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Starting App Initialization...");

// Root Error Boundary to catch any crash during the app mount
class RootErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Root Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem', 
          fontFamily: 'system-ui, -apple-system, sans-serif', 
          backgroundColor: '#fff1f2', 
          minHeight: '100vh',
          color: '#881337'
        }}>
          <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>Application Failed to Start</h1>
          <p style={{marginBottom: '1rem'}}>An error occurred while rendering the application:</p>
          <pre style={{
            background: '#ffffff', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            overflow: 'auto', 
            border: '1px solid #fecdd3',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            color: '#be123c'
          }}>
            {this.state.error?.toString()}
            {this.state.error?.stack && `\n\nStack:\n${this.state.error.stack}`}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e11d48',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
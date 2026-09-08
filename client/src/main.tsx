import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import { installApiInterceptor } from './services/apiClient.js';

// Initialize resilient API fallback for Vercel static deployments and external backends
installApiInterceptor();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

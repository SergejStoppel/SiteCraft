import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // TEMPORARY: Disable StrictMode to fix auth initialization issues
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
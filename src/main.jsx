import React from 'react';
import ReactDOM from 'react-dom/client';
import './storage-shim.js';
import Panel from './Panel.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Panel />
  </React.StrictMode>
);

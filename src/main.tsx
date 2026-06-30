import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { I18nProvider } from './i18n/I18nContext.tsx';
import { WorkspaceProvider } from './features/workspace/WorkspaceStore.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </I18nProvider>
  </StrictMode>,
);

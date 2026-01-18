import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'; // Initialize i18n
import { initializeGA } from './analytics/ga.ts';
import { UserProvider } from './context/UserContext.tsx';
import { BrowserRouter } from 'react-router-dom';

async function initApp() {
  await initializeGA(); // Ensure GA is initialized before the app renders
  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <UserProvider><App /></UserProvider>
    </BrowserRouter>
  );
}

initApp();

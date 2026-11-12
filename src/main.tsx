import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles/base.css';
import './styles/app.css';

const el = document.getElementById('root');
if (el) createRoot(el).render(<App />);

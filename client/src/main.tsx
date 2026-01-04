import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// تأكيد الاتجاه واللغة للعربية على مستوى المستند
const docEl = document.documentElement;
docEl.setAttribute('dir', 'rtl');
docEl.setAttribute('lang', 'ar');

createRoot(document.getElementById("root")!).render(<App />);

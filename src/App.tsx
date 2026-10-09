import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BackgroundShader from './components/ui/background-shader';
import SignupWizard from './components/ui/signup-wizard';

function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative font-sans text-slate-100 overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-6">
      <BackgroundShader />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg">
        <SignupWizard defaultMode={mode} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/login" element={<AuthPage mode="signin" />} />
        <Route path="/signin" element={<AuthPage mode="signin" />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useI18n } from '../contexts/I18nContext';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { sendEmailNotification } from '../utils/emailService';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/app');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          role: userCredential.user.email?.toLowerCase() === 'claudio@brignole.ch' ? 'admin' : 'artist',
          createdAt: new Date().toISOString(),
          language: language.toLowerCase()
        });
        
        await sendEmailVerification(userCredential.user);
        await sendEmailNotification(userCredential.user.email!, 'welcome', { userId: userCredential.user.uid }, language.toLowerCase());
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError(t('login.enterEmail'));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(t('login.resetSent'));
      setError('');
    } catch (err: any) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || '',
          profilePictureUrl: user.photoURL || '',
          role: user.email?.toLowerCase() === 'claudio@brignole.ch' ? 'admin' : 'artist',
          createdAt: new Date().toISOString(),
          language: language.toLowerCase()
        });
        await sendEmailNotification(user.email!, 'welcome', { userId: user.uid }, language.toLowerCase());
      }
      navigate('/app');
    } catch (err: any) {
      console.error("Google login error:", err);
      // Provide a helpful error message if the provider is not enabled
      if (err.code === 'auth/operation-not-allowed') {
        setError(t('login.googleNotEnabled'));
      } else {
        setError(err.message || t('login.googleError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const languages: ('EN' | 'IT')[] = ['EN', 'IT'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 antialiased bg-[#F2EEE8] font-['Karla']">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(#59554E 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
        opacity: 0.98
      }}></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#FF4F00]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-[10%] right-[-10%] w-[30%] h-[30%] bg-[#121212]/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* Header Logo */}
      <header className="mb-12 relative z-10 flex justify-center">
        <img src="/logo.png" alt="TagTales Logo" className="h-[138px] w-auto object-contain" />
      </header>

      {/* Main Card */}
      <main className="w-full max-w-[480px] bg-white shadow-[0_20px_40px_rgba(18,18,18,0.05)] border border-[#EAE3D9] relative z-10 overflow-hidden rounded-[2rem]">
        {/* Toggle Tabs */}
        <nav className="flex w-full border-b border-[#EAE3D9]">
          <button 
            onClick={() => setIsLogin(true)}
            className={clsx(
              "flex-1 py-5 text-center transition-all",
              isLogin ? "font-bold text-[#FF4F00] border-b-2 border-[#FF4F00]" : "font-medium text-[#59554E] hover:text-[#121212]"
            )}
          >
            {t('login.signIn')}
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={clsx(
              "flex-1 py-5 text-center transition-all",
              !isLogin ? "font-bold text-[#FF4F00] border-b-2 border-[#FF4F00]" : "font-medium text-[#59554E] hover:text-[#121212]"
            )}
          >
            {t('login.createAccount')}
          </button>
        </nav>

        <div className="p-8 md:p-10">
          <div className="mb-8">
            <h1 className="text-[40px] leading-tight font-medium text-[#121212] tracking-tighter">{t('login.title')}</h1>
            <p className="text-[#59554E] mt-2">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('login.email')}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-[#EAE3D9] rounded-sm text-[#121212] placeholder:text-[#59554E] focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] outline-none transition-all" 
                placeholder="artist@tagtales.com" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('login.password')}</label>
                {isLogin && (
                  <button type="button" onClick={handleResetPassword} className="text-[0.75rem] font-medium text-[#59554E] hover:text-[#FF4F00] transition-colors">
                    {t('login.forgot')}
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-[#EAE3D9] rounded-sm text-[#121212] placeholder:text-[#59554E] focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] outline-none transition-all" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#59554E] hover:text-[#121212]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#FF4F00] text-white font-bold py-4 px-6 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF4F00]/20 mt-4 disabled:opacity-70"
            >
              {loading ? t('login.processing') : t('login.submit')}
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAE3D9]"></div>
            </div>
            <div className="relative bg-white px-4 text-xs font-bold uppercase tracking-widest text-[#59554E]">
              {t('login.or')}
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-8 bg-white border border-[#EAE3D9] text-[#121212] font-bold py-4 px-6 rounded-full hover:bg-[#F2EEE8] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('login.continueWithGoogle')}
          </button>
        </div>
      </main>

      {/* Language Selector */}
      <section className="mt-10 flex flex-wrap justify-center gap-3 relative z-10">
        {languages.map(lang => (
          <button 
            key={lang}
            onClick={() => setLanguage(lang)}
            className={clsx(
              "px-3 py-1 rounded-full border text-[0.7rem] font-bold transition-all",
              language === lang 
                ? "border-[#FF4F00] text-[#FF4F00]" 
                : "border-[#EAE3D9] text-[#59554E] hover:border-[#FF4F00] hover:text-[#FF4F00]"
            )}
          >
            {lang}
          </button>
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-12 mb-8 text-center relative z-10">
        <p className="text-[13px] font-medium text-[#59554E] tracking-tight">TagTales Gallery © 2026</p>
        <div className="flex gap-4 mt-2 justify-center">
          <a href="#" className="text-[0.65rem] font-bold uppercase tracking-widest text-[#59554E] hover:text-[#FF4F00]">Support</a>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { User, LogIn, LogOut, Key, UserPlus, ShieldAlert, CloudOff } from 'lucide-react';

interface SupabaseAuthProps {
  onSessionChange: (session: any) => void;
}

export const SupabaseAuth: React.FC<SupabaseAuthProps> = ({ onSessionChange }) => {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Load initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      onSessionChange(currentSession);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      onSessionChange(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onSessionChange]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setErrorMessage("Conta criada! Verifique seu e-mail para confirmação.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setIsOpen(false); // Close dropdown on login
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro no login.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      onSessionChange(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If Supabase is offline/unconfigured, show a clean, amber-tinted badge
  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
        <CloudOff size={13} className="text-amber-500" />
        <span>Modo Offline</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {session ? (
        // Logged in UI widget
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end hidden xs:flex">
            <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
              {session.user.email}
            </span>
            <span className="text-[10px] text-amber-500 font-medium">Recrutador</span>
          </div>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer font-bold text-sm"
          >
            {session.user.email?.substring(0, 2).toUpperCase() || <User size={14} />}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 p-3 rounded-lg bg-slate-900 border border-slate-800 shadow-xl animate-scale-fade">
              <p className="text-xs text-slate-400 mb-2 truncate">{session.user.email}</p>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md bg-slate-800 hover:bg-red-950/40 hover:text-red-400 hover:border-red-900 border border-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        // Logged out / SignIn trigger button
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <LogIn size={13} />
            <span>Fazer Login</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 top-10 z-50 w-64 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl animate-scale-fade">
              <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                {isSignUp ? <UserPlus size={15} className="text-amber-500" /> : <Key size={15} className="text-amber-500" />}
                <span>{isSignUp ? 'Criar Conta' : 'Acesse sua Conta'}</span>
              </h4>
              
              <form onSubmit={handleAuth} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recrutador@empresa.com"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {errorMessage && (
                  <div className="p-2 rounded bg-red-950/20 border border-red-900/50 text-[10px] text-red-400 flex items-start gap-1">
                    <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                  )}
                </button>
              </form>

              <div className="mt-3 pt-3 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMessage(null);
                  }}
                  className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold cursor-pointer underline underline-offset-2"
                >
                  {isSignUp ? 'Já tem conta? Faça Login' : 'Não tem conta? Cadastre-se'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

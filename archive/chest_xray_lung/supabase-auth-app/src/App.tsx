import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 1. Check existing session on boot
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    // 2. Listen to real-time auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <div style={{ textAlign: 'center', color: '#ffffff' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 16px auto' }} />
        <p style={{ fontWeight: 600 }}>Connecting to Supabase...</p>
      </div>
    );
  }

  return (
    <div className={`auth-wrapper ${user ? 'wide' : ''}`}>
      <div className="auth-card">
        {user ? (
          <Dashboard user={user} onSignOut={() => setUser(null)} />
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div className="brand-badge">🫁 Lung AI Diagnostic System</div>
              <h1 className="header-title">
                {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
              </h1>
              <p className="header-subtitle">
                {authMode === 'login'
                  ? 'Sign in to access patient records and chest X-ray predictions'
                  : 'Register a clinical account connected to Supabase'}
              </p>
            </div>

            <div className="tab-container">
              <button
                type="button"
                className={`tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>

            {authMode === 'login' ? (
              <Login
                onSwitchToRegister={() => setAuthMode('register')}
                onSuccess={() => {}}
              />
            ) : (
              <Register
                onSwitchToLogin={() => setAuthMode('login')}
                onSuccess={() => setAuthMode('login')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
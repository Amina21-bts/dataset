import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {errorMsg && (
        <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontWeight: 700 }}>⚠️ {errorMsg}</div>
          {errorMsg.toLowerCase().includes('email not confirmed') && (
            <div style={{ fontSize: '0.82rem', lineHeight: '1.4', color: '#7f1d1d' }}>
              <strong>Fix:</strong> Check your inbox for the Supabase confirmation link, OR in your Supabase Dashboard go to <em>Authentication &rarr; Providers &rarr; Email</em> and turn off <em>"Confirm email"</em>.
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="doctor@hospital.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            Password
          </label>
          <div className="input-container">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="btn-toggle-pwd"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" />
              <span>Authenticating...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="card-footer">
        Don't have an account yet?
        <button type="button" className="link-btn" onClick={onSwitchToRegister}>
          Register here
        </button>
      </div>
    </div>
  );
};

export default Login;
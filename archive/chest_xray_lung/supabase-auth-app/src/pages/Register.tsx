import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-check.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // Automatically logged in
        onSuccess();
      } else {
        // Confirmation required or pending
        setSuccessMsg(
          'Account created successfully! If email confirmation is enabled, please check your inbox to activate your account.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {errorMsg && (
        <div className="alert alert-error">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <span>✅ {successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="register-name">
            Full Name
          </label>
          <input
            id="register-name"
            type="text"
            className="form-input"
            placeholder="Dr. Alex Rivera"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-email">
            Email Address
          </label>
          <input
            id="register-email"
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
          <label className="form-label" htmlFor="register-password">
            Password (min. 6 characters)
          </label>
          <div className="input-container">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
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

        <div className="form-group">
          <label className="form-label" htmlFor="register-confirm">
            Confirm Password
          </label>
          <input
            id="register-confirm"
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" />
              <span>Registering...</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="card-footer">
        Already have an account?
        <button type="button" className="link-btn" onClick={onSwitchToLogin}>
          Sign in instead
        </button>
      </div>
    </div>
  );
};

export default Register;
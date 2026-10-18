import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

interface PredictionResult {
  predicted_class: 'Cancer' | 'NORMAL';
  confidence: number;
  raw_score: number;
  risk_level: string;
  clinical_notes: string;
  filename: string;
  analyzed_at: string;
  patient_name?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Clinician';
  const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a chest X-ray image to analyze.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${response.status}`);
      }

      const data: PredictionResult = await response.json();
      const enrichedResult: PredictionResult = {
        ...data,
        patient_name: patientName.trim() || 'Anonymous Patient',
      };

      setResult(enrichedResult);
      setHistory((prev) => [enrichedResult, ...prev]);

      // Attempt to save to Supabase table public.predictions
      try {
        await supabase.from('predictions').insert([
          {
            user_id: user.id,
            patient_name: enrichedResult.patient_name,
            image_filename: enrichedResult.filename,
            predicted_class: enrichedResult.predicted_class,
            confidence: enrichedResult.confidence,
            raw_score: enrichedResult.raw_score,
          },
        ]);
      } catch (dbErr) {
        console.warn('Could not save to Supabase table (schema might need to be run):', dbErr);
      }
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Failed to connect to the ML diagnostic server at http://127.0.0.1:5000. Ensure the Python API is running.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      onSignOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div>
      {/* Top Header Bar */}
      <div className="portal-topbar">
        <div className="user-profile-badge">
          <div className="user-avatar-sm">{initial}</div>
          <div className="user-details">
            <div className="user-name-title">{fullName}</div>
            <div className="user-email-subtitle">
              {user.email} &bull; <span style={{ color: '#16a34a', fontWeight: 600 }}>Active</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <div className="brand-badge">🔬 Deep Learning Diagnostic Workstation</div>
        <h2 className="header-title" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
          Lung Cancer Chest X-Ray Detector
        </h2>
        <p className="header-subtitle" style={{ marginBottom: '16px' }}>
          Upload a high-resolution chest radiograph (AP/PA view) to detect pulmonary malignancies in real time.
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-error">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Main Diagnostic Workspace */}
      <div className="diagnostic-grid">
        {/* Left Column: Image Upload & Preview */}
        <div>
          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label className="form-label" htmlFor="patient-input">
                Patient Name or Medical Record ID (Optional)
              </label>
              <input
                id="patient-input"
                type="text"
                className="form-input"
                placeholder="e.g. PT-94021 / John Doe"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>

            <label className="form-label">Chest X-Ray Radiograph</label>
            <div
              className="dropzone-container"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="upload-icon">📁</div>
              <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>
                {selectedFile ? selectedFile.name : 'Click or Drag & Drop X-Ray here'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Supports JPEG, PNG (Auto-resized to 224&times;224 for MobileNetV2 / CNN)
              </div>
            </div>

            {previewUrl && (
              <div className="preview-wrapper">
                <img src={previewUrl} alt="Chest X-Ray Preview" className="preview-img" />
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                className="btn-submit"
                style={{ margin: 0, flex: 2 }}
                disabled={!selectedFile || analyzing}
              >
                {analyzing ? (
                  <>
                    <div className="spinner" />
                    <span>Analyzing Neural Features...</span>
                  </>
                ) : (
                  'Run AI Cancer Detection'
                )}
              </button>

              {selectedFile && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ margin: 0, flex: 1 }}
                  onClick={handleReset}
                  disabled={analyzing}
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: AI Diagnostic Findings */}
        <div className="result-card">
          {result ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  AI INFERENCE RESULT
                </span>

                {result.predicted_class === 'Cancer' ? (
                  <div className="diagnosis-badge badge-cancer">
                    <span>🚨</span>
                    <span>CANCER DETECTED</span>
                  </div>
                ) : (
                  <div className="diagnosis-badge badge-normal">
                    <span>✅</span>
                    <span>NORMAL / HEALTHY</span>
                  </div>
                )}

                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                  {result.confidence}%
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: '6px' }}>
                    Confidence
                  </span>
                </div>

                <div className="confidence-bar-bg">
                  <div
                    className={`confidence-bar-fill ${
                      result.predicted_class === 'Cancer' ? 'fill-cancer' : 'fill-normal'
                    }`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              <div className="clinical-notes-box">
                <strong>Clinical Assessment:</strong>
                <p style={{ marginTop: '4px' }}>{result.clinical_notes}</p>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div className="stat-row">
                  <span className="stat-label">Patient Record:</span>
                  <span className="stat-value">{result.patient_name}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Risk Category:</span>
                  <span className="stat-value" style={{ color: result.predicted_class === 'Cancer' ? '#dc2626' : '#16a34a' }}>
                    {result.risk_level}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Raw Probability Score:</span>
                  <span className="stat-value" style={{ fontFamily: 'monospace' }}>
                    {result.raw_score}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Analyzed Timestamp:</span>
                  <span className="stat-value">{result.analyzed_at}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🩺</div>
              <h4 style={{ color: '#475569', marginBottom: '6px' }}>Awaiting X-Ray Radiograph</h4>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                Upload an X-ray image on the left and click <strong>Run AI Cancer Detection</strong> to display deep learning inference metrics.
              </p>
            </div>
          )}

          <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
            Powered by TensorFlow &bull; Model: <code>lung_cancer_model_new.keras</code> &bull; Supabase Auth
          </div>
        </div>
      </div>

      {/* Historical Scans in current session */}
      {history.length > 0 && (
        <div className="history-card">
          <h4 style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 700 }}>
            Recent Diagnostic Scans ({history.length})
          </h4>
          <table className="history-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>File</th>
                <th>Result</th>
                <th>Confidence</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{item.patient_name}</td>
                  <td>{item.filename}</td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: item.predicted_class === 'Cancer' ? '#fee2e2' : '#dcfce7',
                        color: item.predicted_class === 'Cancer' ? '#b91c1c' : '#15803d',
                      }}
                    >
                      {item.predicted_class}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.confidence}%</td>
                  <td style={{ color: '#64748b' }}>{item.analyzed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

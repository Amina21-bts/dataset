import React from 'react';

interface AuthInputProps {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  required = true,
}) => {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
};

export default AuthInput;
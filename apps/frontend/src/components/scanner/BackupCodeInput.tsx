import { useState, useRef, useEffect } from 'react';

interface BackupCodeInputProps {
  onSubmit: (backupCode: string) => void;
  isVerifying: boolean;
}

export const BackupCodeInput: React.FC<BackupCodeInputProps> = ({
  onSubmit,
  isVerifying,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        onSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          const newCode = digits.split('');
          setCode(newCode);
          inputRefs.current[5]?.focus();
          onSubmit(digits);
        }
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newCode = digits.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      onSubmit(digits);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onSubmit(fullCode);
    }
  };

  const handleClear = () => {
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isComplete = code.every((digit) => digit !== '');

  return (
    <div className="backup-code-input">
      <div className="input-header">
        <h2>Enter Backup Code</h2>
        <p>Enter the 6-digit backup code from the ticket</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="code-inputs" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isVerifying}
              className="code-digit"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        <div className="input-actions">
          <button
            type="submit"
            disabled={!isComplete || isVerifying}
            className="btn-primary"
          >
            {isVerifying ? 'Verifying...' : 'Verify Ticket'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isVerifying}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="input-instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Enter the 6-digit backup code shown on the ticket</li>
          <li>You can paste the code from clipboard</li>
          <li>The code will be verified automatically when complete</li>
          <li>Use this method if the QR code cannot be scanned</li>
        </ul>
      </div>
    </div>
  );
};

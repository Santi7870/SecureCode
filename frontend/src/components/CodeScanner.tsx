import React, { useState } from 'react';
import { Play, Code, ShieldAlert } from 'lucide-react';

interface CodeScannerProps {
  onScan: (code: string, filename: string, language: string) => void;
  isLoading: boolean;
}

const TEMPLATES = {
  python_vuln: {
    name: 'vulnerable_python.py',
    lang: 'python',
    code: `# Mock Vulnerable Python Code
import sqlite3
import hashlib
import random

def get_user(username):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # SQL Injection
    cursor.execute(f"SELECT * FROM users WHERE name = '{username}'")
    return cursor.fetchall()

def hash_pass(password):
    # Weak Hashing
    return hashlib.md5(password.encode()).hexdigest()

def make_token():
    # Insecure Randomness
    return str(random.randint(1000, 9999))`
  },
  js_vuln: {
    name: 'vulnerable_javascript.js',
    lang: 'javascript',
    code: `// Mock Vulnerable JavaScript Code
const express = require('express');
const cors = require('cors');
const app = express();

// Overly permissive CORS
app.use(cors({ origin: "*" }));

app.get('/render', (req, res) => {
    const html = req.query.content;
    // Unsafe HTML insertion
    document.getElementById('display').innerHTML = html;
});`
  },
  python_safe: {
    name: 'safe_python.py',
    lang: 'python',
    code: `# Safe Python Code
import os
import sqlite3
import hashlib
import secrets

API_KEY = os.getenv("API_KEY")

def get_user_safe(username):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # Parameterized SQL
    cursor.execute("SELECT * FROM users WHERE name = ?", (username,))
    return cursor.fetchall()

def hash_pass_safe(password):
    # Secure SHA256 Hashing
    return hashlib.sha256(password.encode()).hexdigest()`
  }
};

export const CodeScanner: React.FC<CodeScannerProps> = ({ onScan, isLoading }) => {
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('vulnerable_python.py');
  const [language, setLanguage] = useState('python');

  const handleLoadTemplate = (key: keyof typeof TEMPLATES) => {
    const tmpl = TEMPLATES[key];
    setCode(tmpl.code);
    setFilename(tmpl.name);
    setLanguage(tmpl.lang);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onScan(code, filename, language);
  };

  const handleTryFoundryScan = () => {
    const tmpl = TEMPLATES.python_vuln;
    setCode(tmpl.code);
    setFilename(tmpl.name);
    setLanguage(tmpl.lang);
    onScan(tmpl.code, tmpl.name, tmpl.lang);
  };

  return (
    <div className="panel-card">
      <div className="panel-title">
        <Code size={20} />
        <span>Paste Code to Analyze</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, alignSelf: 'center', color: 'var(--text-secondary)' }}>Quick Templates:</span>
        <button className="btn-secondary" style={{ flex: 'none', padding: '4px 8px' }} onClick={() => handleLoadTemplate('python_vuln')}>
          Python Vuln
        </button>
        <button className="btn-secondary" style={{ flex: 'none', padding: '4px 8px' }} onClick={() => handleLoadTemplate('js_vuln')}>
          JS Vuln
        </button>
        <button className="btn-secondary" style={{ flex: 'none', padding: '4px 8px' }} onClick={() => handleLoadTemplate('python_safe')}>
          Python Safe
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filename</label>
            <input
              type="text"
              className="form-input"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. vulnerable_python.py"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Language</label>
            <select
              className="form-input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isLoading}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Source Code</label>
          <textarea
            className="code-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code block here..."
            required
            disabled={isLoading}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="submit" className="btn-primary" style={{ flex: '1 1 200px' }} disabled={isLoading || !code.trim()}>
            <Play size={16} fill="white" />
            <span>{isLoading ? 'Running Scan...' : 'Run Multi-Agent Scan'}</span>
          </button>
          
          <button 
            type="button" 
            className="btn-primary" 
            style={{ 
              flex: '1 1 200px', 
              background: 'linear-gradient(135deg, #0078d4 0%, #50e4ff 100%)', 
              border: 'none',
              boxShadow: '0 4px 12px rgba(0, 120, 212, 0.3)'
            }} 
            onClick={handleTryFoundryScan}
            disabled={isLoading}
          >
            <ShieldAlert size={16} />
            <span>Try Real Foundry Scan</span>
          </button>
        </div>
      </form>
    </div>
  );
};

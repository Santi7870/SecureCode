import { ScanResponse, ScanSummary, HealthResponse, EvaluationReport, EvaluationHistoryEntry } from '../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:8000';

export const apiClient = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Failed to fetch backend health status');
    return res.json();
  },

  async getRecentScans(): Promise<ScanSummary[]> {
    const res = await fetch(`${API_BASE_URL}/api/scans`);
    if (!res.ok) throw new Error('Failed to fetch scans history');
    return res.json();
  },

  async getScanDetails(scanId: string): Promise<ScanResponse> {
    const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}`);
    if (!res.ok) throw new Error(`Failed to fetch scan details for ID: ${scanId}`);
    return res.json();
  },

  async getHtmlReport(scanId: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/reports/${scanId}/html`);
    if (!res.ok) throw new Error(`Failed to fetch HTML report for ID: ${scanId}`);
    return res.text();
  },

  async scanCode(code: string, filename: string, language: string): Promise<ScanResponse> {
    const res = await fetch(`${API_BASE_URL}/api/scan/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, filename, language }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Scan code execution failed');
    }
    return res.json();
  },

  async scanFile(file: File): Promise<ScanResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/scan/file`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Scan file upload failed');
    }
    return res.json();
  },

  async scanRepository(file: File): Promise<ScanResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/scan/repository`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Repository ZIP scan execution failed');
    }
    return res.json();
  },

  async scanGithub(githubUrl: string): Promise<ScanResponse> {
    const res = await fetch(`${API_BASE_URL}/api/scan/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ github_url: githubUrl }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'GitHub URL scan execution failed');
    }
    return res.json();
  },

  async getLatestEvaluation(): Promise<EvaluationReport> {
    const res = await fetch(`${API_BASE_URL}/api/evaluation/latest`);
    if (!res.ok) throw new Error('Failed to fetch latest evaluation report');
    return res.json();
  },

  async getEvaluationHistory(): Promise<EvaluationHistoryEntry[]> {
    const res = await fetch(`${API_BASE_URL}/api/evaluation/history`);
    if (!res.ok) throw new Error('Failed to fetch evaluation history');
    return res.json();
  },

  async triggerEvaluationRun(mode: string, limit: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/evaluation/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode, limit }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to trigger evaluation run');
    }
    return res.json();
  },

  async getEvaluationStatus(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/evaluation/status`);
    if (!res.ok) throw new Error('Failed to fetch evaluation runner status');
    return res.json();
  },
};

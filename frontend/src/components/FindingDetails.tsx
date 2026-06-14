import React from 'react';
import { Finding } from '../types';

interface FindingDetailsProps {
  finding: Finding | null;
  sanitizePath: (path: string) => string;
}

export const FindingDetails: React.FC<FindingDetailsProps> = () => {
  // Findings now expand inline inside FindingsTable.tsx.
  // This component remains as a placeholder to prevent import failures.
  return null;
};

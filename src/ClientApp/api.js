import { z } from 'zod';

export const titleSchema = z.string().trim().min(1, 'Enter a title.').max(100, 'Use at most 100 characters.');

// Injectable transport keeps HTTP behavior testable without a browser or server.
export function createApi(fetchImpl = globalThis.fetch) {
  return async function request(path, options = {}) {
    const response = await fetchImpl(path, {
      ...options,
      headers: { ...options.headers, 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      let problem;
      try { problem = await response.json(); } catch { /* Non-JSON error response. */ }
      throw new Error(problem?.errors
        ? Object.values(problem.errors).flat().join(' ')
        : `Request failed (${response.status}). Check that the server is running.`);
    }
    return response.status === 204 ? null : response.json();
  };
}

export function completionSummary(experiments) {
  return `${experiments.filter(item => item.isComplete).length} / ${experiments.length} complete`;
}

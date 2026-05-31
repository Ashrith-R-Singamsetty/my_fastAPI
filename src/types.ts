/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lesson {
  slug: string;           // Matches the GitHub markdown filename (e.g., "first-steps")
  title: string;          // Display title
  module: string;         // Module category
  initialCode: string;    // Starting boilerplate for Monaco
  tasks: string[];        // Array of string instructions for the user
  testScript: string;     // Hidden Python script executed in Pyodide to validate the user's code
  hint: string;           // Helpful hint if the user gets stuck
}

export interface UserProgress {
  completedSlugs: string[]; // List of completed lesson slugs
  lessonCode: Record<string, string>; // Saved code per lesson
  currentLessonSlug: string; // The active lesson slug
}

export interface PyodideStatus {
  status: 'IDLE' | 'WASM_LOADING' | 'MICROPIP_LOADING' | 'DEPS_LOADING' | 'COMPLETED' | 'ERROR';
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  hasApp: boolean;
  openapiSchema?: any;
  error?: string;
}

export interface MockRequestResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
}

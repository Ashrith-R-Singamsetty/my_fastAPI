/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LESSONS } from '../lessonsConfig';
import { FALLBACK_MARKDOWN } from '../fallbackMarkdown';

export interface SearchResult {
  slug: string;
  title: string;
  module: string;
  snippet: string;
}

export function searchLessons(query: string): SearchResult[] {
  if (!query || query.trim() === '') return [];
  const lowercaseQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const [slug, content] of Object.entries(FALLBACK_MARKDOWN)) {
    const lesson = LESSONS[slug];
    if (!lesson) continue;

    const titleMatch = lesson.title.toLowerCase().includes(lowercaseQuery);
    const contentMatch = content.toLowerCase().includes(lowercaseQuery);
    const moduleMatch = lesson.module.toLowerCase().includes(lowercaseQuery);

    if (titleMatch || contentMatch || moduleMatch) {
      let snippet = '';
      if (contentMatch) {
        const index = content.toLowerCase().indexOf(lowercaseQuery);
        const start = Math.max(0, index - 40);
        const end = Math.min(content.length, index + lowercaseQuery.length + 50);
        // Clean up snippets from triple backticks and double spaces for elegant rendering
        const cleanText = content.substring(start, end)
          .replace(/[\n\r\t]+/g, ' ')
          .replace(/`{1,3}/g, '')
          .trim();
        snippet = (start > 0 ? '...' : '') + cleanText + (end < content.length ? '...' : '');
      } else {
        snippet = lesson.tasks[0] || 'View lesson content...';
      }

      results.push({
        slug,
        title: lesson.title,
        module: lesson.module,
        snippet: snippet.length > 100 ? snippet.substring(0, 100) + '...' : snippet,
      });
    }
  }

  return results;
}

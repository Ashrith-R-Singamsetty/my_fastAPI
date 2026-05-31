/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Lesson } from '../types';
import { FALLBACK_MARKDOWN } from '../fallbackMarkdown';
import { 
  BookOpen, 
  CheckSquare, 
  HelpCircle, 
  Play, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Lightbulb,
  CloudOff,
  RefreshCw,
  Award,
  Search
} from 'lucide-react';
import { searchLessons, SearchResult } from '../utils/searchEngine';

// Utility helper to split long markdown text into bite-sized sequential lessons/slides
function chunkMarkdown(text: string): string[] {
  if (!text) return [];
  // First, if there are custom '---' dividers, split by those.
  if (text.includes('\n---\n') || text.includes('\n--- \n')) {
    return text.split(/\n---+\s*\n/).map(c => c.trim()).filter(Boolean);
  }

  // Otherwise, let's chunk by main headings (## or ###), but being careful not to split inside code blocks.
  const lines = text.split('\n');
  const chunks: string[][] = [[]];
  let inCodeBlock = false;
  let currentChunkIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    // Split at ## or ### if not inside code block
    const isHeading = !inCodeBlock && (line.startsWith('## ') || line.startsWith('### '));
    
    if (isHeading && chunks[currentChunkIndex].length > 0) {
      currentChunkIndex++;
      chunks[currentChunkIndex] = [];
    }

    chunks[currentChunkIndex].push(line);
  }

  return chunks.map(c => c.join('\n').trim()).filter(Boolean);
}

interface SyllabusPanelProps {
  lesson: Lesson;
  activeTab: 'learn' | 'tasks';
  setActiveTab: (tab: 'learn' | 'tasks') => void;
  onRunValidation: () => void;
  isCheckingCode: boolean;
  testFeedback: { passed: boolean; message: string; visible: boolean } | null;
  onNextLesson: () => void;
  onPrevLesson: () => void;
  onSelectLesson: (slug: string) => void;
  isFirstLesson: boolean;
  isLastLesson: boolean;
  hasCompleted: boolean;
}

export default function SyllabusPanel({
  lesson,
  activeTab,
  setActiveTab,
  onRunValidation,
  isCheckingCode,
  testFeedback,
  onNextLesson,
  onPrevLesson,
  onSelectLesson,
  isFirstLesson,
  isLastLesson,
  hasCompleted
}: SyllabusPanelProps) {
  const [markdown, setMarkdown] = useState<string>('');
  const [isFetchedOnline, setIsFetchedOnline] = useState<boolean>(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const workspaceSearchResults: SearchResult[] = searchLessons(workspaceSearchQuery);

  // Map slugs to standard FastAPI Tiangolo GitHub repository filenames
  const getGithubFilename = (slug: string) => {
    if (slug === 'request-body') return 'body.md';
    return `${slug}.md`;
  };

  useEffect(() => {
    // Reset hints and active slide when active lesson shifts
    setShowHint(false);
    setCurrentSlide(0);
    
    // Load documentation
    const fetchDocs = async () => {
      setIsLoadingDocs(true);
      const filename = getGithubFilename(lesson.slug);
      const url = `https://raw.githubusercontent.com/tiangolo/fastapi/master/docs/en/docs/tutorial/${filename}`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const text = await response.text();
          // Verify we didn't receive HTML error screens
          if (text.trim().startsWith('#') || text.trim().startsWith('import') || text.includes('FastAPI')) {
            setMarkdown(text);
            setIsFetchedOnline(true);
          } else {
            throw new Error('Retrieved format is not a raw markdown');
          }
        } else {
          throw new Error(`HTTP fetch error code ${response.status}`);
        }
      } catch (err) {
        // Safe, graceful fallback to our pristine build-time docs dataset
        setMarkdown(FALLBACK_MARKDOWN[lesson.slug] || '# Documentation Loading Error');
        setIsFetchedOnline(false);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [lesson.slug]);

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] border-r border-zinc-800" id="syllabus-panel">
      {/* Tab Selectors */}
      <div className="flex border-b border-zinc-800 bg-[#09090b]" id="syllabus-tabs-header">
        <button
          onClick={() => setActiveTab('learn')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'learn'
              ? 'border-b-2 border-[#05998b] text-zinc-100 bg-zinc-900/30'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
          id="tab-learn"
        >
          <BookOpen className="w-4 h-4" />
          <span>LEARN</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'tasks'
              ? 'border-b-2 border-[#05998b] text-zinc-100 bg-zinc-900/30'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
          id="tab-tasks"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>TASKS</span>
          {hasCompleted && (
            <span className="w-2 h-2 rounded-full bg-[#05998b] animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Primary tab workspace viewports */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6" id="syllabus-viewport">
        {activeTab === 'learn' && (
          <div className="space-y-4" id="learn-tab-content">
            {/* Online Status Label */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-semibold">
                FastAPI Official Tutorial
              </span>
              
              {isLoadingDocs ? (
                <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#05998b]" />
                  Synchronizing Docs...
                </span>
              ) : isFetchedOnline ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live From GitHub
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <CloudOff className="w-3 h-3" />
                  Offline Dataset Cached
                </span>
              )}
            </div>

            {/* Keyword search bar in Learn Panel */}
            <div className="relative" id="learn-search-bar">
              <input
                type="text"
                placeholder="Search concepts, variables..."
                value={workspaceSearchQuery}
                onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-3 py-2 pl-9 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#05998b]/80 font-sans"
                id="workspace-search-input"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              {workspaceSearchQuery && (
                <button
                  onClick={() => setWorkspaceSearchQuery('')}
                  className="absolute right-3 top-2 text-[10px] text-zinc-500 hover:text-zinc-300 font-bold bg-transparent border-0 cursor-pointer"
                  id="clear-workspace-search"
                >
                  Clear
                </button>
              )}
            </div>

            {workspaceSearchQuery.trim() !== '' ? (
              <div className="space-y-3 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl" id="workspace-search-results">
                <span className="text-[10px] uppercase tracking-wider font-mono text-[#05998b] font-bold block mb-1">
                  Results for "{workspaceSearchQuery}"
                </span>
                
                {workspaceSearchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1" id="workspace-results-list">
                    {workspaceSearchResults.map((result) => (
                      <div
                        key={result.slug}
                        onClick={() => {
                          onSelectLesson(result.slug);
                          setWorkspaceSearchQuery('');
                        }}
                        className="w-full text-left p-3 bg-zinc-900/10 hover:bg-[#05998b]/5 border border-zinc-800 hover:border-[#05998b]/30 rounded transition text-xs flex flex-col gap-1 cursor-pointer group"
                        id={`ws-result-${result.slug}`}
                      >
                        <div className="flex items-center gap-1.5 justify-between w-full">
                          <span className="text-[8px] font-mono bg-[#05998b]/10 text-[#05998b] px-1.5 py-0.5 rounded border border-[#05998b]/20 uppercase tracking-wider">
                            {result.module}
                          </span>
                          <span className="font-bold text-zinc-200 group-hover:text-[#05998b] duration-200 transition-colors truncate">{result.title}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono italic truncate">{result.snippet}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2">No matching topics found.</p>
                )}
              </div>
            ) : (
              /* Markdown rendering body divided into chunks */
              <div className="space-y-4" id="rendered-markdown-body">
                {(() => {
                  const currentChunks = chunkMarkdown(markdown);
                  const currentChunk = currentChunks[currentSlide] || '';
                  
                  return (
                    <>
                      {/* Interactive slide controller */}
                      {currentChunks.length > 1 && (
                        <div className="bg-zinc-950/80 border border-zinc-850 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs" id="lesson-chunks-navigation">
                          <button
                            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                            disabled={currentSlide === 0}
                            className="px-2.5 py-1 rounded bg-[#121214] hover:bg-zinc-90 w-16 text-center font-bold text-[10px] text-zinc-400 hover:text-white border border-zinc-800 disabled:opacity-25 disabled:cursor-not-allowed transition duration-150 flex items-center gap-1 justify-center cursor-pointer"
                            id="lesson-chunk-prev"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                          </button>
                          
                          {/* Visual dashes indicator */}
                          <div className="flex-1 flex justify-center items-center gap-1.5" id="lesson-chunk-indicators">
                            {currentChunks.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                  idx === currentSlide 
                                    ? 'w-6 bg-[#05998b]' 
                                    : 'w-2 bg-zinc-800 hover:bg-zinc-750'
                                }`}
                                title={`Go to part ${idx + 1}`}
                                id={`lesson-chunk-dot-${idx}`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => setCurrentSlide(prev => Math.min(currentChunks.length - 1, prev + 1))}
                            disabled={currentSlide === currentChunks.length - 1}
                            className="px-2.5 py-1 rounded bg-[#121214] hover:bg-zinc-90 w-16 text-center font-bold text-[10px] text-zinc-400 hover:text-white border border-zinc-805 disabled:opacity-25 disabled:cursor-not-allowed transition duration-150 flex items-center gap-1 justify-center cursor-pointer"
                            id="lesson-chunk-next"
                          >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Actual markdown of the active section */}
                      <div className="markdown-prose text-sm text-zinc-300 tracking-wide font-normal leading-relaxed space-y-4" id="rendered-markdown-slide">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold tracking-tight text-zinc-100 mb-4 mt-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold text-zinc-200 border-b border-zinc-850 pb-1 mt-6 mb-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-bold text-zinc-200 mt-4 mb-2" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-sm font-semibold text-zinc-300 mt-3 mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-zinc-400" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-zinc-400" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-zinc-400" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1 text-zinc-455" {...props} />,
                            code: ({node, className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match;
                              return !isInline ? (
                                <pre className="bg-[#121214] p-4 border border-zinc-800 rounded-xl font-mono text-xs overflow-x-auto text-[#05998b] my-4 shadow-inner">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code className="px-1.5 py-0.5 bg-[#121214] border border-zinc-800 rounded text-[#05998b] font-mono text-xs font-semibold" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            blockquote: ({node, ...props}) => (
                              <blockquote className="border-l-2 border-zinc-700 bg-zinc-900/50 pl-3 py-1 my-4 pr-2 text-zinc-400 italic text-xs font-medium" {...props} />
                            )
                          }}
                        >
                          {currentChunk}
                        </ReactMarkdown>
                      </div>

                      {/* CTA when completed the slides reading of active step */}
                      {currentChunks.length > 1 && currentSlide === currentChunks.length - 1 && (
                        <div className="p-4 bg-[#05998b]/5 border border-[#05998b]/15 rounded-xl space-y-2 text-center mt-6 shadow-sm" id="ready-practice-callout">
                          <span className="text-[10px] font-mono text-[#05998b] font-bold uppercase tracking-wider block">🎓 Section Lesson Finished</span>
                          <p className="text-[11px] text-zinc-400">You've unlocked the core knowledge for this chapter step!</p>
                          <button
                            onClick={() => setActiveTab('tasks')}
                            className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-[#05998b] hover:bg-[#04877b] text-white font-bold text-xs rounded shadow-md cursor-pointer transition active:scale-95"
                            id="go-to-tasks-cta"
                          >
                            <span>Open Tasks Panel</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6" id="tasks-tab-content">
            {/* Header Objective Card */}
            <div className="bg-[#121214] border border-zinc-800 p-5 rounded-2xl shadow-md">
              <h4 className="text-sm font-bold text-zinc-200 tracking-tight mb-2">Lesson Target: {lesson.title}</h4>
              <p className="text-xs text-zinc-500">Complete the listed assertions in Python to unlock the next chapter of FastAPI.</p>
            </div>

            {/* Checklist items */}
            <div className="space-y-3" id="objectives-list">
              <span className="text-[10px] font-mono tracking-widest text-[#05998b] uppercase font-bold">
                Task Milestones
              </span>

              {lesson.tasks.map((taskText, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                    hasCompleted 
                      ? 'bg-[#05998b]/5 border-[#05998b]/20 text-zinc-200'
                      : 'bg-zinc-950/20 border-zinc-800 text-zinc-300'
                  }`}
                  id={`goal-${index}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {hasCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-[#05998b]/20 border border-[#05998b] flex items-center justify-center text-[#05998b]">
                        <Sparkles className="w-3 h-3 fill-[#05998b]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-400 font-bold shadow-inner">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                    {taskText}
                  </p>
                </div>
              ))}
            </div>

            {/* Action buttons & Validator feedbacks */}
            <div className="pt-2 space-y-4" id="validator-control-block">
              {testFeedback && testFeedback.visible && (
                <div 
                  className={`p-4 rounded-xl border flex gap-3 ${
                    testFeedback.passed 
                      ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300' 
                      : 'bg-amber-950/20 border-amber-900/30 text-amber-350'
                  }`}
                  id="test-feedback-bubble"
                >
                  <div className="mt-0.5">
                    {testFeedback.passed ? (
                      <Award className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider font-mono">
                      {testFeedback.passed ? 'Assertions Passed' : 'Assertion check failed'}
                    </h5>
                    <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                      {testFeedback.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Validate action button */}
              <div className="flex gap-3">
                <button
                  onClick={onRunValidation}
                  disabled={isCheckingCode}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-bold transition duration-300 cursor-pointer text-white border border-[#05998b]/20 ${
                    hasCompleted
                      ? 'bg-zinc-800 hover:bg-zinc-750'
                      : 'bg-[#05998b] hover:bg-[#04877b] shadow-lg shadow-[#05998b]/25'
                  } disabled:opacity-50 active:scale-95`}
                  id="check-code-btn"
                >
                  {isCheckingCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                      Evaluating Python Code...
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 fill-white" />
                        <span>CHECK CODE / VALIDATE</span>
                      </div>
                      <kbd className="hidden sm:inline-flex items-center bg-[#036259]/80 text-[8px] font-mono px-1.5 py-0.5 rounded text-teal-200 border border-teal-500/20 select-none font-normal">
                        Ctrl+Shift+Enter
                      </kbd>
                    </div>
                  )}
                </button>

                {/* Hint Toggle Button */}
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="w-12 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900/60 transition rounded-lg flex items-center justify-center text-zinc-500 hover:text-[#05998b]"
                  title="Reveal Hint"
                  id="toggle-hint-btn"
                >
                  <Lightbulb className={`w-5 h-5 ${showHint ? 'text-amber-500 fill-amber-500/10' : ''}`} />
                </button>
              </div>

              {/* Hint output window */}
              {showHint && (
                <div className="p-4 bg-[#121214] border border-zinc-800 rounded-xl space-y-2 shadow-inner" id="hint-drawer">
                  <div className="flex items-center gap-1.5 text-[#05998b] text-[10px] font-bold uppercase font-mono tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#05998b]" /> CODE ASSISTANT HINT
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                    {lesson.hint}
                  </p>
                </div>
              )}

              {/* Navigation Action Panel */}
              <div className="pt-2 border-t border-zinc-850 space-y-2.5" id="navigation-controls-block">
                <div className="flex gap-2" id="prev-next-buttons-container">
                  <button
                    onClick={onPrevLesson}
                    disabled={isFirstLesson}
                    className="flex-1 flex items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 font-bold text-xs disabled:opacity-20 disabled:hover:text-zinc-300 disabled:cursor-not-allowed transition duration-200 cursor-pointer active:scale-95"
                    id="prev-lesson-btn"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous Lesson</span>
                  </button>

                  <button
                    onClick={onNextLesson}
                    disabled={isLastLesson}
                    className="flex-1 flex items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 font-bold text-xs disabled:opacity-20 disabled:hover:text-zinc-300 disabled:cursor-not-allowed transition duration-200 cursor-pointer active:scale-95"
                    id="next-lesson-footer-btn"
                  >
                    <span>Next Lesson</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {hasCompleted && (
                  <button
                    onClick={onNextLesson}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-[#05998b] hover:bg-[#04877b] text-white font-bold text-xs rounded-lg shadow-lg active:scale-95 transition-all duration-300 shadow-[#05998b]/20 cursor-pointer"
                    id="next-lesson-cta-btn"
                  >
                    NEXT SEQUENTIAL CHAPTER 
                    <ChevronRight className="w-4 h-4 text-white stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

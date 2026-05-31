/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LESSONS } from '../lessonsConfig';
import { Lesson, UserProgress } from '../types';
import { 
  BookOpen, 
  CheckCircle, 
  Flame, 
  Play, 
  Award, 
  RotateCcw,
  Zap,
  BookMarked,
  User,
  ExternalLink,
  Search
} from 'lucide-react';
import { searchLessons, SearchResult } from '../utils/searchEngine';

interface DashboardProps {
  progress: UserProgress;
  onSelectLesson: (slug: string) => void;
  onResetProgress: () => void;
  userEmail?: string;
}

export default function Dashboard({ 
  progress, 
  onSelectLesson, 
  onResetProgress,
  userEmail = 'learn@fastapi-interactive.dev'
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const totalLessons = Object.keys(LESSONS).length;
  const completedCount = progress.completedSlugs.length;
  const percentComplete = Math.round((completedCount / totalLessons) * 100);

  const searchResults: SearchResult[] = searchLessons(searchQuery);
  
  // Group lessons by module
  const modules: Record<string, Lesson[]> = {};
  Object.values(LESSONS).forEach(lesson => {
    if (!modules[lesson.module]) {
      modules[lesson.module] = [];
    }
    modules[lesson.module].push(lesson);
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans" id="dashboard-container">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between" id="dashboard-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#05998b] flex items-center justify-center text-white font-bold shadow-lg shadow-[#05998b]/20" id="brand-logo">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              FastAPI Interactive <span className="text-xs bg-zinc-900 text-[#05998b] font-mono px-2 py-0.5 rounded-full border border-zinc-850">WASM Sandbox</span>
            </h1>
            <p className="text-xs text-zinc-400">Master Python's modern API framework by doing</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User profile identifier (humble, no telemetry clutter) */}
          <div className="hidden sm:flex items-center gap-2.5 bg-zinc-950/60 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs" id="user-profile">
            <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-zinc-300 truncate max-w-[180px] font-mono">{userEmail}</span>
          </div>

          <button 
            onClick={() => onSelectLesson(progress.currentLessonSlug || 'first-steps')}
            className="flex items-center gap-2 bg-[#05998b] hover:bg-[#04877b] text-white font-bold px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-[#05998b]/10 active:scale-95"
            id="resume-learning-btn"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            Resume Learning
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10" id="dashboard-main">
        
        {/* Welcome Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0c0c0e] to-[#09090b] border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl" id="welcome-banner">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#05998b]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-zinc-900/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
          
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#05998b]/10 text-[#05998b] border border-[#05998b]/20" id="curriculum-badge">
              <Award className="w-3.5 h-3.5" /> Curriculum Approved
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Your FastAPI Path of Mastery</h2>
            <p className="text-zinc-350 leading-relaxed text-sm">
              Build functional FastAPI web applications completely in your browser. 
              Write code, configure real-time schemas, run mock API HTTP requests, 
              and pass embedded assertion validator test-suites.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 justify-center md:justify-start">
              <a 
                href="https://fastapi.tiangolo.com/" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-[#05998b] hover:text-[#04877b] flex items-center gap-1 font-medium transition"
              >
                Official FastAPI Docs <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-zinc-700">|</span>
              <span className="text-xs text-zinc-500 font-mono">Pyodide Python 3.12 WASM Engine Built-in</span>
            </div>
          </div>

          {/* Stats Board */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:min-w-[320px]" id="stats-board">
            <div className="bg-[#0c0c0e] border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs text-zinc-400 font-medium mb-1">Total Progress</span>
              <div className="relative flex items-center justify-center" id="stat-radial">
                <span className="text-2xl font-bold text-white">{percentComplete}%</span>
              </div>
              <span className="text-xs font-mono text-zinc-500 mt-1">{completedCount} of {totalLessons} done</span>
            </div>

            <div className="bg-[#0c0c0e] border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs text-zinc-400 font-medium mb-1">Active Streak</span>
              <div className="flex items-center gap-2 text-amber-500">
                <Flame className="w-8 h-8 fill-amber-500/10 animate-pulse" />
                <span className="text-3xl font-extrabold text-white">1</span>
              </div>
              <span className="text-xs font-mono text-zinc-500 mt-2">Day active streak</span>
            </div>
          </div>
        </section>

        {/* Global Battery progress bar */}
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5" id="completion-battery-wrapper">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <BookMarked className="w-4 h-4 text-zinc-400" />
              Interactive Modules Course Progress
            </div>
            <span className="text-xs font-mono font-bold text-[#05998b]">{percentComplete}% Complete</span>
          </div>
          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
            <div 
              className="h-full bg-[#05998b] rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.max(percentComplete, 2)}%` }}
            ></div>
          </div>
        </div>

        {/* Search Section */}
        <section className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 space-y-4" id="dashboard-search-wrapper">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Search className="w-4 h-4 text-[#05998b]" />
            Search Course Content
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search concepts, variables, methods (e.g. 'router', 'get', 'Pydantic')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 pl-11 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-[#05998b]/80 transition-all font-sans"
              id="dashboard-search-input"
            />
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-3.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3 text-xs text-zinc-500 hover:text-zinc-350 bg-zinc-900 px-2.5 py-1 rounded cursor-pointer border border-zinc-800"
                id="clear-dashboard-search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results Display */}
          {searchQuery.trim() !== '' && (
            <div className="space-y-3 pt-2" id="dashboard-search-results">
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#05998b] font-bold block mb-1">
                Found {searchResults.length} Match{searchResults.length !== 1 ? 'es' : ''} for "{searchQuery}"
              </span>
              
              {searchResults.length > 0 ? (
                <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-1" id="search-results-list">
                  {searchResults.map((result) => (
                    <div 
                      key={result.slug}
                      onClick={() => onSelectLesson(result.slug)}
                      className="p-3.5 bg-zinc-950/40 border border-zinc-800 hover:border-[#05998b]/45 rounded-lg flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 group hover:bg-[#05998b]/5"
                      id={`search-result-card-${result.slug}`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold text-[#05998b] bg-[#05998b]/10 px-1.5 py-0.5 rounded border border-[#05998b]/20 uppercase tracking-widest shrink-0">
                            {result.module}
                          </span>
                          <h6 className="text-xs font-bold text-zinc-200 group-hover:text-[#05998b] transition-colors truncate">{result.title}</h6>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono italic truncate">{result.snippet}</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 group-hover:border-[#05998b]/40 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded transition-all">
                        Jump <ExternalLink className="w-3 h-3 text-[#05998b] stroke-[2.5]" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic py-2">No matching chapters found. Try searching for "response", "item_id", "body", "FastAPI" or "decorator".</p>
              )}
            </div>
          )}
        </section>

        {/* Modules Roadmap Grid */}
        <section className="space-y-6" id="course-roadmap">
          <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#05998b]" /> Course Syllabus & Chapters
          </h3>

          <div className="space-y-8">
            {Object.entries(modules).map(([moduleName, lessonList]) => {
              // Calculate completion score for this module
              const completedInModule = lessonList.filter(l => progress.completedSlugs.includes(l.slug)).length;
              const modulePercent = Math.round((completedInModule / lessonList.length) * 100);

              return (
                <div key={moduleName} className="space-y-4" id={`module-${moduleName.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h4 className="text-sm font-bold text-zinc-300 tracking-wider uppercase font-mono">
                      {moduleName}
                    </h4>
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-950 border border-zinc-800/80 px-2 py-1 rounded-md">
                      {completedInModule} / {lessonList.length} Completed ({modulePercent}%)
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {lessonList.map((lesson, idx) => {
                      const isCompleted = progress.completedSlugs.includes(lesson.slug);
                      const isActive = progress.currentLessonSlug === lesson.slug;
                      
                      // Identify sequencing to lock / guide the user
                      const prevIndexInKeys = Object.keys(LESSONS).indexOf(lesson.slug) - 1;
                      const hasUnlocked = prevIndexInKeys < 0 || progress.completedSlugs.includes(Object.keys(LESSONS)[prevIndexInKeys]);

                      return (
                        <div 
                          key={lesson.slug}
                          className={`group relative overflow-hidden flex items-center justify-between p-5 rounded-xl border transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-[#05998b]/5 border-[#05998b]/20 hover:border-[#05998b]/40' 
                              : isActive 
                                ? 'bg-zinc-950/40 border-[#05998b]/40 hover:border-[#05998b]/70 shadow-lg shadow-[#05998b]/5'
                                : hasUnlocked 
                                  ? 'bg-zinc-950/20 border-zinc-850 hover:bg-zinc-950/30 hover:border-zinc-700'
                                  : 'bg-zinc-950/10 border-zinc-900/60 opacity-60'
                          }`}
                          id={`lesson-card-${lesson.slug}`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Checkmark or Index */}
                            <div className="mt-1 flex-shrink-0">
                              {isCompleted ? (
                                <div className="w-6 h-6 rounded-full bg-[#05998b]/20 border border-[#05998b] flex items-center justify-center text-[#05998b]" id={`completed-${lesson.slug}`}>
                                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                                </div>
                              ) : (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                                  isActive 
                                    ? 'bg-[#05998b] text-white font-bold' 
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`} id={`index-${lesson.slug}`}>
                                  {idx + 1}
                                </div>
                              )}
                            </div>

                            {/* Core details */}
                            <div>
                              <h5 className="font-semibold text-white group-hover:text-[#05998b] transition-colors flex items-center gap-2">
                                {lesson.title}
                                {isActive && (
                                  <span className="text-[10px] bg-[#05998b]/10 border border-[#05998b]/30 text-[#05998b] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                                    Current
                                  </span>
                                )}
                              </h5>
                              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                                {lesson.tasks[0]} and {lesson.tasks.length - 1} other objective{(lesson.tasks.length - 1) !== 1 ? 's' : ''} to accomplish.
                              </p>
                              {/* Difficulty / tags */}
                              <div className="flex items-center gap-2 pt-2">
                                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                                  {lesson.tasks.length} objectives
                                </span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                  lesson.slug === "first-steps" || lesson.slug === "path-params"
                                    ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                                    : 'text-amber-400 bg-amber-500/5 border-amber-500/10'
                                }`}>
                                  {lesson.slug === "first-steps" || lesson.slug === "path-params" ? 'Beginner' : 'Intermediate'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action CTA */}
                          <div className="flex items-center gap-3">
                            {hasUnlocked ? (
                              <button
                                onClick={() => onSelectLesson(lesson.slug)}
                                className={`flex items-center gap-1.5 font-bold text-xs py-2 px-4 rounded-lg transition-all duration-300 ${
                                  isCompleted
                                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                                    : 'bg-[#05998b] hover:bg-[#04877b] text-white active:scale-95 shadow-md shadow-[#05998b]/20'
                                }`}
                                id={`action-btn-${lesson.slug}`}
                              >
                                {isCompleted ? 'Review' : isActive ? 'Resume' : 'Start'}
                                <Play className={`w-3 h-3 ${isCompleted ? 'fill-zinc-300 text-zinc-300' : 'fill-white text-white'}`} />
                              </button>
                            ) : (
                              <span className="text-xs text-zinc-500 font-mono px-3 py-1 bg-zinc-950/40 rounded border border-zinc-900">
                               Locked
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Global danger area reset */}
        <section className="pt-10 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-4" id="danger-section">
          <div>
            <h4 className="text-sm font-semibold text-white">Reset Course Data</h4>
            <p className="text-xs text-zinc-500 mt-0.5">Clears out your compiled checkpoints, active progress states and cached files.</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Are you absolutely sure you want to reset all your learning logs and code templates? This cannot be undone!")) {
                onResetProgress();
              }
            }}
            className="flex items-center gap-2 hover:bg-rose-500/15 hover:text-rose-400 text-zinc-400 border border-zinc-800 hover:border-rose-500/20 px-3.5 py-2 rounded-lg text-xs font-semibold transition duration-300"
            id="reset-progress-button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Sandbox Progress
          </button>
        </section>
      </main>
    </div>
  );
}

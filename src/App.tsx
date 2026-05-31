/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LESSONS } from './lessonsConfig';
import { PyodideStatus, ExecutionResult, MockRequestResult, UserProgress } from './types';
import Dashboard from './components/Dashboard';
import SyllabusPanel from './components/SyllabusPanel';
import EditorPanel from './components/EditorPanel';
import OutputPanel from './components/OutputPanel';
import { 
  Zap, 
  LayoutDashboard, 
  CheckCircle2, 
  HelpCircle, 
  ArrowLeft, 
  ChevronRight, 
  History,
  Lock,
  Cpu,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Navigation Layout mode: 'workspace' or 'dashboard'
  const [viewMode, setViewMode] = useState<'dashboard' | 'workspace'>('workspace');
  
  // Lessons navigation active selection
  const [currentLessonSlug, setCurrentLessonSlug] = useState<string>('first-steps');
  
  // Array of successfully completed lesson slugs
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  
  // Cache of user's written source code mapped by lesson slug
  const [lessonCodes, setLessonCodes] = useState<Record<string, string>>({});
  
  // Pyodide active load status
  const [pyodideStatus, setPyodideStatus] = useState<PyodideStatus>({
    status: 'IDLE',
    message: 'Preparing local virtual environments...'
  });

  // Action status indicators
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isCheckingCode, setIsCheckingCode] = useState<boolean>(false);
  const [isExecutingRequest, setIsExecutingRequest] = useState<boolean>(false);

  // Results outputs
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [mockRequestResult, setMockRequestResult] = useState<MockRequestResult | null>(null);
  const [testFeedback, setTestFeedback] = useState<{ passed: boolean; message: string; visible: boolean } | null>(null);

  // Tab indices
  const [activeLeftTab, setActiveLeftTab] = useState<'learn' | 'tasks'>('learn');
  const [activeRightTab, setActiveRightTab] = useState<'preview' | 'docs' | 'terminal'>('preview');

  // Web Worker Ref and test trigger tracker
  const workerRef = useRef<Worker | null>(null);
  const isPendingTestRef = useRef<boolean>(false);

  // 1. Initial Load of Saved checkpoints from local storage
  useEffect(() => {
    try {
      const savedCompleted = localStorage.getItem('fastapi_completed');
      if (savedCompleted) {
        setCompletedSlugs(JSON.parse(savedCompleted));
      }
      
      const savedLesson = localStorage.getItem('fastapi_current_lesson');
      if (savedLesson && LESSONS[savedLesson]) {
        setCurrentLessonSlug(savedLesson);
      }

      const savedCodesRaw = localStorage.getItem('fastapi_lesson_codes');
      if (savedCodesRaw) {
        setLessonCodes(JSON.parse(savedCodesRaw));
      }
    } catch (err) {
      console.error('Failed to load local storage state:', err);
    }
  }, []);

  // 2. Initialize the Web Worker for client-side Pyodide execution
  useEffect(() => {
    // Instantiate web worker pointing to public static script
    const worker = new Worker('/pyodide-worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const data = e.data;
      
      if (data.type === 'STATUS') {
        setPyodideStatus({
          status: data.status,
          message: data.message
        });
      } else if (data.type === 'RUN_CODE_RESULT') {
        const res = data.result;
        setIsExecuting(false);
        setExecutionResult(res);

        // Check if there was a compilation error
        if (!res.success) {
          // If a task test was pending, abort it and report the compile failure
          if (isPendingTestRef.current) {
            isPendingTestRef.current = false;
            setIsCheckingCode(false);
            setTestFeedback({
              passed: false,
              message: `Syntax/Compilation Error occurred during build. Check the Terminal stacktrace.`,
              visible: true
            });
            setActiveLeftTab('tasks');
          }
        } else {
          // Sync Swagger API schema and transition tab on successful code parsing
          if (res.has_app) {
            // Set active right tab to docs to review OpenAPI schema automatically if desired
          }
          
          // If code was compiling prior to run verification test scripts
          if (isPendingTestRef.current) {
            isPendingTestRef.current = false;
            // Dispatch RUN_TEST carrying current lesson validation tests
            worker.postMessage({
              type: 'RUN_TEST',
              testScript: LESSONS[currentLessonSlug].testScript
            });
          }
        }
      } else if (data.type === 'RUN_TEST_RESULT') {
        setIsCheckingCode(false);
        const res = data.result;
        
        // Merge stdout / stderr logs into terminal stacktrace if prints occurred during testing
        if (res.stdout || res.stderr) {
          setExecutionResult(prev => ({
            success: prev?.success ?? true,
            hasApp: prev?.hasApp ?? true,
            openapiSchema: prev?.openapiSchema,
            stdout: (prev?.stdout || '') + (res.stdout || ''),
            stderr: (prev?.stderr || '') + (res.stderr || '')
          }));
        }

        if (res.passed) {
          setTestFeedback({
            passed: true,
            message: res.message || 'Perfect! All test assertions passed successfully.',
            visible: true
          });

          // Add to completed lessons
          if (!completedSlugs.includes(currentLessonSlug)) {
            const updated = [...completedSlugs, currentLessonSlug];
            setCompletedSlugs(updated);
            localStorage.setItem('fastapi_completed', JSON.stringify(updated));
          }
        } else {
          setTestFeedback({
            passed: false,
            message: res.message || 'Validation failed. Analyze your current endpoint parameters.',
            visible: true
          });
        }
      } else if (data.type === 'MOCK_REQUEST_RESULT') {
        setIsExecutingRequest(false);
        setMockRequestResult({
          ...data.result,
          timeMs: Math.floor(Math.random() * 8) + 4 // beautiful real simulated telemetry
        });
      }
    };

    // Begin compilation sequence in sandbox worker
    worker.postMessage({ type: 'INIT' });

    return () => {
      worker.terminate();
    };
  }, [currentLessonSlug]);

  // Handler to sync edited code state with caching configurations
  const handleUpdateCode = (newCode: string) => {
    const updatedCodes = {
      ...lessonCodes,
      [currentLessonSlug]: newCode
    };
    setLessonCodes(updatedCodes);
    localStorage.setItem('fastapi_lesson_codes', JSON.stringify(updatedCodes));
  };

  // Extract ongoing code for current chapter
  const currentCode = lessonCodes[currentLessonSlug] !== undefined 
    ? lessonCodes[currentLessonSlug] 
    : LESSONS[currentLessonSlug]?.initialCode || '';

  // Sync refs for global keyboard shortcuts (bypasses direct dependency thrashing)
  const currentCodeRef = useRef<string>('');
  const pyodideStatusRef = useRef<PyodideStatus>(pyodideStatus);

  useEffect(() => {
    currentCodeRef.current = currentCode;
  }, [currentCode]);

  useEffect(() => {
    pyodideStatusRef.current = pyodideStatus;
  }, [pyodideStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Pyodide is fully ready
      if (pyodideStatusRef.current.status !== 'COMPLETED') return;

      const isEnter = e.key === 'Enter';
      const isModifierActive = e.ctrlKey || e.metaKey;

      if (isModifierActive && isEnter) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.shiftKey) {
          // Ctrl+Shift+Enter / Cmd+Shift+Enter -> Check Code / Run validation
          if (!workerRef.current) return;
          setIsCheckingCode(true);
          setTestFeedback(null);
          isPendingTestRef.current = true;
          workerRef.current.postMessage({
            type: 'RUN_CODE',
            code: currentCodeRef.current
          });
        } else {
          // Ctrl+Enter / Cmd+Enter -> Compile App
          if (!workerRef.current) return;
          setIsExecuting(true);
          workerRef.current.postMessage({
            type: 'RUN_CODE',
            code: currentCodeRef.current
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  // Trigger Pyodide code compilation and load module
  const handleCompileCode = () => {
    if (!workerRef.current || pyodideStatus.status !== 'COMPLETED') return;
    setIsExecuting(true);
    // Dispatch core code payload to compiler FS standard
    workerRef.current.postMessage({
      type: 'RUN_CODE',
      code: currentCode
    });
  };

  // Compile first, then automatically dispatch embedded verification tests
  const handleRunValidation = () => {
    if (!workerRef.current || pyodideStatus.status !== 'COMPLETED') return;
    setIsCheckingCode(true);
    setTestFeedback(null);
    
    // Flag sequence and update code filesystem
    isPendingTestRef.current = true;
    workerRef.current.postMessage({
      type: 'RUN_CODE',
      code: currentCode
    });
  };

  // Deliver simulated client-side http requests via test clients
  const handleSendMockRequest = (method: string, path: string, body: string) => {
    if (!workerRef.current || pyodideStatus.status !== 'COMPLETED') return;
    setIsExecutingRequest(true);
    workerRef.current.postMessage({
      type: 'MOCK_REQUEST',
      method,
      path,
      body,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  };

  // Navigate to specific chapter
  const handleSelectLesson = (slug: string) => {
    if (!LESSONS[slug]) return;
    setCurrentLessonSlug(slug);
    localStorage.setItem('fastapi_current_lesson', slug);
    setViewMode('workspace');
    
    // Clear outputs and validation reports
    setExecutionResult(null);
    setMockRequestResult(null);
    setTestFeedback(null);
    setActiveLeftTab('learn');
    setActiveRightTab('preview');
  };

  // Transition to next sequential lesson in the configuration roadmap
  const handleNextLesson = () => {
    const slugs = Object.keys(LESSONS);
    const currentIndex = slugs.indexOf(currentLessonSlug);
    if (currentIndex >= 0 && currentIndex < slugs.length - 1) {
      const nextSlug = slugs[currentIndex + 1];
      handleSelectLesson(nextSlug);
    } else {
      // Completed last lesson of course! Push them to dashboard to celebrate!
      setViewMode('dashboard');
    }
  };

  // Transition to previous sequential lesson
  const handlePrevLesson = () => {
    const slugs = Object.keys(LESSONS);
    const currentIndex = slugs.indexOf(currentLessonSlug);
    if (currentIndex > 0) {
      const prevSlug = slugs[currentIndex - 1];
      handleSelectLesson(prevSlug);
    }
  };

  // Reset entire course logs
  const handleResetProgress = () => {
    localStorage.removeItem('fastapi_completed');
    localStorage.removeItem('fastapi_current_lesson');
    localStorage.removeItem('fastapi_lesson_codes');
    setCompletedSlugs([]);
    setLessonCodes({});
    setCurrentLessonSlug('first-steps');
    setExecutionResult(null);
    setMockRequestResult(null);
    setTestFeedback(null);
    setViewMode('dashboard');
  };

  const totalLessons = Object.keys(LESSONS).length;
  const completedCount = completedSlugs.length;
  const percentComplete = Math.round((completedCount / totalLessons) * 100);

  const slugs = Object.keys(LESSONS);
  const isFirstLesson = slugs.indexOf(currentLessonSlug) === 0;
  const isLastLesson = slugs.indexOf(currentLessonSlug) === slugs.length - 1;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#09090b] text-zinc-150 font-sans" id="app-root-container">
      {/* 
        VIEW 1: Course Dashboard
      */}
      {viewMode === 'dashboard' ? (
        <Dashboard
          progress={{
            completedSlugs,
            lessonCode: lessonCodes,
            currentLessonSlug
          }}
          onSelectLesson={handleSelectLesson}
          onResetProgress={handleResetProgress}
          userEmail="singamsettyashrith@gmail.com"
        />
      ) : (
        /* 
          VIEW 2: Learning Workspace (Full 3-Panel Split)
        */
        <>
          {/* Header Workspace Navigation */}
          <header className="h-[52px] border-b border-zinc-800 bg-[#0c0c0e] px-4 flex items-center justify-between flex-shrink-0 z-30 shadow-md" id="workspace-header">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewMode('dashboard')}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 font-bold text-xs border border-zinc-850 hover:border-zinc-800 bg-[#121214] px-3 py-1.5 rounded transition cursor-pointer"
                id="back-dashboard-btn"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#05998b]" />
                <span>DASHBOARD</span>
              </button>
              
              <div className="hidden sm:block text-zinc-800">|</div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono tracking-widest text-[#05998b] bg-[#05998b]/10 px-1.5 py-0.5 rounded border border-[#05998b]/20 uppercase">
                  {LESSONS[currentLessonSlug]?.module}
                </span>
                <span className="text-xs font-bold text-zinc-200 tracking-tight">
                  {LESSONS[currentLessonSlug]?.title}
                </span>
              </div>
            </div>

            {/* Middle tracking course progress battery */}
            <div className="hidden md:flex items-center gap-3 bg-zinc-950/40 border border-zinc-80 px-3 py-1 bg-[#121214] border border-zinc-850 rounded text-xs">
              <span className="font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Course Completed</span>
              <div className="w-24 h-2 bg-zinc-950 rounded overflow-hidden border border-zinc-850 p-0.5">
                <div 
                  className="h-full bg-[#05998b] rounded transition-all duration-300"
                  style={{ width: `${Math.max(percentComplete, 2)}%` }}
                ></div>
              </div>
              <span className="font-mono text-[10px] text-[#05998b] font-extrabold">{completedCount}/{totalLessons} ({percentComplete}%)</span>
            </div>

            {/* Right side controllers */}
            <div className="flex items-center gap-3">
              {/* Quick chapter navigate widgets inline */}
              <div className="hidden sm:flex items-center gap-1 bg-[#121214] border border-zinc-850 rounded p-0.5">
                {Object.keys(LESSONS).map((slug, idx) => {
                  const isDone = completedSlugs.includes(slug);
                  const isSel = currentLessonSlug === slug;
                  return (
                    <button
                      key={slug}
                      onClick={() => handleSelectLesson(slug)}
                      className={`w-6 h-6 text-[10px] font-bold font-mono rounded transition flex items-center justify-center ${
                        isSel 
                          ? 'bg-[#05998b] text-white font-extrabold shadow-lg border border-[#05998b]'
                          : isDone
                            ? 'bg-[#05998b]/10 border border-[#05998b]/30 text-[#05998b] hover:bg-zinc-800'
                            : 'bg-transparent text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800/30'
                      }`}
                      title={LESSONS[slug].title}
                      id={`workspace-bubble-${slug}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {completedSlugs.includes(currentLessonSlug) && (
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider" id="course-passed-badge">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checked
                </div>
              )}
            </div>
          </header>

          {/* 3-Panel Main Workspace layout */}
          <div className="flex-1 flex overflow-hidden relative" id="workspace-layout">
            
            {/* Panel 1: Syllabus Controls (Left 30%) */}
            <aside className="w-[30%] min-w-[280px] max-w-[450px] flex-shrink-0 h-full overflow-hidden" id="left-pane">
              <SyllabusPanel
                lesson={LESSONS[currentLessonSlug]}
                activeTab={activeLeftTab}
                setActiveTab={setActiveLeftTab}
                onRunValidation={handleRunValidation}
                isCheckingCode={isCheckingCode}
                testFeedback={testFeedback}
                onNextLesson={handleNextLesson}
                onPrevLesson={handlePrevLesson}
                onSelectLesson={handleSelectLesson}
                isFirstLesson={isFirstLesson}
                isLastLesson={isLastLesson}
                hasCompleted={completedSlugs.includes(currentLessonSlug)}
              />
            </aside>

            {/* Panel 2: Editor (Center 40%) */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative" id="center-pane">
              <EditorPanel
                code={currentCode}
                onChangeCode={handleUpdateCode}
                status={pyodideStatus}
                onExecute={handleCompileCode}
                isExecuting={isExecuting}
              />
            </main>

            {/* Panel 3: Previews, OpenAPI and Terminals (Right 30%) */}
            <aside className="w-[30%] min-w-[300px] max-w-[480px] flex-shrink-0 h-full overflow-hidden" id="right-pane">
              <OutputPanel
                activeTab={activeRightTab}
                setActiveTab={setActiveRightTab}
                executionResult={executionResult}
                mockRequestResult={mockRequestResult}
                onSendMockRequest={handleSendMockRequest}
                isExecutingRequest={isExecutingRequest}
              />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

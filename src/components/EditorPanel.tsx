/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Editor from '@monaco-editor/react';
import { PyodideStatus } from '../types';
import { 
  Terminal, 
  Cpu, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle,
  PlayIcon,
  RefreshCw,
  Braces
} from 'lucide-react';

interface EditorPanelProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  status: PyodideStatus;
  onExecute: () => void;
  isExecuting: boolean;
}

export default function EditorPanel({
  code,
  onChangeCode,
  status,
  onExecute,
  isExecuting
}: EditorPanelProps) {
  
  // Format state classes for informative banners
  const getStatusColor = () => {
    switch(status.status) {
      case 'COMPLETED': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'ERROR': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default: return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    }
  };

  const isWasmReady = status.status === 'COMPLETED';

  return (
    <div className="h-full flex flex-col bg-[#121214] text-zinc-300" id="editor-panel">
      {/* Upper editor controller bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-850 bg-[#18181b]" id="editor-bar">
        <div className="flex items-center gap-2">
          {/* File tab matching mock tab layout */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#121214] border border-zinc-800 rounded text-xs font-semibold text-zinc-300" id="file-tab">
            <span className="w-1.5 h-1.5 rounded-full bg-[#05998b]"></span>
            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">main.py</span>
          </div>
        </div>

        {/* Compile trigger active buttons */}
        <div className="flex items-center gap-3">
          {/* Simple status badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono leading-none border rounded-full ${getStatusColor()}`} id="compiler-status-badge">
            <Cpu className="w-3 h-3 text-[#05998b]" />
            <span className="truncate max-w-[200px] text-zinc-400">{status.message}</span>
          </div>

          <button
            onClick={onExecute}
            disabled={!isWasmReady || isExecuting}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded text-xs font-bold transition duration-200 cursor-pointer ${
              isWasmReady 
                ? 'bg-[#05998b] hover:bg-[#04877b] text-white active:scale-95 shadow-md shadow-[#05998b]/20' 
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
            }`}
            id="run-code-editor-btn"
          >
            {isExecuting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <PlayIcon className="w-3.5 h-3.5 fill-white stroke-[0.5] text-white" />
            )}
            <span>COMPILE APP</span>
            <kbd className="hidden sm:inline-flex items-center bg-[#036259]/80 text-[8px] font-mono px-1.5 py-0.5 rounded text-teal-200 border border-teal-500/20 ml-1 select-none">
              Ctrl+Enter
            </kbd>
          </button>
        </div>
      </div>

      {/* Editor Main body container */}
      <div className="flex-1 relative bg-[#121214]" id="monaco-host-container">
        
        {/* Loading pyodide overlays */}
        {!isWasmReady && (
          <div className="absolute inset-0 bg-[#09090b]/95 z-40 flex flex-col items-center justify-center p-8 text-center space-y-6" id="editor-initializing-overlay">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse">
                <Cpu className="w-8 h-8 text-[#05998b]" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#05998b] rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#05998b] rounded-full flex items-center justify-center text-[10px] text-white font-bold font-mono">i</div>
            </div>
            
            <div className="space-y-2 max-w-sm">
              <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-tight font-mono">
                Initializing Python Sandbox
              </h4>
              <p className="text-xs text-zinc-400 leading-normal font-semibold">
                {status.message || 'Starting WebAssembly compiler nodes...'}
              </p>
            </div>

            {/* Simulated mini progressive loader bar */}
            <div className="w-48 h-1.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <div className={`h-full bg-[#05998b] rounded-full ${
                status.status === 'WASM_LOADING' ? 'w-1/4 animate-pulse' :
                status.status === 'MICROPIP_LOADING' ? 'w-2/4 animate-pulse' :
                status.status === 'DEPS_LOADING' ? 'w-3/4 animate-pulse' : 'w-full'
              }`}></div>
            </div>

            <div className="text-[10px] font-mono text-zinc-500 block max-w-xs leading-relaxed">
              FastAPI is compiled right on your device. Zero cloud delay, zero setups required.
            </div>
          </div>
        )}

        {/* Monaco Editor Component */}
        <Editor
          height="100%"
          language="python"
          value={code}
          theme="vs-dark"
          onChange={(val) => onChangeCode(val || '')}
          loading={
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <RefreshCw className="w-3 h-3 animate-spin text-[#05998b]" /> Formatting code environment...
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            lineDecorationsWidth: 4,
            glyphMargin: false,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            automaticLayout: true,
            tabSize: 4,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 12, bottom: 12 }
          }}
        />
      </div>
    </div>
  );
}

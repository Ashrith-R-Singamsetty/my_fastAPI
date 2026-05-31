/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ExecutionResult, MockRequestResult } from '../types';
import { 
  Globe, 
  Terminal, 
  BookOpen, 
  Send, 
  Clock, 
  Play, 
  ArrowRight,
  Database,
  Search,
  Eye,
  Settings,
  X,
  FileJson,
  Unlock,
  AlertCircle
} from 'lucide-react';

interface OutputPanelProps {
  activeTab: 'preview' | 'docs' | 'terminal';
  setActiveTab: (tab: 'preview' | 'docs' | 'terminal') => void;
  executionResult: ExecutionResult | null;
  mockRequestResult: MockRequestResult | null;
  onSendMockRequest: (method: string, path: string, body: string) => void;
  isExecutingRequest: boolean;
}

export default function OutputPanel({
  activeTab,
  setActiveTab,
  executionResult,
  mockRequestResult,
  onSendMockRequest,
  isExecutingRequest
}: OutputPanelProps) {
  // Mock Browser Address Bar States
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState<string>('/');
  const [requestBody, setRequestBody] = useState<string>('');
  
  // Swagger Custom Interactive States
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [tryItOutParams, setTryItOutParams] = useState<Record<string, string>>({});
  const [tryItOutBody, setTryItOutBody] = useState<string>('');
  const [tryItOutResponse, setTryItOutResponse] = useState<Record<string, any> | null>(null);

  // Sync request body placeholders based on route method
  useEffect(() => {
    if (method === 'POST' || method === 'PUT') {
      if (!requestBody) {
        setRequestBody('{\n  "name": "Portal Gun",\n  "price": 120.5,\n  "description": "Travels between dimensions"\n}');
      }
    }
  }, [method]);

  // Handle mock sender
  const handleSendRequest = () => {
    onSendMockRequest(method, path, requestBody);
  };

  // Safe JSON display helper
  const renderJSON = (content: string) => {
    try {
      const obj = JSON.parse(content);
      return (
        <pre className="font-mono text-xs text-[#05998b] overflow-x-auto whitespace-pre p-3 bg-zinc-950 border border-zinc-900 rounded max-h-[300px]">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return (
        <pre className="font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre p-3 bg-zinc-950 border border-zinc-900 rounded max-h-[300px]">
          {content}
        </pre>
      );
    }
  };

  // Convert schema ref like "#/components/schemas/Item" to real schema object
  const resolveSchemaRef = (ref: string, openapi: any) => {
    if (!ref || !openapi) return null;
    const parts = ref.split('/');
    let current = openapi;
    for (let part of parts) {
      if (part === '#') continue;
      if (current[part]) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  };

  // Run a mock Request from Swagger TRY IT OUT directly!
  const runSwaggerTryItOut = (routeKey: string, routePath: string, routeMethod: string) => {
    // Construct path by replacing path params like {item_id}
    let compiledPath = routePath;
    const matches = routePath.match(/{([^}]+)}/g);
    if (matches) {
      matches.forEach(m => {
        const paramName = m.replace(/[{}]/g, '');
        const val = tryItOutParams[routeKey + '_' + paramName] || '1';
        compiledPath = compiledPath.replace(m, val);
      });
    }

    // Add query params if any
    const queryParts: string[] = [];
    Object.entries(tryItOutParams).forEach(([key, val]) => {
      if (key.startsWith(routeKey + '_query_') && val) {
        const paramName = key.replace(routeKey + '_query_', '');
        queryParts.push(`${paramName}=${encodeURIComponent(val)}`);
      }
    });

    if (queryParts.length > 0) {
      compiledPath += `?${queryParts.join('&')}`;
    }

    // Trigger execution
    onSendMockRequest(routeMethod.toUpperCase(), compiledPath, tryItOutBody);
    
    // Switch active tab to preview to let user see response immediately!
    setActiveTab('preview');
    // Also sync the address bar for delightful integration
    setMethod(routeMethod.toUpperCase());
    setPath(compiledPath);
    setRequestBody(tryItOutBody);
  };

  // OpenAPI Paths List
  const openapi = executionResult?.openapiSchema;
  const paths = openapi?.paths || {};

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] border-l border-zinc-800" id="output-panel">
      {/* Tab bar header */}
      <div className="flex border-b border-zinc-800 bg-[#09090b]" id="output-tabs-header">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'preview'
              ? 'border-b-2 border-[#05998b] text-zinc-100 bg-zinc-900/30'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
          id="tab-preview"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>PREVIEW</span>
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'docs'
              ? 'border-b-2 border-[#05998b] text-zinc-100 bg-zinc-900/30'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
          id="tab-docs"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>SWAGGER DOCS</span>
        </button>
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'terminal'
              ? 'border-b-2 border-[#05998b] text-zinc-100 bg-zinc-900/30'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
          id="tab-terminal"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>TERMINAL</span>
          {(executionResult?.stdout || executionResult?.stderr) && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          )}
        </button>
      </div>

      {/* Main Area Viewports */}
      <div className="flex-1 overflow-y-auto p-5" id="output-viewport">
        
        {/* PREVIEW TAB: Sandbox Mock Client */}
        {activeTab === 'preview' && (
          <div className="space-y-5" id="preview-tab-content">
            {/* Address Bar UI */}
            <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-3.5 shadow-md">
              <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 font-bold">
                HTTPS Sandbox Client
              </span>

              <div className="flex gap-2">
                {/* Method selector */}
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 rounded text-xs font-bold text-[#05998b] font-mono outline-none focus:border-[#05998b] transition cursor-pointer"
                  id="preview-method-select"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>

                {/* Path input */}
                <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded px-2.5 gap-1 shadow-inner">
                  <span className="text-xs text-zinc-500 font-mono font-medium">localhost:8000</span>
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                    placeholder="/"
                    className="flex-1 bg-transparent border-0 outline-none p-0 text-xs font-mono text-white placeholder-zinc-700"
                    id="preview-path-input"
                  />
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSendRequest}
                  disabled={isExecutingRequest}
                  className="bg-[#05998b] hover:bg-[#04877b] text-white px-3.5 py-1.5 rounded flex items-center justify-center transition active:scale-95 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-[#05998b]/20"
                  id="preview-send-btn"
                >
                  <Send className={`w-3.5 h-3.5 text-white ${isExecutingRequest ? 'animate-ping' : ''}`} />
                </button>
              </div>

              {/* POST/PUT payload editor textareas */}
              {(method === 'POST' || method === 'PUT') && (
                <div className="space-y-1.5" id="preview-payload">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5 text-[#05998b]" /> JSON BODY PAYLOAD
                  </label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full h-24 bg-zinc-950 border border-zinc-80 border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-300 outline-none focus:border-[#05998b]/50"
                    placeholder="{}"
                    id="preview-body-textarea"
                  />
                </div>
              )}
            </div>

            {/* Response Rendering Output */}
            <div className="space-y-2.5" id="preview-response-section">
              <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 font-bold">
                HTTP Response Details
              </span>

              {mockRequestResult ? (
                <div className="bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                  {/* Status header bar */}
                  <div className="flex items-center justify-between bg-zinc-950/80 px-4 py-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded ${
                        mockRequestResult.statusCode >= 200 && mockRequestResult.statusCode < 300
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : mockRequestResult.statusCode >= 400 && mockRequestResult.statusCode < 500
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-450'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-450'
                      }`} id="preview-status-badge">
                        STATUS: {mockRequestResult.statusCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-mono font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#05998b]" />
                        {mockRequestResult.timeMs || 4}ms
                      </span>
                      <span>|</span>
                      <span>JSON</span>
                    </div>
                  </div>

                  {/* Body logs */}
                  <div className="p-4 bg-zinc-950/25" id="preview-response-body">
                    {renderJSON(mockRequestResult.body)}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center" id="preview-welcome-placeholder">
                  <Globe className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-bold">No HTTP queries executed yet.</p>
                  <p className="text-[10px] text-zinc-650 font-mono mt-1 max-w-sm mx-auto leading-relaxed">Set route paths in your sandbox above and hit enter to inspect raw JSON payloads.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOCS TAB: Autogenerated Swagger Visualizer */}
        {activeTab === 'docs' && (
          <div className="space-y-5" id="docs-tab-content">
            <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 font-bold block mb-1">
              Interactive OpenAPI Spec (Swagger)
            </span>

            {openapi && Object.keys(paths).length > 0 ? (
              <div className="space-y-4" id="swagger-doc-routing-tree">
                {/* Visual Metadata API details */}
                <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-1.5 shadow-md">
                  <h4 className="text-sm font-bold text-zinc-100 tracking-tight">{openapi.info?.title || 'FastAPI Application'}</h4>
                  <p className="text-xs text-zinc-400 leading-normal font-semibold">Version: <span className="font-mono text-[#05998b] bg-[#05998b]/10 px-1.5 py-0.5 rounded text-[10px]">{openapi.info?.version || '0.1.0'}</span></p>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{openapi.info?.description || 'No custom description provided inside your FastAPI initialization.'}</p>
                </div>

                {/* Paths mappings */}
                <div className="space-y-2.5">
                  {Object.entries(paths).map(([pathKey, pathObj]: [string, any]) => {
                    return Object.entries(pathObj).map(([methodKey, opObj]: [string, any]) => {
                      const routeId = `${methodKey}_${pathKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
                      const isExpanded = expandedRoute === routeId;
                      const methodColor = 
                        methodKey === 'get' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        methodKey === 'post' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        methodKey === 'put' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-450 border-rose-500/20';

                      // Extract path schema parameters
                      const params = opObj.parameters || [];
                      
                      // Extract Request Body schematic if POST/PUT
                      let bodyProperties: Record<string, any> = {};
                      let bodyRefName = '';
                      const reqBodyContent = opObj.requestBody?.content?.['application/json'];
                      if (reqBodyContent?.schema?.$ref) {
                        const resolved = resolveSchemaRef(reqBodyContent.schema.$ref, openapi);
                        if (resolved) {
                          bodyProperties = resolved.properties || {};
                          bodyRefName = resolved.title || 'ItemModel';
                        }
                      }

                      return (
                        <div 
                          key={routeId}
                          className="bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300"
                          id={`docs-route-card-${routeId}`}
                        >
                          {/* Route directory bar click trigger */}
                          <div
                            onClick={() => {
                              setExpandedRoute(isExpanded ? null : routeId);
                              // Sync base request body for try-it-out on expand
                              if (Object.keys(bodyProperties).length > 0) {
                                const placeholder: Record<string, any> = {};
                                Object.entries(bodyProperties).forEach(([propName, propDef]: [string, any]) => {
                                  placeholder[propName] = propDef.type === 'number' || propDef.type === 'integer' ? 10.0 : propDef.default !== undefined ? propDef.default : "string";
                                });
                                setTryItOutBody(JSON.stringify(placeholder, null, 2));
                              }
                            }}
                            className="p-3 bg-zinc-950/40 hover:bg-zinc-950/70 flex items-center justify-between cursor-pointer select-none transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase font-mono ${methodColor}`}>
                                {methodKey}
                              </span>
                              <span className="font-mono text-xs font-semibold text-zinc-300">{pathKey}</span>
                            </div>
                            <span className="text-xs text-zinc-500 font-semibold font-mono hover:text-zinc-300">
                              {opObj.summary || 'Path operation'}
                            </span>
                          </div>

                          {/* Expanded detailed specifications */}
                          {isExpanded && (
                            <div className="p-4 border-t border-zinc-850 bg-zinc-950/20 space-y-4 text-xs">
                              {/* Route Decs */}
                              {opObj.description && (
                                <p className="text-zinc-400 italic mb-2 pl-1 border-l-2 border-[#05998b]/35">
                                  {opObj.description}
                                </p>
                              )}

                              {/* Parameters list (Path/Query) */}
                              {params.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider pl-0.5 animate-pulse">Parameters</span>
                                  <div className="bg-zinc-950/60 rounded border border-zinc-900 divide-y divide-zinc-900/60 overflow-hidden">
                                    {params.map((p: any) => {
                                      const inputKey = `${routeId}_${p.in === 'query' ? 'query_' : ''}${p.name}`;
                                      return (
                                        <div key={p.name} className="p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-zinc-950/35">
                                          <div>
                                            <span className="font-mono font-bold text-zinc-200">{p.name}</span>
                                            <span className="mx-2 text-zinc-600 font-mono">({p.in})</span>
                                            <span className="text-[10px] font-mono text-amber-500 capitalize">{p.schema?.type || 'any'}</span>
                                            {p.required && <span className="ml-2 text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono uppercase font-bold">required</span>}
                                          </div>
                                          
                                          {/* Mini Input Box inside Try It Out inside Swagger */}
                                          <input
                                            type="text"
                                            placeholder={`value (${p.schema?.type || 'string'})`}
                                            value={tryItOutParams[inputKey] || ''}
                                            onChange={(e) => setTryItOutParams({ ...tryItOutParams, [inputKey]: e.target.value })}
                                            className="bg-zinc-950 border border-zinc-800 text-zinc-200 px-2 py-1 rounded text-xs font-mono outline-none focus:border-[#05998b]"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Document JSON Request Schema */}
                              {Object.keys(bodyProperties).length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider pl-0.5">
                                      Request Body Schema ({bodyRefName})
                                    </span>
                                  </div>
                                  <div className="bg-zinc-950/30 rounded border border-zinc-850 p-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                      {Object.entries(bodyProperties).map(([propName, propDef]: [string, any]) => (
                                        <div key={propName} className="text-zinc-400 p-1.5 bg-zinc-950 rounded border border-zinc-900">
                                          <span className="font-bold text-zinc-200">{propName}</span>: <span className="text-[#05998b] capitalize font-bold">{propDef.type}</span>
                                          {propDef.description && <p className="text-[9px] text-zinc-500 font-normal mt-0.5">{propDef.description}</p>}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <label className="text-[9px] uppercase font-bold font-mono tracking-wider text-zinc-400">Request Body Editor</label>
                                      <textarea
                                        value={tryItOutBody}
                                        onChange={(e) => {
                                          setRequestBody(e.target.value);
                                          setTryItOutBody(e.target.value);
                                        }}
                                        className="w-full h-24 bg-zinc-950 border border-zinc-850 rounded p-2 text-xs font-mono text-[#05998b] outline-none focus:border-[#05998b]/50"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* TRY IT OUT EXECUTION ACTION PANEL */}
                              <div className="pt-2">
                                <button
                                  onClick={() => runSwaggerTryItOut(routeId, pathKey, methodKey)}
                                  className="w-full bg-[#05998b]/10 border border-[#05998b]/30 hover:bg-[#05998b] text-[#05998b] hover:text-white py-2 rounded font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95 shadow shadow-[#05998b]/10"
                                  id={`try-it-out-run-${routeId}`}
                                >
                                  <Play className="w-3.5 h-3.5 fill-current stroke-[1.5]" />
                                  EXECUTE ROUTE INTERFACE
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center" id="docs-missing-placeholder">
                <Globe className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 font-bold">No operational FastAPI class detected.</p>
                <p className="text-[10px] text-zinc-550 font-mono mt-1 leading-normal max-w-sm mx-auto">Include 'app = FastAPI()' inside main.py, and click the Compile App button to inspect parameters and schemas dynamically.</p>
              </div>
            )}
          </div>
        )}

        {/* TERMINAL TAB: Standard Prints logs and error traceback feeds */}
        {activeTab === 'terminal' && (
          <div className="space-y-4 h-full flex flex-col" id="terminal-tab-content">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 font-bold">
                Local Environment console stream
              </span>
              {(executionResult?.stdout || executionResult?.stderr) && (
                <button
                  onClick={() => {
                    if (executionResult) {
                      executionResult.stdout = '';
                      executionResult.stderr = '';
                      // update by cloning
                      setActiveTab('terminal');
                    }
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-450 font-mono flex items-center bg-transparent border-0 cursor-pointer"
                  id="clear-terminal-btn"
                >
                  [CLEAR TERMINAL LOGS]
                </button>
              )}
            </div>

            {/* Simulated interactive Terminal */}
            <div 
              className="flex-1 bg-zinc-950 border border-zinc-900 p-4 rounded font-mono text-xs overflow-y-auto space-y-3.5 min-h-[350px] shadow-inner text-zinc-300"
              id="terminal-screen"
            >
              {/* Init logs */}
              <div className="text-[10px] text-zinc-550 border-b border-zinc-900/60 pb-2 flex items-center justify-between" id="terminal-watermark">
                <span>SYSTEM INTERPRETER INITIALIZED</span>
                <span>UTC CLOCK FEED ACTIVE</span>
              </div>

              {/* print / standard out events */}
              {executionResult?.stdout && (
                <div id="stdout-segment">
                  <span className="text-[9px] uppercase tracking-wider bg-[#05998b]/10 border border-[#05998b]/20 text-[#05998b] font-bold px-1.5 py-0.5 rounded">STDOUT</span>
                  <pre className="mt-1.5 text-xs text-zinc-300/95 font-mono bg-zinc-900/20 p-2 rounded border border-zinc-900 whitespace-pre overflow-x-auto select-text shadow-inner">
                    {executionResult.stdout}
                  </pre>
                </div>
              )}

              {/* traceback errors / standard err events */}
              {executionResult?.stderr && (
                <div id="stderr-segment">
                  <span className="text-[9px] uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold px-1.5 py-0.5 rounded">Traceback Logs</span>
                  <pre className="mt-1.5 text-xs text-rose-400 font-mono bg-rose-950/5 p-3 rounded border border-rose-950/15 whitespace-pre overflow-x-auto select-text shadow-inner">
                    {executionResult.stderr}
                  </pre>
                </div>
              )}

              {/* Idle empty prompt */}
              {(!executionResult?.stdout && !executionResult?.stderr) && (
                <div className="text-zinc-500 italic text-[11px] py-6 text-center" id="empty-prompt">
                  <AlertCircle className="w-5 h-5 mx-auto text-zinc-700 mb-1" />
                  Terminal console is currently empty.<br />
                  <span className="text-[9px] font-mono not-italic text-zinc-600 block mt-1 leading-relaxed">Any print() loggings or syntax stacktraces will register automatically when you compile your scripts.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

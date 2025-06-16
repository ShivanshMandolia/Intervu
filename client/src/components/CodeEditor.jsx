// src/components/CodeEditor.jsx - Enhanced with Shared Compilation and Input
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCodeEditor } from '../context/CodeEditorContext';
import { useAuth } from '../context/auth/AuthContext';
import { 
  PlayIcon, 
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  EyeIcon,
  CodeBracketIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

// Enhanced Remote Cursor component with proper positioning
const RemoteCursor = ({ cursor, color, textareaRef }) => {
  const { position, user, selection } = cursor;
  const [cursorStyle, setCursorStyle] = useState({});

  useEffect(() => {
    if (!textareaRef.current || !position) return;

    const textarea = textareaRef.current;
    const computedStyle = window.getComputedStyle(textarea);
    
    // Get actual font metrics
    const fontSize = parseFloat(computedStyle.fontSize);
    const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;
    
    // Calculate character width more accurately
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontSize}px ${computedStyle.fontFamily}`;
    const charWidth = context.measureText('M').width; // Use 'M' for monospace estimation
    
    // Get textarea padding and border
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    
    // Calculate position accounting for scroll
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;
    
    const top = paddingTop + borderTop + (position.line * lineHeight) - scrollTop;
    const left = paddingLeft + borderLeft + (position.ch * charWidth) - scrollLeft;
    
    setCursorStyle({
      top: `${top}px`,
      left: `${left}px`,
      height: `${lineHeight}px`
    });
  }, [position, textareaRef]);

  if (!position) return null;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={cursorStyle}
    >
      {/* Selection highlight (if exists) */}
      {selection && (
        <div
          className="absolute opacity-30"
          style={{
            backgroundColor: color,
            width: `${(selection.end - selection.start) * 8.4}px`,
            height: '100%',
            top: 0,
            left: 0
          }}
        />
      )}
      
      {/* Cursor line */}
      <div
        className="w-0.5 h-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      
      {/* User label */}
      <div
        className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap z-60"
        style={{ backgroundColor: color }}
      >
        {user?.name || user?.username || user?.email?.split('@')[0] || 'Anonymous'}
      </div>
    </div>
  );
};

// Language selector component
const LanguageSelector = ({ language, onLanguageChange }) => {
  const supportedLanguages = [
    { key: 'cpp', name: 'C++', icon: '🔧' },
    { key: 'c', name: 'C', icon: '⚙️' },
    { key: 'java', name: 'Java', icon: '☕' },
    { key: 'python', name: 'Python', icon: '🐍' },
    { key: 'javascript', name: 'JavaScript', icon: '🟨' },
    { key: 'typescript', name: 'TypeScript', icon: '🔷' },
    { key: 'csharp', name: 'C#', icon: '🔵' },
    { key: 'go', name: 'Go', icon: '🔵' },
    { key: 'rust', name: 'Rust', icon: '🦀' },
    { key: 'php', name: 'PHP', icon: '🐘' },
    { key: 'ruby', name: 'Ruby', icon: '💎' },
    { key: 'swift', name: 'Swift', icon: '🍎' },
    { key: 'kotlin', name: 'Kotlin', icon: '🟣' },
    { key: 'scala', name: 'Scala', icon: '🔴' }
  ];

  return (
    <select
      value={language}
      onChange={(e) => onLanguageChange(e.target.value)}
      className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    >
      {supportedLanguages.map((lang) => (
        <option key={lang.key} value={lang.key}>
          {lang.icon} {lang.name}
        </option>
      ))}
    </select>
  );
};

// Active users display with compilation status
const ActiveUsers = ({ remoteCursors, getUserColor, compilationStartedBy, isCompiling }) => {
  const activeUsers = Object.entries(remoteCursors);
  
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <UserGroupIcon className="h-4 w-4 text-gray-400" />
        <div className="flex space-x-1">
          {activeUsers.map(([userId, cursor]) => (
            <div
              key={userId}
              className="relative w-3 h-3 rounded-full border border-white"
              style={{ backgroundColor: getUserColor(userId) }}
              title={cursor.user?.username || cursor.user?.email || 'Anonymous'}
            >
              {/* Show compilation indicator */}
              {isCompiling && compilationStartedBy?._id === userId && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {activeUsers.length} active
        </span>
      </div>
      
      {/* Compilation status indicator */}
      {isCompiling && (
        <div className="flex items-center space-x-1 text-yellow-400">
          <ArrowPathIcon className="h-3 w-3 animate-spin" />
          <span className="text-xs">
            {compilationStartedBy?.username || compilationStartedBy?.email?.split('@')[0] || 'Someone'} is compiling...
          </span>
        </div>
      )}
    </div>
  );
};

// Enhanced compilation result component with shared results indicator
const CompilationResult = ({ result, error, isCompiling, lastCompiledBy, compilationStartedBy }) => {
  if (isCompiling) {
    return (
      <div className="bg-yellow-900 border border-yellow-600 p-4 rounded">
        <div className="flex items-center space-x-2 text-yellow-200">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          <span className="font-medium">
            {compilationStartedBy?.username || compilationStartedBy?.email?.split('@')[0] || 'Someone'} is compiling and executing...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-600 p-4 rounded">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-red-200">
            <XCircleIcon className="h-5 w-5" />
            <span className="font-medium">Execution Error</span>
          </div>
          {lastCompiledBy && (
            <span className="text-xs text-red-300">
              by {lastCompiledBy.username || lastCompiledBy.email?.split('@')[0]}
            </span>
          )}
        </div>
        <pre className="text-red-100 text-sm whitespace-pre-wrap overflow-x-auto">{error}</pre>
      </div>
    );
  }

  if (!result) return null;

  const hasCompileError = result.compile?.stderr;
  const hasRuntimeError = result.run?.stderr;
  const hasOutput = result.run?.stdout;

  return (
    <div className="space-y-3">
      {/* Execution Status */}
      <div className={`p-3 rounded border ${
        result.success 
          ? 'bg-green-900 border-green-600 text-green-200' 
          : 'bg-red-900 border-red-600 text-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {result.success ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
            <span className="font-medium">
              {result.success ? 'Execution Successful' : 'Execution Failed'}
            </span>
            {lastCompiledBy && (
              <span className="text-xs opacity-75">
                by {lastCompiledBy.username || lastCompiledBy.email?.split('@')[0]}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-xs">
            {result.executionTime && (
              <span className="flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>{result.executionTime}ms</span>
              </span>
            )}
            {result.version && (
              <span className="opacity-75">
                {result.language} {result.version}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compile Errors */}
      {hasCompileError && (
        <div className="bg-red-900 border border-red-600 p-3 rounded">
          <h4 className="font-medium text-red-200 mb-2 flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Compilation Errors:
          </h4>
          <pre className="text-red-100 text-sm whitespace-pre-wrap overflow-x-auto bg-red-950 p-2 rounded">
            {result.compile.stderr}
          </pre>
        </div>
      )}

      {/* Runtime Errors */}
      {hasRuntimeError && (
        <div className="bg-orange-900 border border-orange-600 p-3 rounded">
          <h4 className="font-medium text-orange-200 mb-2 flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Runtime Errors:
          </h4>
          <pre className="text-orange-100 text-sm whitespace-pre-wrap overflow-x-auto bg-orange-950 p-2 rounded">
            {result.run.stderr}
          </pre>
        </div>
      )}

      {/* Output */}
      {hasOutput && (
        <div className="bg-gray-800 border border-gray-600 p-3 rounded">
          <h4 className="font-medium text-gray-200 mb-2 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Program Output:
          </h4>
          <pre className="text-gray-100 text-sm whitespace-pre-wrap overflow-x-auto bg-gray-900 p-2 rounded border border-gray-700">
            {result.run.stdout}
          </pre>
        </div>
      )}

      {/* No output message */}
      {!hasOutput && !hasCompileError && !hasRuntimeError && result.success && (
        <div className="bg-gray-800 border border-gray-600 p-3 rounded">
          <p className="text-gray-300 text-sm flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Program executed successfully with no output.
          </p>
        </div>
      )}
    </div>
  );
};

// Shared Input Component
const SharedInputSection = ({ programInput, onInputChange, inputUpdatedBy, currentUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <CommandLineIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Program Input (stdin)</span>
          {inputUpdatedBy && inputUpdatedBy._id !== currentUser?._id && (
            <span className="text-xs text-blue-400">
              • Updated by {inputUpdatedBy.username || inputUpdatedBy.email?.split('@')[0]}
            </span>
          )}
        </button>
        
        <div className="flex items-center space-x-2">
          {programInput && (
            <span className="text-xs text-gray-400">
              {programInput.split('\n').length} lines
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded transition-colors ${
              isExpanded ? 'text-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-3">
          <textarea
            value={programInput}
            onChange={onInputChange}
            className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono resize-none"
            rows="4"
            placeholder="Enter input data for your program (if required)...&#10;This input is shared with all participants in real-time."
          />
          <p className="text-xs text-gray-400 mt-1">
            💡 This input is shared with all participants and will be used when anyone runs the code.
          </p>
        </div>
      )}
    </div>
  );
};

const CodeEditor = ({ roomId }) => {
  const { user } = useAuth();
  const {
    code,
    language,
    programInput,
    remoteCursors,
    isCompiling,
    compilationResult,
    compilationError,
    lastUpdatedBy,
    lastCompiledBy,
    compilationStartedBy,
    inputUpdatedBy,
    updateCode,
    updateCursor,
    updateInput,
    changeLanguage,
    compileAndExecute,
    insertTemplate,
    downloadCode,
    clearCompilationResults,
    getSupportedLanguages
  } = useCodeEditor();

  const textareaRef = useRef(null);
  const [localCode, setLocalCode] = useState(code || '');
  const [cursorPosition, setCursorPosition] = useState({ line: 0, ch: 0 });
  const updateTimeoutRef = useRef(null);
  const cursorUpdateTimeoutRef = useRef(null);

  // Enhanced user colors with better contrast
  const getUserColor = useCallback((userId) => {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // emerald
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange
      '#6366F1', // indigo
    ];
    
    // Create a consistent hash from userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Update local code when room code changes (from other users)
  useEffect(() => {
    if (code !== localCode && lastUpdatedBy?._id !== user?._id) {
      setLocalCode(code);
    }
  }, [code, localCode, lastUpdatedBy, user?._id]);

  // Handle code changes with debounced updates
  const handleCodeChange = useCallback((e) => {
    const newCode = e.target.value;
    setLocalCode(newCode);

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce updates to avoid too many socket emissions
    updateTimeoutRef.current = setTimeout(() => {
      updateCode(newCode, language);
    }, 300);
  }, [updateCode, language]);

  // Enhanced cursor position calculation
  const calculateCursorPosition = useCallback((textarea) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Calculate line and character position
    const textBeforeCursor = textarea.value.substring(0, start);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length - 1;
    const ch = lines[lines.length - 1].length;

    return {
      position: { line, ch },
      selection: start !== end ? { start, end } : null
    };
  }, []);

  // Handle cursor position updates with throttling
  const handleCursorChange = useCallback(() => {
    if (!textareaRef.current) return;

    const { position, selection } = calculateCursorPosition(textareaRef.current);
    setCursorPosition(position);

    // Clear existing timeout
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }

    // Throttle cursor updates to avoid spam
    cursorUpdateTimeoutRef.current = setTimeout(() => {
      updateCursor(position, selection);
    }, 100);
  }, [calculateCursorPosition, updateCursor]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage) => {
    changeLanguage(newLanguage);
  }, [changeLanguage]);

  // Handle template insertion
  const handleInsertTemplate = useCallback(() => {
    insertTemplate(language);
  }, [insertTemplate, language]);

  // Handle compilation (shared with all users)
  const handleCompile = useCallback(async () => {
    if (!localCode.trim()) {
      return;
    }
    await compileAndExecute();
  }, [localCode, compileAndExecute]);

  // Handle shared input change
  const handleInputChange = useCallback((e) => {
    updateInput(e.target.value);
  }, [updateInput]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl/Cmd + Enter to compile
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCompile();
    }
    
    // Tab key handling for proper indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tab character
      const newValue = localCode.substring(0, start) + '    ' + localCode.substring(end);
      setLocalCode(newValue);
      
      // Update cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        handleCursorChange();
      }, 0);
    }
  }, [handleCompile, localCode, handleCursorChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Filter remote cursors to exclude current user
  const filteredRemoteCursors = Object.fromEntries(
    Object.entries(remoteCursors).filter(([userId]) => userId !== user?._id)
  );

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <CodeBracketIcon className="h-5 w-5" />
              <span>Collaborative Code Editor</span>
            </h3>
            <ActiveUsers 
              remoteCursors={filteredRemoteCursors} 
              getUserColor={getUserColor}
              compilationStartedBy={compilationStartedBy}
              isCompiling={isCompiling}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSelector
              language={language}
              onLanguageChange={handleLanguageChange}
            />
            
            <button
              onClick={handleInsertTemplate}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              title="Insert code template"
            >
              Template
            </button>
            
            <button
              onClick={downloadCode}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Download code file"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Shared Program Input Section */}
      <SharedInputSection
        programInput={programInput}
        onInputChange={handleInputChange}
        inputUpdatedBy={inputUpdatedBy}
        currentUser={user}
      />

      {/* Code Editor */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          {/* Remote cursors container */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {Object.entries(filteredRemoteCursors).map(([userId, cursor]) => (
              <RemoteCursor
                key={userId}
                cursor={cursor}
                color={getUserColor(userId)}
                textareaRef={textareaRef}
              />
            ))}
          </div>
          
          {/* Code textarea */}
          <textarea
            ref={textareaRef}
            value={localCode}
            onChange={handleCodeChange}
            onSelect={handleCursorChange}
            onKeyUp={handleCursorChange}
            onKeyDown={handleKeyDown}
            onClick={handleCursorChange}
            className="w-full h-full bg-gray-900 text-white p-4 font-mono text-sm resize-none focus:outline-none border-none"
            placeholder={`Write your ${language.toUpperCase()} code here...\n\nTips:\n- Use Ctrl+Enter (Cmd+Enter on Mac) to compile and run\n- Use Tab for indentation\n- See other users' cursors in real-time\n- Compilation results are shared with all participants`}
            spellCheck={false}
            style={{ 
              minHeight: '400px',
              lineHeight: '1.5',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
            }}
          />
        </div>
        
        {/* Compile Button */}
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCompile}
                disabled={isCompiling || !localCode.trim()}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isCompiling ? (
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayIcon className="h-4 w-4 mr-2" />
                )}
                {isCompiling ? 'Executing...' : 'Compile & Run (Shared)'}
              </button>
              
              {(compilationResult || compilationError) && (
                <button
                  onClick={clearCompilationResults}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Clear Results
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span>Language: {language.toUpperCase()}</span>
              <span>Position: {cursorPosition.line + 1}:{cursorPosition.ch + 1}</span>
              <span>Ctrl+Enter to run</span>
            </div>
          </div>
        </div>

        {/* Shared Compilation Results */}
        <div className="bg-gray-800 p-4 max-h-80 overflow-y-auto border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
              <span>Shared Execution Results</span>
              {(lastCompiledBy || compilationStartedBy) && (
                <span className="text-xs text-blue-400">
                  • All participants see the same results
                </span>
              )}
            </h4>
            {compilationResult?.timestamp && (
              <span className="text-xs text-gray-500">
                {new Date(compilationResult.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {(compilationResult || compilationError || isCompiling) ? (
            <CompilationResult
              result={compilationResult}
              error={compilationError}
              isCompiling={isCompiling}
              lastCompiledBy={lastCompiledBy}
              compilationStartedBy={compilationStartedBy}
            />
          ) : (
            <div className="text-gray-400 text-sm bg-gray-900 p-4 rounded border border-gray-700 text-center">
              <PlayIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click "Compile & Run" to execute the shared code</p>
              <p className="text-xs mt-1 opacity-75">
                Results will be visible to all participants in real-time
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
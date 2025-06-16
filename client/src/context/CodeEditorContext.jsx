import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useRoom } from './RoomContext';
import { useAuth } from './auth/AuthContext';

const CodeEditorContext = createContext(null);

// Piston API configuration
const PISTON_API_BASE = 'https://emkc.org/api/v2/piston';

// Enhanced language configurations
const languageConfigs = {
  cpp: { language: 'cpp', version: '10.2.0', extension: 'cpp' },
  c: { language: 'c', version: '10.2.0', extension: 'c' },
  java: { language: 'java', version: '15.0.2', extension: 'java' },
  python: { language: 'python', version: '3.10.0', extension: 'py' },
  javascript: { language: 'javascript', version: '18.15.0', extension: 'js' },
  typescript: { language: 'typescript', version: '5.0.3', extension: 'ts' },
  csharp: { language: 'csharp', version: '6.12.0', extension: 'cs' },
  go: { language: 'go', version: '1.16.2', extension: 'go' },
  rust: { language: 'rust', version: '1.68.2', extension: 'rs' },
  php: { language: 'php', version: '8.2.3', extension: 'php' },
  ruby: { language: 'ruby', version: '3.0.1', extension: 'rb' },
  swift: { language: 'swift', version: '5.3.3', extension: 'swift' },
  kotlin: { language: 'kotlin', version: '1.8.20', extension: 'kt' },
  scala: { language: 'scala', version: '3.2.2', extension: 'scala' }
};

// Code templates
const codeTemplates = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  python: `# Python program
print("Hello, World!")

# You can add input like this:
# name = input("Enter your name: ")
# print(f"Hello, {name}!")`,
  javascript: `// JavaScript program
console.log("Hello, World!");

// You can read input in Node.js like this:
// const readline = require('readline');
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });`,
  typescript: `// TypeScript program
const message: string = "Hello, World!";
console.log(message);

// Example with types
interface Person {
    name: string;
    age: number;
}

const person: Person = {
    name: "Alice",
    age: 30
};

console.log(\`Hello, \${person.name}!\`);`,
  csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        
        // Example with input
        // Console.Write("Enter your name: ");
        // string name = Console.ReadLine();
        // Console.WriteLine($"Hello, {name}!");
    }
}`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    // Example with input
    // var name string
    // fmt.Print("Enter your name: ")
    // fmt.Scanln(&name)
    // fmt.Printf("Hello, %s!\\n", name)
}`,
  rust: `fn main() {
    println!("Hello, World!");
    
    // Example with input
    // use std::io;
    // let mut input = String::new();
    // println!("Enter your name:");
    // io::stdin().read_line(&mut input).expect("Failed to read line");
    // println!("Hello, {}!", input.trim());
}`,
  php: `<?php
echo "Hello, World!\\n";

// Example with input
// echo "Enter your name: ";
// $name = trim(fgets(STDIN));
// echo "Hello, $name!\\n";
?>`,
  ruby: `# Ruby program
puts "Hello, World!"

# Example with input
# print "Enter your name: "
# name = gets.chomp
# puts "Hello, #{name}!"`,
  swift: `import Foundation

print("Hello, World!")

// Example with input
// print("Enter your name: ", terminator: "")
// if let name = readLine() {
//     print("Hello, \\(name)!")
// }`,
  kotlin: `fun main() {
    println("Hello, World!")
    
    // Example with input
    // print("Enter your name: ")
    // val name = readLine()
    // println("Hello, $name!")
}`,
  scala: `object Main extends App {
    println("Hello, World!")
    
    // Example with input
    // print("Enter your name: ")
    // val name = scala.io.StdIn.readLine()
    // println(s"Hello, $name!")
}`
};

const codeEditorReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CODE':
      return {
        ...state,
        code: action.payload.code,
        language: action.payload.language || state.language,
        lastUpdatedBy: action.payload.updatedBy,
        lastUpdated: new Date()
      };
    
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload
      };
    
    case 'UPDATE_CURSOR':
      return {
        ...state,
        remoteCursors: {
          ...state.remoteCursors,
          [action.payload.userId]: {
            position: action.payload.position,
            selection: action.payload.selection,
            user: action.payload.user,
            timestamp: new Date()
          }
        }
      };
    
    case 'REMOVE_CURSOR':
      const newCursors = { ...state.remoteCursors };
      delete newCursors[action.payload.userId];
      return {
        ...state,
        remoteCursors: newCursors
      };
    
    case 'REMOVE_STALE_CURSORS': {
      const now = Date.now();
      const timeout = action.payload.timeout || 30000;
      const activeCursors = Object.fromEntries(
        Object.entries(state.remoteCursors).filter(
          ([, cursor]) => now - new Date(cursor.timestamp).getTime() < timeout
        )
      );
      return {
        ...state,
        remoteCursors: activeCursors
      };
    }
    
    case 'SET_COMPILATION_RESULT':
      return {
        ...state,
        compilationResult: action.payload.result,
        compilationError: action.payload.error,
        isCompiling: false,
        lastCompilationTime: new Date(),
        lastCompiledBy: action.payload.compiledBy
      };
    
    case 'SET_COMPILING':
      return {
        ...state,
        isCompiling: action.payload.isCompiling,
        compilationStartedBy: action.payload.startedBy,
        compilationError: action.payload.isCompiling ? null : state.compilationError
      };
    
    case 'SET_COMPILATION_ERROR':
      return {
        ...state,
        compilationError: action.payload,
        isCompiling: false,
        compilationResult: null
      };
    
    case 'SET_INPUT':
      return {
        ...state,
        programInput: action.payload.input,
        inputUpdatedBy: action.payload.updatedBy
      };
    
    case 'SET_AVAILABLE_LANGUAGES':
      return {
        ...state,
        availableLanguages: action.payload
      };
    
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        codeHistory: [
          ...state.codeHistory.slice(-49),
          {
            code: action.payload.code,
            language: action.payload.language,
            timestamp: new Date(),
            updatedBy: action.payload.updatedBy
          }
        ]
      };
    
    case 'CLEAR_COMPILATION':
      return {
        ...state,
        compilationResult: null,
        compilationError: null,
        isCompiling: false,
        lastCompiledBy: null,
        compilationStartedBy: null
      };
    
    case 'SET_ROOM_STATE':
      return {
        ...state,
        code: action.payload.code || state.code,
        language: action.payload.language || state.language,
        programInput: action.payload.programInput || state.programInput,
        lastCompilation: action.payload.lastCompilation || state.lastCompilation,
        remoteCursors: {},
        lastUpdated: new Date()
      };
    
    case 'RESET':
      return {
        ...initialState,
        availableLanguages: state.availableLanguages
      };
    
    default:
      return state;
  }
};

const initialState = {
  code: `// Welcome to the collaborative code editor!
// Start coding together in real-time!

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  language: 'cpp',
  programInput: '',
  remoteCursors: {},
  isCompiling: false,
  compilationResult: null,
  compilationError: null,
  codeHistory: [],
  lastUpdatedBy: null,
  lastUpdated: null,
  lastCompilationTime: null,
  lastCompiledBy: null,
  compilationStartedBy: null,
  inputUpdatedBy: null,
  availableLanguages: [],
  connectionStatus: 'disconnected'
};

export const useCodeEditor = () => {
  const context = useContext(CodeEditorContext);
  if (!context) {
    throw new Error('useCodeEditor must be used within a CodeEditorProvider');
  }
  return context;
};

export const CodeEditorProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { roomId } = useRoom();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(codeEditorReducer, initialState);

  // Fetch available languages from Piston API
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        console.log('🔍 Fetching available languages from Piston API...');
        const response = await fetch(`${PISTON_API_BASE}/runtimes`);
        if (response.ok) {
          const languages = await response.json();
          console.log('✅ Fetched languages:', languages.length);
          dispatch({
            type: 'SET_AVAILABLE_LANGUAGES',
            payload: languages
          });
        } else {
          console.error('❌ Failed to fetch languages:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching available languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  // Clean up stale cursors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({
        type: 'REMOVE_STALE_CURSORS',
        payload: { timeout: 30000 }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleCodeUpdate = (data) => {
      console.log('📝 Code update received:', {
        codeLength: data.code?.length,
        language: data.language,
        updatedBy: data.updatedBy
      });
      
      dispatch({
        type: 'SET_CODE',
        payload: {
          code: data.code,
          language: data.language,
          updatedBy: data.updatedBy
        }
      });
      
      if (data.updatedBy && data.updatedBy._id !== user?._id) {
        dispatch({
          type: 'ADD_TO_HISTORY',
          payload: {
            code: data.code,
            language: data.language,
            updatedBy: data.updatedBy
          }
        });
      }
    };

    const handleCursorUpdate = (data) => {
      if (data.user._id === user?._id) return;
      
      console.log('👆 Cursor update received:', {
        userId: data.user._id,
        position: data.position,
        userName: data.user.username || data.user.email
      });
      
      dispatch({
        type: 'UPDATE_CURSOR',
        payload: {
          userId: data.user._id,
          position: data.position,
          selection: data.selection,
          user: data.user
        }
      });
    };

    // NEW: Handle shared input updates
    const handleInputUpdate = (data) => {
      console.log('📥 Input update received:', {
        inputLength: data.input?.length,
        updatedBy: data.updatedBy
      });
      
      dispatch({
        type: 'SET_INPUT',
        payload: {
          input: data.input,
          updatedBy: data.updatedBy
        }
      });
    };

    // NEW: Handle compilation start
    const handleCompilationStart = (data) => {
      console.log('🚀 Compilation started by:', data.startedBy);
      
      dispatch({
        type: 'SET_COMPILING',
        payload: {
          isCompiling: true,
          startedBy: data.startedBy
        }
      });
    };

    // NEW: Handle compilation results
    const handleCompilationResult = (data) => {
      console.log('🏁 Compilation result received:', {
        success: !data.error,
        compiledBy: data.compiledBy
      });
      
      dispatch({
        type: 'SET_COMPILATION_RESULT',
        payload: {
          result: data.result,
          error: data.error,
          compiledBy: data.compiledBy
        }
      });
    };

    const handleUserDisconnected = (data) => {
      console.log('👋 User disconnected:', data.userId);
      dispatch({
        type: 'REMOVE_CURSOR',
        payload: { userId: data.userId }
      });
    };

    const handleRoomJoined = (data) => {
      console.log('🏠 Room joined, syncing state:', data);
      if (data.roomState) {
        dispatch({
          type: 'SET_ROOM_STATE',
          payload: data.roomState
        });
      }
    };

    // Register socket events
    socket.on('code:update', handleCodeUpdate);
    socket.on('code:cursor', handleCursorUpdate);
    socket.on('input:update', handleInputUpdate); // NEW
    socket.on('compilation:start', handleCompilationStart); // NEW
    socket.on('compilation:result', handleCompilationResult); // NEW
    socket.on('user:left', handleUserDisconnected);
    socket.on('room:joined', handleRoomJoined);

    return () => {
      socket.off('code:update', handleCodeUpdate);
      socket.off('code:cursor', handleCursorUpdate);
      socket.off('input:update', handleInputUpdate);
      socket.off('compilation:start', handleCompilationStart);
      socket.off('compilation:result', handleCompilationResult);
      socket.off('user:left', handleUserDisconnected);
      socket.off('room:joined', handleRoomJoined);
    };
  }, [socket, isConnected, user?._id]);

  // Update code function
  const updateCode = useCallback((newCode, language = state.language) => {
    if (!socket || !roomId) {
      console.warn('⚠️ No socket or roomId available for code update');
      return;
    }

    if (typeof newCode !== 'string') {
      console.error('❌ Invalid code type:', typeof newCode);
      return;
    }

    dispatch({
      type: 'SET_CODE',
      payload: { 
        code: newCode, 
        language,
        updatedBy: user
      }
    });

    try {
      socket.emit('code:update', {
        roomId,
        code: newCode,
        language
      });

      console.log('📤 Code update sent to room:', {
        roomId,
        codeLength: newCode.length,
        language
      });
    } catch (error) {
      console.error('❌ Failed to emit code update:', error);
    }
  }, [socket, roomId, state.language, user]);

  // Update cursor position
  const updateCursor = useCallback((position, selection = null) => {
    if (!socket || !roomId || !user) return;

    if (!position || typeof position.line !== 'number' || typeof position.ch !== 'number') {
      console.warn('⚠️ Invalid cursor position:', position);
      return;
    }

    try {
      socket.emit('code:cursor', {
        roomId,
        position,
        selection
      });

      console.log('👆 Cursor position sent:', { position, hasSelection: !!selection });
    } catch (error) {
      console.error('❌ Failed to emit cursor update:', error);
    }
  }, [socket, roomId, user]);

  // NEW: Update program input (shared)
  const updateInput = useCallback((input) => {
    dispatch({ 
      type: 'SET_INPUT', 
      payload: { 
        input, 
        updatedBy: user 
      } 
    });
    
    if (socket && roomId) {
      try {
        socket.emit('input:update', {
          roomId,
          input
        });
        console.log('📥 Input update sent:', input.length, 'characters');
      } catch (error) {
        console.error('❌ Failed to emit input update:', error);
      }
    }
  }, [socket, roomId, user]);

  // Change language
  const changeLanguage = useCallback((newLanguage) => {
    if (!languageConfigs[newLanguage]) {
      console.error('❌ Unsupported language:', newLanguage);
      return;
    }

    dispatch({ type: 'SET_LANGUAGE', payload: newLanguage });
    
    if (socket && roomId) {
      try {
        socket.emit('code:update', {
          roomId,
          code: state.code,
          language: newLanguage
        });
        
        console.log('🔄 Language changed to:', newLanguage);
      } catch (error) {
        console.error('❌ Failed to emit language change:', error);
      }
    }
  }, [socket, roomId, state.code]);

  // NEW: Enhanced compile and execute with shared results
  const compileAndExecute = useCallback(async () => {
    if (!state.code.trim()) {
      dispatch({
        type: 'SET_COMPILATION_ERROR',
        payload: 'Please enter some code to compile and run.'
      });
      return { success: false, error: 'No code provided' };
    }

    console.log('🚀 Starting compilation for language:', state.language);
    
    // Notify other users that compilation started
    if (socket && roomId) {
      socket.emit('compilation:start', { roomId });
    }
    
    dispatch({ 
      type: 'SET_COMPILING', 
      payload: { 
        isCompiling: true, 
        startedBy: user 
      } 
    });

    try {
      const config = languageConfigs[state.language];
      if (!config) {
        throw new Error(`Language "${state.language}" is not supported by the compiler.`);
      }

      const requestBody = {
        language: config.language,
        version: config.version,
        files: [
          {
            name: `main.${config.extension}`,
            content: state.code
          }
        ],
        stdin: state.programInput || '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      };

      console.log('📤 Sending request to Piston API...');
      const startTime = Date.now();
      
      const response = await fetch(`${PISTON_API_BASE}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Piston API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      const executionTime = Date.now() - startTime;
      
      const formattedResult = {
        success: !result.compile?.stderr && result.run?.code === 0,
        compile: {
          stdout: result.compile?.stdout || '',
          stderr: result.compile?.stderr || '',
          code: result.compile?.code || 0
        },
        run: {
          stdout: result.run?.stdout || '',
          stderr: result.run?.stderr || '',
          code: result.run?.code || 0
        },
        language: state.language,
        version: config.version,
        executionTime,
        timestamp: new Date().toISOString()
      };

      // Share compilation result with other users
      if (socket && roomId) {
        try {
          socket.emit('compilation:result', {
            roomId,
            result: formattedResult
          });
        } catch (error) {
          console.error('❌ Failed to broadcast compilation result:', error);
        }
      }

      dispatch({
        type: 'SET_COMPILATION_RESULT',
        payload: {
          result: formattedResult,
          compiledBy: user
        }
      });

      console.log('✅ Compilation completed successfully');
      return { success: true, result: formattedResult };

    } catch (error) {
      console.error('❌ Compilation error:', error);
      
      const errorMessage = error.message || 'An unexpected error occurred during compilation.';
      
      // Share error with other users
      if (socket && roomId) {
        try {
          socket.emit('compilation:result', {
            roomId,
            error: errorMessage
          });
        } catch (broadcastError) {
          console.error('❌ Failed to broadcast compilation error:', broadcastError);
        }
      }
      
      dispatch({
        type: 'SET_COMPILATION_ERROR',
        payload: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, [state.code, state.language, state.programInput, socket, roomId, user]);

  // Insert template code
  const insertTemplate = useCallback((language = state.language) => {
    const template = codeTemplates[language] || codeTemplates.cpp;
    
    dispatch({
      type: 'SET_CODE',
      payload: {
        code: template,
        language,
        updatedBy: user
      }
    });

    if (socket && roomId) {
      try {
        socket.emit('code:update', {
          roomId,
          code: template,
          language
        });
      } catch (error) {
        console.error('❌ Failed to broadcast template insertion:', error);
      }
    }

    console.log('📋 Template inserted for language:', language);
  }, [state.language, socket, roomId, user]);

  // Download code
  const downloadCode = useCallback(() => {
    const config = languageConfigs[state.language] || { extension: 'txt' };
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `code_${timestamp}.${config.extension}`;
    
    try {
      const element = document.createElement('a');
      const file = new Blob([state.code], { type: 'text/plain' });
      
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setTimeout(() => URL.revokeObjectURL(element.href), 1000);
      
      console.log('💾 Code downloaded as:', filename);
    } catch (error) {
      console.error('❌ Failed to download code:', error);
    }
  }, [state.code, state.language]);

  // Clear compilation results
  const clearCompilationResults = useCallback(() => {
    dispatch({ type: 'CLEAR_COMPILATION' });
    console.log('🧹 Compilation results cleared');
  }, []);

  // Get supported languages
  const getSupportedLanguages = useCallback(() => {
    return Object.keys(languageConfigs);
  }, []);

  // Reset editor state
  const resetEditor = useCallback(() => {
    dispatch({ type: 'RESET' });
    
    if (socket && roomId) {
      try {
        socket.emit('code:update', {
          roomId,
          code: initialState.code,
          language: initialState.language
        });
      } catch (error) {
        console.error('❌ Failed to broadcast reset:', error);
      }
    }
    
    console.log('🔄 Editor state reset');
  }, [socket, roomId]);

  // Context value
  const contextValue = {
    // State
    code: state.code,
    language: state.language,
    programInput: state.programInput,
    remoteCursors: state.remoteCursors,
    isCompiling: state.isCompiling,
    compilationResult: state.compilationResult,
    compilationError: state.compilationError,
    codeHistory: state.codeHistory,
    lastUpdatedBy: state.lastUpdatedBy,
    lastUpdated: state.lastUpdated,
    lastCompilationTime: state.lastCompilationTime,
    lastCompiledBy: state.lastCompiledBy,
    compilationStartedBy: state.compilationStartedBy,
    inputUpdatedBy: state.inputUpdatedBy,
    availableLanguages: state.availableLanguages,
    connectionStatus: isConnected ? 'connected' : 'disconnected',
    
    // Actions
    updateCode,
    updateCursor,
    updateInput,
    changeLanguage,
    compileAndExecute,
    insertTemplate,
    downloadCode,
    clearCompilationResults,
    getSupportedLanguages,
    resetEditor
  };

  return (
    <CodeEditorContext.Provider value={contextValue}>
      {children}
    </CodeEditorContext.Provider>
  );
};
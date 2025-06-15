// frontend/src/contexts/CodeEditorContext.jsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useRoom } from './RoomContext';

const CodeEditorContext = createContext(null);

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
            user: action.payload.user
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
    
    case 'SET_COMPILATION_RESULT':
      return {
        ...state,
        compilationResult: action.payload,
        isCompiling: false
      };
    
    case 'SET_COMPILING':
      return {
        ...state,
        isCompiling: action.payload
      };
    
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        codeHistory: [
          ...state.codeHistory.slice(-49), // Keep last 50 entries
          {
            code: action.payload.code,
            language: action.payload.language,
            timestamp: new Date(),
            updatedBy: action.payload.updatedBy
          }
        ]
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

const initialState = {
  code: '// Welcome to the collaborative code editor\n// Start coding together!\n\n',
  language: 'cpp',
  remoteCursors: {},
  isCompiling: false,
  compilationResult: null,
  codeHistory: [],
  lastUpdatedBy: null,
  lastUpdated: null
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
  const [state, dispatch] = useReducer(codeEditorReducer, initialState);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleCodeUpdate = (data) => {
      console.log('Code update received:', data);
      dispatch({
        type: 'SET_CODE',
        payload: {
          code: data.code,
          language: data.language,
          updatedBy: data.updatedBy
        }
      });
      dispatch({
        type: 'ADD_TO_HISTORY',
        payload: {
          code: data.code,
          language: data.language,
          updatedBy: data.updatedBy
        }
      });
    };

    const handleCursorUpdate = (data) => {
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

    socket.on('code:update', handleCodeUpdate);
    socket.on('code:cursor', handleCursorUpdate);

    return () => {
      socket.off('code:update', handleCodeUpdate);
      socket.off('code:cursor', handleCursorUpdate);
    };
  }, [socket, isConnected]);

  // Update code
  const updateCode = useCallback((newCode, language = state.language) => {
    if (!socket || !roomId) return;

    // Update local state immediately
    dispatch({
      type: 'SET_CODE',
      payload: { code: newCode, language }
    });

    // Emit to other participants
    socket.emit('code:update', {
      roomId,
      code: newCode,
      language
    });
  }, [socket, roomId, state.language]);

  // Update cursor position
  const updateCursor = useCallback((position, selection = null) => {
    if (!socket || !roomId) return;

    socket.emit('code:cursor', {
      roomId,
      position,
      selection
    });
  }, [socket, roomId]);

  // Change language
  const changeLanguage = useCallback((newLanguage) => {
    dispatch({ type: 'SET_LANGUAGE', payload: newLanguage });
    
    if (socket && roomId) {
      socket.emit('code:update', {
        roomId,
        code: state.code,
        language: newLanguage
      });
    }
  }, [socket, roomId, state.code]);

  // Compile code
  const compileCode = useCallback(async () => {
    if (!state.code.trim()) return;

    dispatch({ type: 'SET_COMPILING', payload: true });

    try {
      // Replace with your actual compilation API
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          code: state.code,
          language: state.language
        })
      });

      const result = await response.json();
      dispatch({
        type: 'SET_COMPILATION_RESULT',
        payload: result
      });

      return result;
    } catch (error) {
      console.error('Compilation error:', error);
      dispatch({
        type: 'SET_COMPILATION_RESULT',
        payload: {
          success: false,
          error: 'Compilation failed',
          output: error.message
        }
      });
    }
  }, [state.code, state.language]);

  // Reset editor
  const resetEditor = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const contextValue = {
    ...state,
    updateCode,
    updateCursor,
    changeLanguage,
    compileCode,
    resetEditor
  };

  return (
    <CodeEditorContext.Provider value={contextValue}>
      {children}
    </CodeEditorContext.Provider>
  );
};
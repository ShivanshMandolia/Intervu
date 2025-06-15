// src/components/CodeEditor.jsx
import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { PlayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const CodeEditor = () => {
  const { code, language, updateCode } = useRoom();
  const [localCode, setLocalCode] = useState(code || '');
  const [selectedLanguage, setSelectedLanguage] = useState(language || 'cpp');
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);

  // Update local code when room code changes
  useEffect(() => {
    setLocalCode(code || '');
  }, [code]);

  // Update local language when room language changes
  useEffect(() => {
    setSelectedLanguage(language || 'cpp');
  }, [language]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    // Debounce updates to avoid too many socket emissions
    clearTimeout(window.codeUpdateTimeout);
    window.codeUpdateTimeout = setTimeout(() => {
      updateCode(newCode, selectedLanguage);
    }, 500);
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    updateCode(localCode, newLanguage);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setOutput('Compiling...');
    
    try {
      // Mock compilation - replace with actual compiler API
      setTimeout(() => {
        if (localCode.trim() === '') {
          setOutput('Error: No code to compile');
        } else if (localCode.includes('error')) {
          setOutput('Compilation Error: Syntax error detected');
        } else {
          setOutput('Compilation successful!\nHello World!');
        }
        setIsCompiling(false);
      }, 2000);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setIsCompiling(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([localCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code.${getFileExtension(selectedLanguage)}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getFileExtension = (lang) => {
    const extensions = {
      cpp: 'cpp',
      c: 'c',
      java: 'java',
      python: 'py',
      javascript: 'js',
      html: 'html',
      css: 'css'
    };
    return extensions[lang] || 'txt';
  };

  const getLanguageTemplate = (lang) => {
    const templates = {
      cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}`,
      c: `#include <stdio.h>

int main() {
    printf("Hello World!\\n");
    return 0;
}`,
      java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}`,
      python: `print("Hello World!")`,
      javascript: `console.log("Hello World!");`,
      html: `<!DOCTYPE html>
<html>
<head>
    <title>Hello World</title>
</head>
<body>
    <h1>Hello World!</h1>
</body>
</html>`,
      css: `body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    margin: 0;
    padding: 20px;
}`
    };
    return templates[lang] || '';
  };

  const insertTemplate = () => {
    const template = getLanguageTemplate(selectedLanguage);
    setLocalCode(template);
    updateCode(template, selectedLanguage);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Code Editor</h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
            
            <button
              onClick={insertTemplate}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Template
            </button>
            
            <button
              onClick={handleDownload}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Download Code"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col">
        <textarea
          value={localCode}
          onChange={handleCodeChange}
          className="flex-1 bg-gray-900 text-white p-4 font-mono text-sm resize-none focus:outline-none border-b border-gray-700"
          placeholder={`Write your ${selectedLanguage} code here...`}
          style={{ minHeight: '300px' }}
        />
        
        {/* Compile Button */}
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            {isCompiling ? 'Compiling...' : 'Compile & Run'}
          </button>
        </div>

        {/* Output */}
        <div className="bg-gray-800 p-4 text-white">
          <h4 className="text-sm font-medium mb-2 text-gray-300">Output:</h4>
          <pre className="bg-gray-900 p-3 rounded text-sm font-mono whitespace-pre-wrap border border-gray-700 min-h-[100px]">
            {output || 'Click "Compile & Run" to see output...'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
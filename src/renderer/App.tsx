import React, { useState, useEffect } from 'react';
import './App.css';
import { FileTree, PromptPanel } from './components/Layout';
import { Workspace } from './components/Workspace';

const App: React.FC = () => {
  const [projectRoot, setProjectRoot] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [editorValue, setEditorValue] = useState('// Welcome to Nebula IDE');

  const refreshFiles = async (root: string) => {
    try {
      const fileList = await window.electron.files.getFiles(root);
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to refresh files:', error);
    }
  };

  const handleOpenFolder = async () => {
    const selectedPath = await window.electron.files.selectFolder();
    if (selectedPath) {
      setProjectRoot(selectedPath);
      setActiveFile(null);
      setOpenFiles([]);
      setEditorValue('// Project loaded: ' + selectedPath);
      refreshFiles(selectedPath);
    }
  };

  const handleFileClick = async (relativeOrFullPath: string) => {
    if (!projectRoot) return;

    // Normalize path to full path
    const fullPath = relativeOrFullPath.startsWith(projectRoot)
      ? relativeOrFullPath
      : projectRoot + '/' + relativeOrFullPath;

    try {
      const content = await window.electron.files.readFile(fullPath);

      // Add to open files if not already there
      if (!openFiles.includes(fullPath)) {
        setOpenFiles(prev => [...prev, fullPath]);
      }

      setActiveFile(fullPath);
      setEditorValue(content);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const handleTabClose = (path: string) => {
    const newOpenFiles = openFiles.filter(p => p !== path);
    setOpenFiles(newOpenFiles);

    if (activeFile === path) {
      if (newOpenFiles.length > 0) {
        handleFileClick(newOpenFiles[newOpenFiles.length - 1]);
      } else {
        setActiveFile(null);
        setEditorValue('// No files open');
      }
    }
  };

  const handleSave = async () => {
    if (!activeFile) return;
    try {
      await window.electron.files.writeFile(activeFile, editorValue);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  return (
    <div className="nebula-container">
      <FileTree
        files={files}
        onFileClick={handleFileClick}
        activeFile={activeFile}
        onOpenFolder={handleOpenFolder}
      />
      <Workspace
        activeFile={activeFile}
        openFiles={openFiles}
        onTabClick={handleFileClick}
        onTabClose={handleTabClose}
        editorValue={editorValue}
        onEditorChange={setEditorValue}
        onSave={handleSave}
      />
      <PromptPanel
        activeFile={activeFile}
        onFileChange={() => projectRoot && refreshFiles(projectRoot)}
      />
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import './App.css';
import { Sidebar } from './components/layout/Sidebar';
import { MainCanvas } from './components/layout/MainCanvas';

const App: React.FC = () => {
  const [projectRoot, setProjectRoot] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [editorValue, setEditorValue] = useState('// Welcome to Nebula IDE');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(true);

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
      const normalizedPath = selectedPath.replace(/\\/g, '/');
      setProjectRoot(normalizedPath);
      setActiveFile(null);
      setOpenFiles([]);
      setEditorValue('// Project loaded: ' + selectedPath);
      refreshFiles(selectedPath);
    }
  };

  const handleFileClick = async (relativeOrFullPath: string) => {
    if (!projectRoot) return;

    // Normalize path to full path with forward slashes
    const normalizedTarget = relativeOrFullPath.replace(/\\/g, '/');
    const fullPath = normalizedTarget.startsWith(projectRoot)
      ? normalizedTarget
      : `${projectRoot}/${normalizedTarget.startsWith('/') ? normalizedTarget.slice(1) : normalizedTarget}`;

    try {
      const content = await window.electron.files.readFile(fullPath);

      // Add to open files if not already there
      if (!openFiles.includes(fullPath)) {
        setOpenFiles((prev: string[]) => [...prev, fullPath]);
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
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleApprove = async () => {
    if (projectRoot) {
      await refreshFiles(projectRoot);
      setPreviewRefreshKey((prev: number) => prev + 1);
    }
  };

  return (
    <div className="nebula-container subtle-gradient">
      <Sidebar
        onOpenFolder={handleOpenFolder}
      />

      <MainCanvas
        files={files}
        onFileClick={handleFileClick}
        activeFile={activeFile}
        projectRoot={projectRoot}
        openFiles={openFiles}
        onTabClick={handleFileClick}
        onTabClose={handleTabClose}
        editorValue={editorValue}
        onEditorChange={setEditorValue}
        onSave={handleSave}
        previewRefreshKey={previewRefreshKey}
        onCommandApprove={handleApprove}
        onOpenFolder={handleOpenFolder}
      />
    </div>
  );
};

export default App;

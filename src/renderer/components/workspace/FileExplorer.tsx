import React from 'react';

interface FileExplorerProps {
    files: string[];
    onFileClick: (file: string) => void;
    activeFile: string | null;
    onOpenFolder: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileClick, activeFile, onOpenFolder }) => {
    const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

    const toggleFolder = (path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const renderTree = (fileList: string[]) => {
        const tree: any = {};
        fileList.forEach(path => {
            const parts = path.split(/[/\\]/);
            let current = tree;
            parts.forEach((part, i) => {
                if (!current[part]) {
                    current[part] = i === parts.length - 1 ? null : {};
                }
                current = current[part];
            });
        });

        const buildNodes = (obj: any, parentPath = '') => {
            return Object.keys(obj).sort((a, b) => {
                if (obj[a] !== null && obj[b] === null) return -1;
                if (obj[a] === null && obj[b] !== null) return 1;
                return a.localeCompare(b);
            }).map(name => {
                const currentPath = parentPath ? `${parentPath}/${name}` : name;
                const normalizedCurrentPath = currentPath.replace(/\\/g, '/');
                const isFolder = obj[name] !== null;
                const isExpanded = expandedFolders.has(normalizedCurrentPath);
                const isActive = activeFile?.replace(/\\/g, '/').replace(/\\\\/g, '/').endsWith(normalizedCurrentPath);

                return (
                    <div key={normalizedCurrentPath} className={parentPath ? 'file-item-nest' : ''}>
                        <div
                            onClick={() => isFolder ? toggleFolder(normalizedCurrentPath) : onFileClick(normalizedCurrentPath)}
                            className={`file-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="expansion-icon">
                                {isFolder ? (isExpanded ? '▼' : '▶') : ''}
                            </span>
                            <span className={isFolder ? 'folder-icon' : `file-icon ${isActive ? 'active' : ''}`}>
                                {isFolder ? '󰉋' : (name.endsWith('.ts') || name.endsWith('.tsx') ? '󰛦' : '󰈙')}
                            </span>
                            <span className="file-label">
                                {name}
                            </span>
                        </div>
                        {isFolder && isExpanded && buildNodes(obj[name], normalizedCurrentPath)}
                    </div>
                );
            });
        };

        return buildNodes(tree);
    };

    return (
        <div className="file-explorer glass-panel">
            <div className="panel-header">
                <span className="panel-title">Explorer</span>
                <button onClick={onOpenFolder} className="nebula-button">
                    Open
                </button>
            </div>
            <div className="file-tree-content">
                {files.length === 0 ? (
                    <div className="empty-state">
                        No folder opened.
                    </div>
                ) : (
                    renderTree(files)
                )}
            </div>
        </div>
    );
};

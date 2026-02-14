import React from 'react';

interface BreadcrumbsProps {
    path: string | null;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path }) => {
    if (!path) return <div className="breadcrumb-bar">No file selected</div>;

    const parts = path.split(/[/\\]/);
    const fileName = parts.pop();
    const folderPath = parts.slice(-2).join(' / ');

    return (
        <div className="breadcrumb-bar">
            <span>{folderPath}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item-active">{fileName}</span>
        </div>
    );
};

import React from 'react';

interface SidebarProps {
    onOpenFolder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenFolder }) => {
    return (
        <div className="sidebar subtle-gradient">
            <div className="activity-bar-top">
                <div className="activity-item active" title="Explorer">
                    <span>📁</span>
                </div>
                <div className="activity-item" title="Search">
                    <span>🔍</span>
                </div>
                <div className="activity-item" title="Source Control">
                    <span>🌳</span>
                </div>
            </div>
            <div className="activity-bar-bottom">
                <div className="activity-item" title="Settings" onClick={() => { }}>
                    <span>⚙️</span>
                </div>
            </div>
        </div>
    );
};

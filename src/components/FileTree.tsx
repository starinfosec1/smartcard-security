import React from 'react';
import { Folder, FileText, Database, ChevronRight, HardDrive } from 'lucide-react';
import { SmartCardNode } from '../types';

interface FileTreeProps {
  nodes: Record<string, SmartCardNode>;
  selectedNodeId?: string;
  onSelectNode?: (node: SmartCardNode) => void;
  showDataPreview?: boolean;
}

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  showDataPreview = false,
}) => {
  const rootNode = Object.values(nodes).find(n => n.type === 'MF');

  const renderNode = (node: SmartCardNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="relative">
        <div
          onClick={() => onSelectNode && onSelectNode(node)}
          className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-mono transition-all cursor-pointer select-none group ${
            isSelected
              ? 'bg-cyan-950/80 border border-cyan-500/70 text-cyan-200 shadow-sm'
              : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 18 + 10}px` }}
        >
          {/* Depth connector indicator */}
          {depth > 0 && (
            <span className="text-slate-600 select-none -ml-3 mr-1 text-[10px]">
              └──
            </span>
          )}

          {/* Icon based on type */}
          {node.type === 'MF' ? (
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
          ) : node.type === 'DF' ? (
            <Folder className="w-4 h-4 text-blue-400 shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
          )}

          {/* Name & Type badge */}
          <span className="font-semibold">{node.name}</span>

          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ml-1 ${
              node.type === 'MF'
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                : node.type === 'DF'
                ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
                : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
            }`}
          >
            {node.type}
          </span>

          {/* EF details (size, data) */}
          {node.type === 'EF' && (
            <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-2">
              {node.size && (
                <span className="text-slate-500 font-mono">[{node.size}B]</span>
              )}
              {showDataPreview && node.data !== undefined && (
                <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 text-cyan-300 font-mono text-[10px]">
                  &quot;{node.data}&quot;
                </span>
              )}
            </span>
          )}
        </div>

        {/* Children render */}
        {hasChildren && (
          <div className="relative">
            {node.children!.map((childId) => {
              const childNode = nodes[childId];
              return childNode ? renderNode(childNode, depth + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  if (!rootNode) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 italic">
        No root file system initialized.
      </div>
    );
  }

  return (
    <div className="bg-[#0B1426] border border-slate-700/80 rounded-xl p-3 overflow-x-auto shadow-inner">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          SMART CARD MEMORY HIERARCHY
        </span>
        <span>Click node to select</span>
      </div>
      <div className="space-y-0.5">
        {renderNode(rootNode, 0)}
      </div>
    </div>
  );
};

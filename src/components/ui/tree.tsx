import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: React.ReactNode;
  data?: any;
}

export interface TreeProps {
  nodes: TreeNode[];
  expandedNodes?: Set<string>;
  selectedNode?: string;
  onNodeToggle?: (nodeId: string) => void;
  onNodeSelect?: (node: TreeNode) => void;
  indentSize?: string;
  iconSize?: string;
  transitionDuration?: number;
  className?: string;
}

export function Tree({
  nodes,
  expandedNodes: controlledExpanded,
  selectedNode,
  onNodeToggle,
  onNodeSelect,
  indentSize = '24px',
  iconSize = '16px',
  transitionDuration = 200,
  className,
}: TreeProps) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(new Set());

  const expandedNodes = controlledExpanded || internalExpanded;

  const handleToggle = useCallback((nodeId: string) => {
    if (controlledExpanded !== undefined) {
      onNodeToggle?.(nodeId);
    } else {
      setInternalExpanded(prev => {
        const newExpanded = new Set(prev);
        if (newExpanded.has(nodeId)) {
          newExpanded.delete(nodeId);
        } else {
          newExpanded.add(nodeId);
        }
        return newExpanded;
      });
    }
  }, [controlledExpanded, onNodeToggle]);

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center py-1 px-2 hover:bg-neutral-50 cursor-pointer rounded',
            {
              'bg-primary-50 text-primary-700': isSelected,
            }
          )}
          style={{
            paddingLeft: `calc(${level} * ${indentSize})`,
            transition: `all ${transitionDuration}ms ease`,
          }}
          onClick={() => onNodeSelect?.(node)}
        >
          {/* Expand/Collapse Icon */}
          <div
            className="flex items-center justify-center mr-2"
            style={{ width: iconSize, height: iconSize }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(node.id);
                }}
                className="text-neutral-500 hover:text-neutral-700 transition-colors"
                style={{ width: iconSize, height: iconSize }}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <div style={{ width: iconSize, height: iconSize }} />
            )}
          </div>

          {/* Node Icon */}
          {node.icon && (
            <div
              className="flex items-center justify-center mr-2"
              style={{ width: iconSize, height: iconSize }}
            >
              {node.icon}
            </div>
          )}

          {/* Node Label */}
          <span className="text-sm text-neutral-900 flex-1 truncate">
            {node.label}
          </span>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('tree-view', className)}>
      {nodes.map((node) => renderNode(node))}
    </div>
  );
}

export default Tree;
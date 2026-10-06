import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../editor/store/useEditorStore';
import { TopBar } from '../../editor/panels/TopBar';
import { LeftPanel } from '../../editor/panels/LeftPanel';
import { EditorCanvas } from '../../editor/canvas/EditorCanvas';
import { RightPanel } from '../../editor/panels/RightPanel';
import { AiAssistantPanel } from '../../editor/ai/AiAssistantPanel';
import { PublishModal } from '../../editor/panels/PublishModal';
import { storage } from '../../services/storage';

export const EditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const {
    document,
    loadDocument,
    save,
    undo,
    redo,
    deleteNode,
    duplicateNode,
    selectedNodeId,
    copyNode,
    pasteNode,
  } = useEditorStore();

  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    } else {
      // Fallback to first available document
      const projects = storage.getProjects();
      if (projects.length > 0 && projects[0].documentId) {
        navigate(`/editor/${projects[0].documentId}`, { replace: true });
      }
    }
  }, [documentId, loadDocument, navigate]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (modKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      } else if (modKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedNodeId) duplicateNode(selectedNodeId);
      } else if (modKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (selectedNodeId) copyNode(selectedNodeId);
      } else if (modKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteNode();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId && selectedNodeId !== document?.rootNode.id) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, save, duplicateNode, deleteNode, copyNode, pasteNode, selectedNodeId, document]);

  if (!document) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold">Loading FlowPilot Editor...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white select-none">
      <TopBar />
      <div className="flex-1 flex overflow-hidden relative">
        <LeftPanel />
        <EditorCanvas />
        <RightPanel />
        <AiAssistantPanel />
      </div>
      <PublishModal />
    </div>
  );
};

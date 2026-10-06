import { ComponentNode, DocumentModel } from './document';

export type AIMode = 'generate' | 'edit' | 'ask';

export interface AICommand {
  type: 
    | 'insert_node'
    | 'update_node_props'
    | 'update_node_styles'
    | 'delete_node'
    | 'replace_node'
    | 'replace_document'
    | 'update_theme';
  targetNodeId?: string;
  payload: any;
  explanation: string;
}

export interface AIChangeProposal {
  id: string;
  mode: AIMode;
  prompt: string;
  summary: string;
  commands: AICommand[];
  modifiedDocumentSnapshot?: DocumentModel;
  originalDocumentSnapshot: DocumentModel;
  status: 'pending' | 'applied' | 'rejected';
  createdAt: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposal?: AIChangeProposal;
  timestamp: string;
}

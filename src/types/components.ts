import { ComponentNode, StyleProperties } from './document';

export type ComponentCategory = 
  | 'basic'
  | 'layout'
  | 'interactive'
  | 'advanced'
  | 'tour'
  | 'demo'
  | 'marketing';

export interface PropertyFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'color' | 'image' | 'icon' | 'list';
  defaultValue?: any;
  options?: { label: string; value: any }[];
  description?: string;
  category?: 'content' | 'behavior' | 'styling';
}

export interface ComponentDefinition {
  type: string;
  displayName: string;
  category: ComponentCategory;
  icon: string;
  description: string;
  isContainer?: boolean;
  supportedModules?: string[]; // e.g. ['page', 'banner', 'tour'] or ['all']
  allowedParents?: string[]; // If empty, can be placed anywhere valid
  allowedChildren?: string[]; // If empty and isContainer, can contain any
  defaultProps: Record<string, any>;
  defaultStyles: StyleProperties;
  propertyFields: PropertyFieldSchema[];
  render: React.ComponentType<{
    node: ComponentNode;
    isEditing?: boolean;
    onUpdateProps?: (newProps: Record<string, any>) => void;
    children?: React.ReactNode;
  }>;
}

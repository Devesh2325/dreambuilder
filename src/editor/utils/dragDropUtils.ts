import { ComponentNode } from '../../types/document';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';

export const DND_TYPES = {
  BLOCK_TYPE: 'application/flowpilot-block',
  PRESET: 'application/flowpilot-preset',
  NODE_ID: 'application/flowpilot-node-id',
} as const;

export function createNodeFromType(type: string): ComponentNode | null {
  const def = COMPONENT_REGISTRY[type];
  if (!def) return null;

  return {
    id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: def.type,
    name: def.displayName,
    props: JSON.parse(JSON.stringify(def.defaultProps || {})),
    styles: JSON.parse(JSON.stringify(def.defaultStyles || {})),
    children: [],
  };
}

export function createMultiColumnNode(cols: number): ComponentNode {
  const colChildren: ComponentNode[] = Array.from({ length: cols }, (_, i) => ({
    id: `col_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
    type: 'Container',
    name: `Column ${i + 1}`,
    props: {},
    styles: {
      flex: 1,
      padding: '16px',
      minHeight: '120px',
      backgroundColor: 'rgba(241, 245, 249, 0.4)',
      borderRadius: '8px',
      borderWidth: '1px',
      borderStyle: 'dashed',
      borderColor: '#cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    children: [],
  }));

  return {
    id: `flex_cols_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    type: 'Flex',
    name: `${cols}-Column Layout`,
    props: {},
    styles: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      gap: '16px',
      padding: '12px 0',
    },
    children: colChildren,
  };
}

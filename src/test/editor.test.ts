import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editor/store/useEditorStore';
import { createTourDocument } from '../services/seedData';
import { ComponentNode } from '../types/document';

describe('Custom Visual Editor Engine (Zustand Store)', () => {
  const initialDoc = createTourDocument('doc_test_1', 'proj_test_1', 'Test Tour');

  beforeEach(() => {
    useEditorStore.getState().setDocument(initialDoc, false);
    useEditorStore.setState({
      selectedNodeId: 'tour_root',
      history: [JSON.parse(JSON.stringify(initialDoc))],
      historyIndex: 0,
    });
  });

  it('loads initial document correctly', () => {
    const doc = useEditorStore.getState().document;
    expect(doc).toBeDefined();
    expect(doc?.title).toBe('Test Tour');
    expect(doc?.rootNode.children.length).toBe(3);
  });

  it('inserts a new component node into the document tree', () => {
    const newNode: ComponentNode = {
      id: 'node_new_button',
      type: 'Button',
      name: 'CTA Button',
      props: { text: 'Click Here' },
      styles: { backgroundColor: '#6366f1' },
      children: [],
    };

    useEditorStore.getState().insertNode('tour_root', newNode);

    const doc = useEditorStore.getState().document;
    const inserted = doc?.rootNode.children.find(c => c.id === 'node_new_button');
    expect(inserted).toBeDefined();
    expect(inserted?.props.text).toBe('Click Here');
  });

  it('updates node props and styles immutably', () => {
    useEditorStore.getState().updateNodeProps('step_1', { title: 'Updated Welcome Title' });
    useEditorStore.getState().updateNodeStyles('step_1', { backgroundColor: '#1e1b4b' });

    const doc = useEditorStore.getState().document;
    const step = doc?.rootNode.children.find(c => c.id === 'step_1');
    expect(step?.props.title).toBe('Updated Welcome Title');
    expect(step?.styles.backgroundColor).toBe('#1e1b4b');
  });

  it('handles undo and redo history accurately', () => {
    const initialTitle = useEditorStore.getState().document?.rootNode.children[0].props.title;

    // Mutation 1
    useEditorStore.getState().updateNodeProps('step_1', { title: 'Step 1 - Modification' });
    expect(useEditorStore.getState().document?.rootNode.children[0].props.title).toBe('Step 1 - Modification');

    // Undo
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document?.rootNode.children[0].props.title).toBe(initialTitle);

    // Redo
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document?.rootNode.children[0].props.title).toBe('Step 1 - Modification');
  });

  it('deletes a component node correctly', () => {
    useEditorStore.getState().deleteNode('step_3');
    const doc = useEditorStore.getState().document;
    const exists = doc?.rootNode.children.some(c => c.id === 'step_3');
    expect(exists).toBe(false);
  });

  it('duplicates a component node with unique IDs', () => {
    useEditorStore.getState().duplicateNode('step_1');
    const doc = useEditorStore.getState().document;
    expect(doc?.rootNode.children.length).toBe(4);
    const copies = doc?.rootNode.children.filter(c => c.name.includes('Copy'));
    expect(copies?.length).toBe(1);
    expect(copies?.[0].id).not.toBe('step_1');
  });
});

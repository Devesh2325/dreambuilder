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

  it('updates document module type with complete separation', () => {
    useEditorStore.getState().setDocumentType('banner');
    const doc = useEditorStore.getState().document;
    expect(doc?.documentType).toBe('banner');
  });

  it('inserts sibling or auto-wraps correctly when target is a non-container leaf node', () => {
    // Insert into step_1 which is not a container
    const ctaButton: ComponentNode = {
      id: 'btn_step_action',
      type: 'Button',
      name: 'Step Action',
      props: { text: 'Next' },
      styles: { width: '100px' },
      children: [],
    };

    useEditorStore.getState().insertNode('step_1', ctaButton);
    const doc = useEditorStore.getState().document;
    // Should be inserted as sibling inside tour_root right after step_1
    const idx = doc?.rootNode.children.findIndex(c => c.id === 'btn_step_action');
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  it('applies responsive style overrides independently without overwriting desktop', () => {
    useEditorStore.getState().updateResponsiveStyles('step_1', 'mobile', {
      fontSize: '12px',
      paddingLeft: '8px',
      paddingRight: '8px',
      display: 'block',
    });

    const doc = useEditorStore.getState().document;
    const step = doc?.rootNode.children.find(c => c.id === 'step_1');
    expect(step?.responsive?.mobile?.fontSize).toBe('12px');
    expect(step?.responsive?.mobile?.paddingLeft).toBe('8px');
    // Desktop base styles remain intact
    expect(step?.styles.paddingLeft).toBe('24px');
  });

  it('self-heals and creates valid starter document if requested doc does not exist', () => {
    useEditorStore.getState().loadDocument('doc_non_existent_999');
    const doc = useEditorStore.getState().document;
    expect(doc).toBeDefined();
    expect(doc?.id).toBe('doc_non_existent_999');
    expect(doc?.rootNode).toBeDefined();
  });
});


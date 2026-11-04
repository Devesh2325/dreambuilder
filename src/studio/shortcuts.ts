import { useStudio } from './store';

/** Keyboard shortcuts. The canvas is an iframe, so this listens on both documents. */
export function handleStudioShortcut(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  const tag = target?.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  const state = useStudio.getState();

  if (mod && key === 's') {
    event.preventDefault();
    void state.saveNow();
    return;
  }
  if (isTyping) return;

  if (mod && key === 'z') {
    event.preventDefault();
    if (event.shiftKey) state.redo();
    else state.undo();
  } else if (mod && key === 'y') {
    event.preventDefault();
    state.redo();
  } else if (mod && key === 'd' && state.selectedId) {
    event.preventDefault();
    state.duplicateBlock(state.selectedId);
  } else if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedId) {
    event.preventDefault();
    state.removeBlock(state.selectedId);
  } else if (event.key === 'Escape') {
    state.select(null);
  }
}

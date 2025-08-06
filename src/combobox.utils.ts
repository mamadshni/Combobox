import { SelectActions } from './combobox.model.ts';

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const KeyEventsMapper: Record<KeyboardEvent['key'], SelectActions> = {
  Home: SelectActions.First,
  End: SelectActions.Last,
  PageUp: SelectActions.PageUp,
  PageDown: SelectActions.PageDown,
  Escape: SelectActions.Close,
};

const openKeys: KeyboardEvent['key'][] = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

export function getActionFromKey(event: KeyboardEvent, menuOpen: boolean): SelectActions {
  const { key, altKey, ctrlKey, metaKey } = event;

  if (!menuOpen && openKeys.includes(key)) {
    return SelectActions.Open;
  }

  if (KeyEventsMapper[key]) {
    return KeyEventsMapper[key];
  }

  const isPrintableChar = key.length === 1 && key !== ' ' && !altKey && !ctrlKey && !metaKey;
  if (key === 'Backspace' || key === 'Clear' || isPrintableChar) {
    return SelectActions.Type;
  }

  if (menuOpen) {
    if (key === 'ArrowUp' && altKey) {
      return SelectActions.CloseSelect;
    }

    if (key === 'ArrowDown' && !altKey) {
      return SelectActions.Next;
    }

    if (key === 'ArrowUp') {
      return SelectActions.Previous;
    }

    if (key === 'Enter' || key === ' ') {
      return SelectActions.CloseSelect;
    }
  }

  return SelectActions.Close;
}

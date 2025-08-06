import { SelectActions } from './combobox.model.ts';

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

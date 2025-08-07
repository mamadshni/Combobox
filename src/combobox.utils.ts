import { SelectActions } from './combobox.model.ts';

export function getActionFromKey(event: KeyboardEvent, menuOpen: boolean): SelectActions | undefined {
  const { key, altKey, ctrlKey, metaKey } = event;

  const openKeys: KeyboardEvent['key'][] = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

  if (!menuOpen && openKeys.includes(key)) {
    return SelectActions.Open;
  }

  if (key === 'Home') {
      return SelectActions.First;
  }

  if (key === 'End') {
      return SelectActions.Last;
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

    if (key === 'PageUp') {
        return SelectActions.PageUp;
    }

    if (key === 'PageDown') {
        return SelectActions.PageDown;
    }

    if (key === 'Escape') {
        return SelectActions.Close;
    }

    if (key === 'Enter' || key === ' ') {
      return SelectActions.CloseSelect;
    }
  }

  return undefined;
}

export function getUpdatedIndex(
  currentIndex: number,
  maxIndex: number,
  action: SelectActions
  ) {
  const pageSize = 10;

  switch (action) {
    case SelectActions.First:
      return 0;
    case SelectActions.Last:
      return maxIndex;
    case SelectActions.Previous:
      return Math.max(0, currentIndex - 1);
    case SelectActions.Next:
      return Math.min(maxIndex, currentIndex + 1);
    case SelectActions.PageUp:
      return Math.max(0, currentIndex - pageSize);
    case SelectActions.PageDown:
      return Math.min(maxIndex, currentIndex + pageSize);
    default:
      return currentIndex;
  }
}

export function isScrollable(element: HTMLElement | null) {
  return element && element.clientHeight < element.scrollHeight;
}

export function isElementInView(element: HTMLElement | null) {
  if (!element) return false;

  const bounding = element.getBoundingClientRect();

  return (
    bounding.top >= 0 &&
    bounding.left >= 0 &&
    bounding.bottom <=
    (window.innerHeight || document.documentElement.clientHeight) &&
    bounding.right <=
    (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function maintainScrollVisibility(activeElement: HTMLElement | null, scrollParent: HTMLElement | null) {
  if (!activeElement || !scrollParent) return;

  const { offsetHeight, offsetTop } = activeElement;
  const { offsetHeight: parentOffsetHeight, scrollTop } = scrollParent;

  const isAbove = offsetTop < scrollTop;
  const isBelow = offsetTop + offsetHeight > scrollTop + parentOffsetHeight;

  if (isAbove) {
    scrollParent.scrollTo(0, offsetTop);
  } else if (isBelow) {
    scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight);
  }
}

export function assertExistElements<T extends HTMLElement>(
  element: T | NodeListOf<T> | null
): asserts element is T | NodeListOf<T> {
  if (!element) {
    throw new Error('Expected element(s) to exist, but got null.');
  }

  if (element instanceof NodeList && element.length === 0) {
    throw new Error('Expected NodeList to contain at least one element, but it was empty.');
  }
}

export function getIndexByLetter(options: string[], filter: string, startIndex = 0) {
  const orderedOptions = [
    ...options.slice(startIndex),
    ...options.slice(0, startIndex),
  ];
  const matches = filterOptions(orderedOptions, filter);
  if (matches.length > 0) {
    return options.indexOf(matches[0]);
  }

  if (allSameLetter(filter.split(''))) {
    const matches = filterOptions(orderedOptions, filter[0]);
    if (matches.length > 0) {
      return options.indexOf(matches[0]);
    }
  }

  return -1;
}

const allSameLetter = (array: string[]) => array.every((letter) => letter === array[0]);

const filterOptions =  (options: string[] = [], filter: string) =>
    options.filter((option) =>  option.toLowerCase().indexOf(filter.toLowerCase()) === 0)



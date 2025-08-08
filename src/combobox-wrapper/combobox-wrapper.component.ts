import {
  assertExistElements,
  getActionFromKey,
  getIndexByLetter,
  getUpdatedIndex,
  isScrollable,
  maintainScrollVisibility
} from '../combobox.utils.ts';
import { SelectActions } from '../combobox.model.ts';
import { ComboboxOptionComponent } from '../combobox-option/combobox-option.component.ts';

import css from './combobox-wrapper.component.css?raw';
import html from './combobox-wrapper.component.html?raw';

export class ComboboxWrapperComponent extends HTMLElement {

  #focusedOptionIndex: number = 0;
  #isOpen: boolean = false;

  #comboboxInputElem: HTMLElement | null = null;
  #comboboxLabelElem: HTMLElement | null = null;
  #comboboxListBoxElem: HTMLElement | null = null;

  #selectedOptionElem: ComboboxOptionComponent | null  = null;
  #focusedOptionElem: ComboboxOptionComponent | null  = null;
  #optionElems: NodeListOf<ComboboxOptionComponent> | null = null;

  #searchString = '';
  #debounceRef: ReturnType<typeof setTimeout> | null = null;

  private get comboboxInputElem() {
    assertExistElements(this.#comboboxInputElem);
    return this.#comboboxInputElem;
  }

  private get comboboxLabelElem() {
    assertExistElements(this.#comboboxLabelElem);
    return this.#comboboxLabelElem;
  }

  private get comboboxListBoxElem() {
    assertExistElements(this.#comboboxListBoxElem);
    return this.#comboboxListBoxElem;
  }

  private get focusedOptionElem() {
    assertExistElements(this.#focusedOptionElem);
    return this.#focusedOptionElem;
  }

  private get optionElems() {
    assertExistElements(this.#optionElems);
    return this.#optionElems;
  }

  private get optionInnerTexts(): string[] {
    return [...this.optionElems].map(o => o.textContent?.trim() || '');
  }

  private get isDisabled(): boolean {
    return this.hasAttribute('disabled');
  }

  static get observedAttributes() {
    return ['label', 'placeholder']
  }

  public constructor() {
    super();
  }

  private get template(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = html
      .replace('{{comboLabel}}', this.comboLabel)
      .replace('{{comboPlaceholder}}', this.comboPlaceholder);
    return template;
  }

  private get styles(): CSSStyleSheet[] {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css)

    return [styleSheet]
  }

  private get comboLabel(): string {
    return this.getAttribute("label") || "Label";
  }

  private get comboPlaceholder(): string {
    return this.getAttribute("placeholder") || "Placeholder";
  }

  protected connectedCallback() {
    this.render()
  }

  private render() {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = this.styles;
    shadowRoot.appendChild(this.template.content.cloneNode(true));
    this.init();
    this.addEventsToElements();
  }

  private init(): void {
    this.#comboboxInputElem = this.shadowRoot?.getElementById('combobox__id-input') ?? null;
    this.#comboboxLabelElem = this.shadowRoot?.getElementById('combobox__id-label') ?? null;
    this.#comboboxListBoxElem = this.shadowRoot?.getElementById('combobox__id-list-box') ?? null;

    this.#optionElems = this.querySelectorAll<ComboboxOptionComponent>("combobox-option");

    this.applyDisabledState();

    if (!this.#optionElems.length) {
      this.disableCombobox();
      return;
    }
    else {
      for (let option of this.#optionElems) {
        this.comboboxListBoxElem.appendChild(option);
      }

      this.#focusedOptionElem = this.#optionElems[this.#focusedOptionIndex];
      this.#focusedOptionElem.classList.add('combobox__current');
    }

  }

  private addEventsToElements(): void {
    this.comboboxInputElem.addEventListener(
      'click',
      this.onComboboxSelectInputClick.bind(this)
    );
    this.comboboxInputElem.addEventListener(
      'keydown',
      this.onComboboxSelectInputKeydown.bind(this)
    );
    this.comboboxInputElem.addEventListener(
      'blur',
      this.onComboboxBlurClick.bind(this)
    );

    this.comboboxLabelElem.addEventListener(
      'click',
      this.onComboboxLabelClick.bind(this)
    );

    this.comboboxListBoxElem.addEventListener(
      'focusout',
      this.onComboboxBlurClick.bind(this)
    );

    this.optionElems.forEach((option, index) => {
      option.addEventListener('click', this.onOptionClick(index).bind(this));
    })
  }

  private applyDisabledState(): void {
    if (this.isDisabled) {
      this.disableCombobox()
    } else {
      this.enableCombobox()
    }
  }

  private disableCombobox() {
    this.comboboxInputElem.setAttribute('aria-disabled', 'true');
    this.comboboxInputElem.setAttribute('tabindex', '-1');
    this.comboboxInputElem.classList.add('disabled');
    this.setAttribute('aria-disabled', 'true');
  }
  private enableCombobox() {
    this.comboboxInputElem.setAttribute('aria-disabled', 'false');
    this.comboboxInputElem.setAttribute('tabindex', '0');
    this.comboboxInputElem.classList.remove('disabled');
    this.removeAttribute('aria-disabled');
  }

  private updateMenuState(shouldOpen: boolean, callFocus = true): void {
    if (this.#isOpen === shouldOpen) {
      return;
    }

    this.#isOpen = shouldOpen;

    this.comboboxInputElem.setAttribute('aria-expanded', `${shouldOpen}`);

    if (shouldOpen) {
      this.classList.add('open')
      this.comboboxInputElem.setAttribute('aria-activedescendant', this.focusedOptionElem.id);
    } else {
      this.classList.remove('open');
      this.comboboxInputElem.setAttribute('aria-activedescendant', '');
    }

    callFocus && this.comboboxInputElem.focus();
  }

  private onComboboxSelectInputClick(): void {
    if (this.isDisabled) return;

    this.updateMenuState(!this.#isOpen, false);
  }

  private onComboboxSelectInputKeydown(event: KeyboardEvent): void {
    if (this.isDisabled) return;

    const { key } = event;
    const max = this.optionElems.length - 1;
    const action = getActionFromKey(event, this.#isOpen);

    switch (action) {
      case SelectActions.Last:
      case SelectActions.First:
        return this.updateMenuState(true);
      case SelectActions.Next:
      case SelectActions.Previous:
      case SelectActions.PageUp:
      case SelectActions.PageDown:
        event.preventDefault();
        const index = 	getUpdatedIndex(this.#focusedOptionIndex, max, action);
        return this.onOptionChange(index);
      case SelectActions.CloseSelect:
        event.preventDefault();
        this.onSelectOption(this.#focusedOptionIndex);
        return this.updateMenuState(false);
      case SelectActions.Close:
        event.preventDefault();
        return this.updateMenuState(false);
      case SelectActions.Type:
        return this.onComboboxType(key);
      case SelectActions.Open:
        event.preventDefault();
        return this.updateMenuState(true);
    }
  }

  private onComboboxBlurClick(event: FocusEvent): void {
    if (this.isDisabled) return;

    // @ts-ignore
    if (this.comboboxListBoxElem.contains(event.relatedTarget)) {
      return;
    }

    if (this.#isOpen) {
      this.onSelectOption(this.#focusedOptionIndex);
      this.updateMenuState(false, false);
    }
  }

  private onComboboxLabelClick(): void {
    if (this.isDisabled) return;

    this.comboboxInputElem.focus();
  }

  private onOptionClick(index: number) {
    return (event: MouseEvent) => {
      event.stopPropagation();
      this.onOptionChange(index);
      this.onSelectOption(index);
      this.updateMenuState(false);
    }
  }

  private onOptionChange(index: number) {
    const option = this.optionElems[index];

    this.comboboxInputElem.setAttribute('aria-activedescendant', option.id);
    this.focusedOptionElem.classList.remove('combobox__current');
    this.#focusedOptionElem = option;
    this.#focusedOptionIndex = index;
    this.focusedOptionElem.classList.add('combobox__current');

    if (isScrollable(this.comboboxListBoxElem)) {
      maintainScrollVisibility(option, this.comboboxListBoxElem);
    }
  };

  private onSelectOption(index: number) {
    this.#focusedOptionIndex = index;
    const option = this.optionElems[index];

    this.#selectedOptionElem?.setSelected(false);
    option.setSelected(true);
    this.#selectedOptionElem = option;
    this.comboboxInputElem.textContent = option.textContent.trim();

    this.dispatchEvent(
      new CustomEvent('selected', {
        bubbles: true,
        composed: true,
        detail: {
          key: option.id,
          value: option.textContent.trim(),
        },
      })
    );

  };

  private onComboboxType(letter: string): void {
    this.updateMenuState(true);

    this.#searchString += letter;
    if (this.#debounceRef) clearTimeout(this.#debounceRef);
    this.#debounceRef = setTimeout(() => {
      this.#searchString = '';
      this.#debounceRef = null;
    }, 500);

    const searchIndex = getIndexByLetter(
      this.optionInnerTexts,
      this.#searchString,
      this.#focusedOptionIndex + 1
    );

    if (searchIndex >= 0) {
      this.onOptionChange(searchIndex);
    }
  }
}

customElements.define("combobox-wrapper", ComboboxWrapperComponent);
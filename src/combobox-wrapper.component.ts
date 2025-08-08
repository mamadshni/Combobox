import {
  assertExistElements,
  getActionFromKey,
  getIndexByLetter,
  getUpdatedIndex,
  isScrollable,
  maintainScrollVisibility,
} from './combobox.utils.ts';
import { SelectActions } from './combobox.model.ts';
import { ComboboxOptionComponent } from './combobox-option.component.ts';

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
    template.innerHTML = `
			  <label 
			    class="combobox__label" 
					id="combobox__id-label">
				  ${this.comboLabel}
				</label>
				
  			<div 
					class="combobox__input" 
					id="combobox__id-input"
					role="combobox" 
					tabindex="0"
					aria-controls="combobox__id-list-box" 
					aria-expanded="false" 
					aria-haspopup="listbox" 
					aria-labelledby="combobox__id-label" >
					${this.comboPlaceholder}
				</div>
				
				<div 
					class="combobox__menu" 
					id="combobox__id-list-box"
					role="listbox" 
					tabindex="-1"
					aria-labelledby="combobox__id-label" >
				</div>
		`
    return template;
  }

  private get styles(): HTMLStyleElement {
    const style = document.createElement('style');
    style.innerHTML = `
		:host *,
		:host *::before,
		:host *::after {
  		box-sizing: border-box;
		}

		:host {
  		display: flex;
			flex-direction: column;
			gap: 4px;
  		max-width: 400px;
			position: relative;
		}

		.combobox__input {
  		display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			
  		min-height: calc(1.4em + 26px);
			min-width: var(--combobox-min-width, 240px);
			width: 100%;
			
  		background-color: #f5f5f5;
  		border: 2px solid rgb(0 0 0 / 75%);
  		border-radius: 4px;
			
  		font-size: 1em;
  		padding: 12px 16px 14px;
  		text-align: left;
			cursor: pointer;
		}
		
		.combobox__input::after {
  		border-bottom: 2px solid rgb(0 0 0 / 75%);
  		border-right: 2px solid rgb(0 0 0 / 75%);
  		content: "";
  		display: block;
  		height: 12px;
  		pointer-events: none;
  		transform: translate(0, -25%) rotate(45deg);
  		width: 12px;
		}

		:host(.open) .combobox__input {
			border-radius: 4px 4px 0 0;
		}

		.combobox__input:focus {
			border-color: #0067b8;
			box-shadow: 0 0 4px 2px #0067b8;
			outline: 4px solid transparent;
		}

		.combobox__label {
			display: block;
			font-weight: 100;
			margin-bottom: 0.25em;
			font-size: 1.2em;
		}

		.combobox__menu {
			background-color: #f5f5f5;
			border: 1px solid rgb(0 0 0 / 75%);
			border-radius: 0 0 4px 4px;
			display: none;
			max-height: 300px;
			overflow-y: scroll;
			left: 0;
			position: absolute;
			top: 100%;
			width: 100%;
			z-index: 100;
		}

		:host(.open) .combobox__menu {
		  display: flex;
      flex-direction: column;
		}

    :host([disabled]) {
      opacity: 0.6;
      pointer-events: none;
    }
    `;
    return style;
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
    shadowRoot.appendChild(this.styles);
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
    shouldOpen ? this.classList.add('open') : this.classList.remove('open');

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
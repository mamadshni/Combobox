import { getActionFromKey } from './combobox.utils.ts';
import { SelectActions } from './combobox.model.ts';
import { ComboboxOptionComponent } from './combobox-option.component.ts';

export class ComboboxWrapperComponent extends HTMLElement {

  // @ts-ignore
  #options: NodeListOf<ComboboxOptionComponent>;
  #selectedOption: string  = '';
  #activeIndex: number | null  = null;
  #isOpen: boolean = false;

  #comboboxInputElem: HTMLElement | null = null;
  #comboboxLabelElem: HTMLElement | null = null;
  #comboboxListBoxElem: HTMLElement | null = null;

  static get observedAttributes() {
    return ['label', 'placeholder']
  }

  public constructor() {
    super();
  }

  private get template(): HTMLTemplateElement {
    const template = document.createElement('template');

    let rawTemplate = `
			  <div 
			    class="combobox__label" 
					id="combobox__id-label">
				  ${this.comboLabel}
				</div>
				
  			<div 
					class="combobox__input" 
					id="combobox__id-input"
					role="combobox" 
					tabindex="0"
					aria-controls="combobox__id-list-box" 
					aria-expanded="false" 
					aria-haspopup="listbox" 
					aria-labelledby="combobox__id-label" >
					${this.#selectedOption || this.comboPlaceholder}
				</div>
				
				<div 
					class="combobox__menu" 
					id="combobox__id-list-box"
					role="listbox" 
					tabindex="-1"
					aria-labelledby="combobox__id-label" >
		`

    if (this.#options?.length > 0) {
      for (let option of this.#options) {
        rawTemplate += option.outerHTML
      }
    }

    rawTemplate += `</div>`


    template.innerHTML = rawTemplate;
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
    `;
    return style;
  }

  private get comboLabel(): string {
    return this.getAttribute("label") || "Label";
  }

  private get comboPlaceholder(): string {
    return this.getAttribute("placeholder") || "Placeholder";
  }

  private initComboboxOptions() {
   this.#options = this.querySelectorAll<ComboboxOptionComponent>("combobox-option");

   console.log('this.#options', this.#options)
    return Array.from(this.#options)
  }

  protected connectedCallback() {
    this.render()
  }

  private render() {

    const shadowRoot = this.attachShadow({ mode: 'open' });
    this.initComboboxOptions();
    shadowRoot.appendChild(this.styles);
    shadowRoot.appendChild(this.template.content.cloneNode(true));
    this.initElems();
    this.addEventsToElements();
  }

  private initElems(): void {
    this.#comboboxInputElem = this.shadowRoot?.getElementById('combobox__id-input') ?? null;
    this.#comboboxLabelElem = this.shadowRoot?.getElementById('combobox__id-label') ?? null;
    this.#comboboxListBoxElem = this.shadowRoot?.getElementById('combobox__id-list-box') ?? null;
  }

  private addEventsToElements(): void {
    this.#comboboxInputElem?.addEventListener(
      'click',
      this.onComboboxSelectInputClick.bind(this)
    );
    this.#comboboxInputElem?.addEventListener(
      'keydown',
      this.onComboboxSelectInputKeydown.bind(this)
    );
    this.#comboboxInputElem?.addEventListener(
      'blur',
      this.onComboboxBlurClick.bind(this)
    );

    this.#comboboxLabelElem?.addEventListener(
      'click',
      this.onComboboxLabelClick.bind(this)
    );

    this.#comboboxListBoxElem?.addEventListener(
      'focusout',
      this.onComboboxBlurClick.bind(this)
    );
  }

  private updateMenuState(shouldOpen: boolean, callFocus = true): void {
    if (this.#isOpen === shouldOpen) {
      return;
    }

    this.#isOpen = shouldOpen;

    this.#comboboxInputElem?.setAttribute('aria-expanded', `${shouldOpen}`);
    shouldOpen ? this.classList.add('open') : this.classList.remove('open');

    callFocus && this.#comboboxInputElem?.focus();
  }

  private onComboboxSelectInputClick(): void {
    this.updateMenuState(!this.#isOpen, false);
  }

  private onComboboxSelectInputKeydown(event: KeyboardEvent): void {

    // const max = this.#options.length - 1;
    const action = getActionFromKey(event, this.#isOpen);

    switch (action) {
      case SelectActions.Last:
      case SelectActions.First:
        return this.updateMenuState(true);
      case SelectActions.Next:
      case SelectActions.Previous:
      case SelectActions.PageUp:
      case SelectActions.PageDown:
        // event.preventDefault();
        // return this.onOptionChange(
        // 	getUpdatedIndex(this.activeIndex, max, action)
        // );
        break;
      case SelectActions.CloseSelect:
        // event.preventDefault();
        // this.selectOption(this.activeIndex);
        // intentional fallthrough
        break;
      case SelectActions.Close:
        event.preventDefault();
        return this.updateMenuState(false);
      case SelectActions.Type:
        // return this.onComboType(key);
        break;
      case SelectActions.Open:
        event.preventDefault();
        return this.updateMenuState(true);
    }
  }

  private onComboboxBlurClick(event: FocusEvent): void {
    // @ts-ignore
    if (this.#comboboxListBoxElem?.contains(event.relatedTarget)) {
      return;
    }

    if (this.#isOpen) {
      // this.selectOption(this.#activeIndex);
      this.updateMenuState(false, false);
    }
  }

  private onComboboxLabelClick(): void {
    this.#comboboxInputElem?.focus();
  }
}

customElements.define("combobox-wrapper", ComboboxWrapperComponent);
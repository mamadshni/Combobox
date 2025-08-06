import { getActionFromKey } from './combobox.utils.ts';
import { SelectActions } from './combobox.model.ts';

export class ComboboxComponent extends HTMLElement {

  #options: string[] = [];
  #selectedOption: string  = '';
  #isOpen: boolean = false;

  #comboboxSelectInputElem: HTMLElement | null = null;

  static get observedAttributes() {
    return ['label', 'placeholder']
  }

  public constructor() {
    super();
  }

  private get template(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = `
			  <div class="combobox__label">
				  ${this.comboLabel}
				</div>
				
  			<div 
					class="combobox__input" 
					id="combobox__select-input"
					role="combobox" 
					tabindex="0"
					aria-controls="listbox1" 
					aria-expanded="false" 
					aria-haspopup="listbox" 
					aria-labelledby="combo1-label" >
					${this.#selectedOption || this.comboPlaceholder}
				</div>
				
				<div 
					class="combobox__menu" 
					role="listbox" 
					tabindex="-1"
					aria-labelledby="combo1-label" >
					
					${this.#options ? this.options : null}
					
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
			display: block;
		}

		.combobox__option {
			padding: 10px 12px 12px;
		}

		.combobox__option:hover {
			background-color: rgb(0 0 0 / 10%);
		}

		.combobox__option.combobox__current {
			outline: 3px solid #0067b8;
			outline-offset: -3px;
		}

		.combobox__option[aria-selected="true"] {
			padding-right: 30px;
			position: relative;
		}

		.combobox__option[aria-selected="true"]::after {
			border-bottom: 2px solid #000;
			border-right: 2px solid #000;
			content: "";
			height: 16px;
			position: absolute;
			right: 15px;
			top: 50%;
			transform: translate(0, -50%) rotate(45deg);
			width: 8px;
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

  private get options() {
    const optionsList = this.querySelectorAll<HTMLElement>("[slot='combobox-option']")

    this.#options = [...optionsList].map(elem => elem.innerText);
    const optionsElem = this.#options.map(option => `
					<div 
						role="option" 
						class="combobox__option" 
						aria-selected="false">
						${option}
					</div>
		`)
    return optionsElem.join('');
  }

  protected connectedCallback() {
    this.render()
  }

  private render() {

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(this.styles);
    shadowRoot.appendChild(this.template.content.cloneNode(true));
    this.initElems();
    this.addEventsToElements();
  }

  private initElems(): void {
    this.#comboboxSelectInputElem = this.shadowRoot?.getElementById('combobox__select-input') ?? null;
  }

  private addEventsToElements(): void {
    this.#comboboxSelectInputElem?.addEventListener(
      'click',
      this.onComboboxSelectInputClick.bind(this)
    );
    this.#comboboxSelectInputElem?.addEventListener(
      'keydown',
      this.onComboboxSelectInputKeydown.bind(this)
    );

    // this.labelEl.addEventListener('click', this.onLabelClick.bind(this));
    // this.comboEl.addEventListener('blur', this.onComboBlur.bind(this));
    // this.listboxEl.addEventListener('focusout', this.onComboBlur.bind(this));
  }

  private updateMenuState(shouldOpen: boolean, callFocus = true): void {
    if (this.#isOpen === shouldOpen) {
      return;
    }

    this.#isOpen = shouldOpen;

    this.#comboboxSelectInputElem?.setAttribute('aria-expanded', `${shouldOpen}`);
    shouldOpen ? this.classList.add('open') : this.classList.remove('open');

    callFocus && this.#comboboxSelectInputElem?.focus();
  };

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
}

customElements.define("combobox-wrapper", ComboboxComponent);
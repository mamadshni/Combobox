export class ComboboxOptionComponent extends HTMLElement {
  isSelected: boolean = false;

  public constructor() {
    super();
    this.id = this.dataset.key || crypto.randomUUID();
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.setAttribute('aria-selected', `${selected}`);
    this.classList.toggle('combobox__selected', selected);

    if (selected) {
      this.dispatchEvent(
        new CustomEvent('combobox-select', {
          bubbles: true,
          composed: true,
          detail: {
            key: this.id,
            value: this.textContent?.trim() ?? '',
          },
        })
      );
    }
  }

  private get template(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = `
		    <slot></slot>
		`
    return template;
  }

  private get styles(): HTMLStyleElement {
    const style = document.createElement('style');
    style.innerHTML = `
		  :host {
		  	padding: 10px 12px 12px;
		  }
  
		  :host(:hover) {
		  	background-color: rgb(0 0 0 / 10%);
		  }
  
		  :host(.combobox__current) {
		  	outline: 3px solid #0067b8;
		  	outline-offset: -3px;
		  }
  
		  :host([aria-selected="true"]) {
		  	padding-right: 30px;
		  	position: relative;
		  }
  
		  :host([aria-selected="true"])::after {
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
		  
		  :host(.disabled) {
        background-color: #f0f0f0;
        color: #999;
        border: 1px solid #ccc;
        cursor: not-allowed;
        pointer-events: none;
        user-select: none;
      }
    `;
    return style;
  }

  protected connectedCallback() {
    this.render()
  }

  private render() {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(this.styles);
    shadowRoot.appendChild(this.template.content.cloneNode(true));

    this.setAttribute('role', 'option');
    this.setAttribute('aria-selected', `${this.isSelected}`);
  }




}

customElements.define("combobox-option", ComboboxOptionComponent);
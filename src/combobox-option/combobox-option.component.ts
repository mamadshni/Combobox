import css from './combobox-option.component.css?inline';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css)

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
  }

  private get template(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = `
		    <slot></slot>
		`
    return template;
  }

  protected connectedCallback() {
    this.render()
  }

  private render() {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [styleSheet];
    shadowRoot.appendChild(this.template.content.cloneNode(true));

    this.setAttribute('role', 'option');
    this.setAttribute('aria-selected', `${this.isSelected}`);
  }




}

customElements.define("combobox-option", ComboboxOptionComponent);
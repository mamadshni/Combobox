import css from './combobox-option.component.css?raw';
import html from './combobox-option.component.html?raw';

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
    template.innerHTML = html;
    return template;
  }

  private get styles(): CSSStyleSheet[] {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css)

    return [styleSheet]
  }

  protected connectedCallback() {
    this.render()
  }

  private render() {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = this.styles;
    shadowRoot.appendChild(this.template.content.cloneNode(true));

    this.setAttribute('role', 'option');
    this.setAttribute('aria-selected', `${this.isSelected}`);
  }




}

customElements.define("combobox-option", ComboboxOptionComponent);
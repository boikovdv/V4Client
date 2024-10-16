import { CSSResult, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';


export class WcBase extends LitElement {
	static styleName: string;

	override connectedCallback() {
		super.connectedCallback();
		this.classList.add(this.localName);
	}

	override createRenderRoot() {
		return this;
	}
}

interface classP {
	tagName;
	engine?: 'wc'
}

function component(opts: classP) {
	const { tagName } = opts;
	return (target, context) => {
		customElements.define(tagName, target);
	}
}

export {
	component,
	property as prop
};

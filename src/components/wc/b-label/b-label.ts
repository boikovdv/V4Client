import { WcBase, component, prop } from 'core/component/wc/wc-base';
import { unsafeCSS } from 'lit';

import { render } from './b-label.wss';
import style from './b-label.styl';

console.log(style)

@component({
	engine: 'wc',
	tagName: 'b-label'
})
export class BLabel extends WcBase {

	static override get styles() {
			return [unsafeCSS(style)];
	}

	override render() {
		return render.call(this);
	};

	@prop()
	text = 'default';

	@prop()
	items = ['item1', 'item2']
}


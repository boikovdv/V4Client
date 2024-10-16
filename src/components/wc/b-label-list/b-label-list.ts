import { WcBase, component, prop } from 'core/component/wc/wc-base';
import { unsafeCSS } from 'lit';

import { render } from './b-label-list.wss';
import style from './b-label-list.styl';

@component({
	engine: 'wc',
	tagName: 'b-label-list'
})
export class BLabel extends WcBase {
	static override get styles() {
			return [unsafeCSS(style)];
	}

	override render() {
		return render.call(this);
	};

	@prop()
	items = Array(1000).map((_,i)=>i)
}


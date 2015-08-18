import DefaultTooltip from 'gentledna-utils/dist/tooltip';
import {View} from 'backbone';

class Tooltip extends DefaultTooltip {
  show(text, {view, ...otherOptions} = {}) {
    super.show(text, otherOptions);
    if(view instanceof View) {
      this._view = view;
      view.once('cleanup', this.hide);
    }
  }

  hide() {
    super.hide();
    if(this._view) {
      this._view.off('cleanup', this.hide);
      delete this._view;
    }
  }
}

export default new Tooltip();
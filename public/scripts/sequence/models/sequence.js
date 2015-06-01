import Backbone from 'backbone';
import sequenceModelFactory from 'gentle-sequence-model/factory';
import HistorySteps from './history_steps';
import Gentle from 'gentle';
import _ from 'underscore';

export default class Sequence extends sequenceModelFactory(Backbone.DeepModel) {
  defaults() {
    return _.extend(super.defaults(), {
      displaySettings: {
        rows: {
          numbering: true,
          features: true,
          complements: true,
          aa: 'none',
          aaOffset: 0,
          res: Gentle.currentUser.get('displaySettings.rows.res'),
          hasGutters: false,
        }
      }
    });
  }

  get optionalFields() {
    return super.optionalFields.concat('displaySettings', 'meta', 'history');
  }

  serialize() {
    return _.extend(Backbone.Model.prototype.toJSON.apply(this), {
      isCurrent: (Gentle.currentSequence && Gentle.currentSequence.get('id') == this.get('id')),
      length: this.getLength()
    });
  }

  
  clearBlastCache() {
    if(this.get('meta.blast')) {
      this.set('meta.blast', {});
      this.throttledSave();
    }

    return this;
  }

  saveBlastRID(RID, database) {
    this.set('meta.blast.RID', RID);
    this.set('meta.blast.database', database);
    this.throttledSave();
    return this;
  }

  saveBlastResults(results) {
    this.set('meta.blast.results', results);
    this.throttledSave();
    return this;
  }
}
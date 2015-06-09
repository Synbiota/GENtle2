import Backbone from 'backbone';
import sequenceModelFactory from 'gentle-sequence-model/factory';
import Gentle from 'gentle';
import _ from 'underscore';


export default class SequenceModel extends sequenceModelFactory(Backbone.DeepModel) {
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

  constructor(...args) {
    super(...args);

    var defaults = this.defaults();

    if(this.get('displaySettings.rows.res.lengths') === undefined) {
      this.set('displaySettings.rows.res.lengths', defaults.displaySettings.rows.res.lengths);
    }

    if(this.get('displaySettings.rows.res.custom') === undefined) {
      this.set('displaySettings.rows.res.custom', defaults.displaySettings.rows.res.manual);
    }

    this.listenTo(this, 'change:sequence', function() {
      this.clearBlastCache();
      this.clearSequencingPrimers();
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
    return this.clearObjectAttribute('meta.blast');
  }

  clearSequencingPrimers() {
    return this.clearObjectAttribute('SequencingProducts');
  }

  clearObjectAttribute(attribute) {
    if(this.get(attribute)) {
      this.set(attribute, {});
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

import Backbone from 'backbone.mixed';
import template from '../templates/blast_db_description_view.hbs';
import BlastDbDescriptions from '../lib/blast_db_descriptions.json';
import _ from 'underscore.mixed';

export default Backbone.View.extend({
  template: template,
  manage: true,

  serialize: function() {
    var dbName = this.parentView().getDbName();
    var contents = BlastDbDescriptions[dbName];

    if(!_.isArray(contents)) contents = [contents];
    return {
      contents: _.compact(contents)
    };
  }
});
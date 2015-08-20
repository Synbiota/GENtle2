import SequenceModel from '../../../sequence/models/sequence';
import SequencesCollection from '../../../sequence/models/sequences';

var classType = 'chromatogramFragment'

class ChromatogramFragment extends SequenceModel {

  // constructor(attrs, ...args) {
  //   super(attrs, ...args);
  //   this.set({_type: classType}, {silent: true});
  // }

  // constructor(attributes, options={}) {
  //   // FIXME:  `uniqueId` does not work across browser sessions.
  //   var id = _.uniqueId();
  //   _.defaults(attributes, {
  //     id: id,
  //     name: `Child sequence ${id}`,
  //     version: 0,
  //   });

  //   _.each(this.allFields, (field) => {
  //     let writable = true;
  //     let configurable = true;
  //     let enumerable = !_.contains(this.nonEnumerableFields, field);
  //     if(_.has(attributes, field) || !enumerable) {
  //       // Makes non-enumerable fields we want to remain hidden and only used by
  //       // the class instance.  e.g. Which won't be found with `for(x of this)`
  //       if(!enumerable) {
  //         configurable = false;
  //       }
  //       let value = attributes[field];
  //       Object.defineProperty(this, field, {enumerable, value, writable, configurable});
  //     }
  //   });

  //   // Run any setup required
  //   this.setup(options);

  //   _.defaults(options, {allowValidation: true});

  //   // Data validation, unless we're skipping it.
  //   if(options.allowValidation) this.validate();
  // }

  complement(){

  }

  //consensus can go under collections?

  // toJSON() {
  //   console.log(123)
  //   let attributes = _.reduce(this.allFields, ((memo, field) => {
  //     if(_.contains(this.nonEnumerableFields, field)) {
  //       // skip
  //     } else {
  //       memo[field] = this[field];
  //     }
  //     return memo;
  //   }), {});
  //   return attributes;
  // }

}


SequencesCollection.registerConstructor(ChromatogramFragment, classType);

export default ChromatogramFragment;

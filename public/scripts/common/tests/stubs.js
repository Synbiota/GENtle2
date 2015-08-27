import Gentle from 'gentle';


class CurrentUserStub {
  get () {
    return '';
  }
}

var stubCurrentUser = function() {
  Gentle.currentUser = new CurrentUserStub();
};


var originalSaveFunctions = {
};
var stubSequenceModelSaves = function(SequenceClass) {
  var name = SequenceClass.className;
  if(originalSaveFunctions[name]) {
    console.warn(`Already stubbed ${name}`);
    return;
  }
  originalSaveFunctions[name] = SequenceClass.prototype.save;
  SequenceClass.prototype.save = () => {};
};

var restoreSequenceModelSaves = function(SequenceClass) {
  var name = SequenceClass.className;
  if(originalSaveFunctions[name]) {
    SequenceClass.prototype.save = originalSaveFunctions[name];
    delete originalSaveFunctions[name];
  } else {
    throw new Error(`Do not have a stubbed function in originalSaveFunctions to restore for ${name}`);
  }
};


export default {
  stubCurrentUser,
  stubSequenceModelSaves,
  restoreSequenceModelSaves,
};

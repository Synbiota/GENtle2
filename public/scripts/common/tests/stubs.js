import Gentle from 'gentle';


class CurrentUserStub {
  get () {
    return '';
  }
}

var stubCurrentUser = function() {
  Gentle.currentUser = new CurrentUserStub();
};


export default {stubCurrentUser};

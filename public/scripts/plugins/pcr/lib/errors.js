import {BaseError} from 'gentle-utils/errors';


class PrimerSearchError extends BaseError {}


class NoPrimer extends PrimerSearchError {}


class SequenceTooShort extends PrimerSearchError {}


var errors = {
  PrimerSearchError,
  NoPrimer,
  SequenceTooShort,
};

export default errors;
import {BaseError} from 'gentledna-utils/dist/errors';


class PrimerSearchError extends BaseError {}


class NoPrimer extends PrimerSearchError {}


class SequenceTooShort extends PrimerSearchError {}


class IdtError extends BaseError {}


var errors = {
  PrimerSearchError,
  NoPrimer,
  SequenceTooShort,
  IdtError,
};

export default errors;
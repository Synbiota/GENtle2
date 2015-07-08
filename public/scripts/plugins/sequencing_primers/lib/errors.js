import {PrimerSearchError, NoPrimer, SequenceTooShort} from '../../pcr/lib/errors';


class SequencingPrimerSearchError extends PrimerSearchError {}


class DnaLeftUnsequenced extends SequencingPrimerSearchError {}


class UniversalPrimerNotFound extends SequencingPrimerSearchError {}


class UniversalForwardPrimerNotFound extends UniversalPrimerNotFound {}


class UniversalReversePrimerNotFound extends UniversalPrimerNotFound {}


var errors = {
  PrimerSearchError,
  SequencingPrimerSearchError,
  NoPrimer,
  SequenceTooShort,
  DnaLeftUnsequenced,
  UniversalPrimerNotFound,
  UniversalForwardPrimerNotFound,
  UniversalReversePrimerNotFound,
};

export default errors;
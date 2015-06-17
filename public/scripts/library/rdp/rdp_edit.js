

/**
 * @class ValidationResponse
 */
class ValidationResponse {
  errors: Array;  // Array of SequenceFeatures
  transforms: Array;  // Array of SequenceFeatures
  success: Boolean;

  constructor(errors=[], transforms=[]) {
    this.errors = errors;
    this.transforms = transforms;
    this.success = errors.length === 0;
  }
}


/**
 * @method merge
 * @param  {ValidationResponse} validationResponse1
 * @param  {ValidationResponse} validationResponse2
 * @return {ValidationResponse}
 */
ValidationResponse.merge = function(validationResponse1, validationResponse2) {
  var errors = validationResponse1.errors.concat(validationResponse2.errors);
  var transforms = validationResponse1.transforms.concat(validationResponse2.transforms);
  return new ValidationResponse(errors, transforms);
};


export default ValidationResponse;

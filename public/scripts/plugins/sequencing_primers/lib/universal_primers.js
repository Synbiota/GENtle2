import Primer from './primer';


var mikeForward1 = function() {
  return new Primer(
  {
    sequence: 'TGCCACCTGACGTCTAAGAA',
    name: "First (Mike's universal) primer",
    from: -148,
    to: -129,
    meltingTemperature: 63,
    gcContent: 0.5,
  });
};

export default {mikeForward1};

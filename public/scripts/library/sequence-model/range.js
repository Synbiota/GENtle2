
export default class SequenceRange {
  from: number;
  size: number;
  reverse: boolean;
  constructor({from, size, reverse = false}) {
    this.from = from;
    this.size = size;
    this.reverse = reverse;
  }
  get to() { return this.from + this.size; }
}

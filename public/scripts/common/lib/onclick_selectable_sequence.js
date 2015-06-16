export default function onClickSelectableSequence(event) {
  event.preventDefault();
  $(event.target).select();
}
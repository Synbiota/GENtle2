export default function(text) {
  return text.replace(/[^\w\d']/g, '').toLowerCase();
}
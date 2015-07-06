export default function isDesktopSafari() {
  return /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
}
function render(element, untrustedText) {
  // ok: academic-js-unsafe-html
  element.textContent = untrustedText;
}

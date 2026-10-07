// Scanner fixtures only; this file is never imported or served by the app.
function render(element, untrustedText) {
  // ruleid: academic-js-unsafe-html
  element.innerHTML = untrustedText;
  // ruleid: academic-js-dynamic-code
  eval(untrustedText);
}

/**
 * Checkout page: client-side validation and fake order placement.
 *
 * Validation runs when a field loses focus, again as you type once a field
 * has an error, and for every field on submit. Each validator returns an
 * error message, or '' when the value is valid.
 *
 * Test cards (any future expiry, any 3-digit CVC):
 *   4242 4242 4242 4242  -> success
 *   4000 0000 0000 0002  -> "card declined"
 */
(function () {
  const DECLINED_TEST_CARD = '4000000000000002';
  const PROCESSING_DELAY_MS = 700;

  const form = document.getElementById('checkout-form');
  const content = document.getElementById('checkout-content');
  const emptyState = document.getElementById('checkout-empty');
  const summary = document.getElementById('checkout-summary');
  const errorSummary = document.getElementById('error-summary');
  const submitButton = document.getElementById('place-order');

  /* ---------- Empty cart ---------- */

  if (Cart.detailed().length === 0) {
    content.hidden = true;
    emptyState.hidden = false;
    return;
  }

  /* ---------- Validators ---------- */

  const digitsOnly = value => value.replace(/[\s-]/g, '');

  function passesLuhn(digits) {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let digit = Number(digits[digits.length - 1 - i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }

  function validateCardNumber(value) {
    const digits = digitsOnly(value);
    if (!digits) return 'Enter your card number.';
    if (!/^\d{13,19}$/.test(digits)) return 'Card number must be 13 to 19 digits.';
    if (!passesLuhn(digits)) return 'That card number isn\'t valid. Try the test card 4242 4242 4242 4242.';
    return '';
  }

  function validateExpiry(value) {
    const trimmed = value.trim();
    if (!trimmed) return 'Enter the expiry date.';
    const match = trimmed.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!match) return 'Use the format MM/YY, for example 08/29.';
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) return 'The month must be between 01 and 12.';
    const firstDayAfterExpiry = new Date(year, month, 1); // month is 1-based, so this is next month
    if (firstDayAfterExpiry <= new Date()) return 'This card has expired.';
    return '';
  }

  const VALIDATORS = {
    fullName: v => (v.trim().length < 2 ? 'Enter your full name.' : ''),
    email: v => (!v.trim() ? 'Enter your email address.'
      : !UI.isValidEmail(v) ? 'Enter a valid email address, like name@example.com.' : ''),
    address: v => (v.trim().length < 5 ? 'Enter your street address.' : ''),
    city: v => (!v.trim() ? 'Enter your city.' : ''),
    zip: v => (!v.trim() ? 'Enter your postal code.'
      : !/^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/.test(v.trim()) ? 'Enter a valid postal code (3 to 10 letters or numbers).' : ''),
    country: v => (!v ? 'Choose a country.' : ''),
    cardName: v => (v.trim().length < 2 ? 'Enter the name shown on the card.' : ''),
    cardNumber: validateCardNumber,
    cardExpiry: validateExpiry,
    cardCvc: v => (!/^\d{3,4}$/.test(v.trim()) ? 'Enter the 3 or 4 digit security code.' : ''),
  };

  const fields = Object.keys(VALIDATORS).map(id => document.getElementById(id));

  function validateField(input) {
    const message = VALIDATORS[input.id](input.value);
    UI.setFieldError(input, message);
    return message;
  }

  /** Returns [{ input, message }] for every invalid field. */
  function validateAll() {
    return fields
      .map(input => ({ input, message: validateField(input) }))
      .filter(result => result.message);
  }

  function showErrorSummary(errors) {
    const count = errors.length;
    errorSummary.innerHTML = `
      <h2>Please fix ${count === 1 ? 'this problem' : `these ${count} problems`}:</h2>
      <ul>${errors.map(({ input, message }) => `<li><a href="#${input.id}" data-focus="${input.id}">${UI.escapeHtml(message)}</a></li>`).join('')}</ul>`;
    errorSummary.hidden = false;
  }

  function hideErrorSummary() {
    errorSummary.hidden = true;
    errorSummary.innerHTML = '';
  }

  errorSummary.addEventListener('click', event => {
    const link = event.target.closest('[data-focus]');
    if (!link) return;
    event.preventDefault();
    document.getElementById(link.dataset.focus).focus();
  });

  fields.forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value.trim()) validateField(input);
    });
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
    });
  });

  /* ---------- Order summary ---------- */

  function renderSummary() {
    const items = Cart.detailed().map(line => `
      <li class="summary-item" data-testid="summary-item">
        <img src="${line.product.image}" alt="" width="48" height="36">
        <span>${UI.escapeHtml(line.product.name)}<span class="summary-item-qty">Qty ${line.qty}</span></span>
        <span>${UI.formatPrice(line.lineTotal)}</span>
      </li>`).join('');

    summary.innerHTML = `
      <h2 id="summary-title">Order summary</h2>
      <ul class="summary-items">${items}</ul>
      ${UI.totalsHtml(Cart.totals(), 'checkout')}
      <a class="btn btn-ghost btn-block" href="cart.html">Edit cart</a>`;
  }

  renderSummary();

  /* ---------- Prefill for logged-in users ---------- */

  const user = Auth.current();
  if (user) {
    document.getElementById('fullName').value = user.name;
    document.getElementById('email').value = user.email;
  } else {
    document.getElementById('login-hint').hidden = false;
  }

  /* ---------- Submit ---------- */

  function setSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    submitButton.setAttribute('aria-busy', String(isSubmitting));
    submitButton.textContent = isSubmitting ? 'Placing order…' : 'Place order';
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    const errors = validateAll();
    if (errors.length) {
      showErrorSummary(errors);
      errors[0].input.focus();
      return;
    }
    hideErrorSummary();

    const cardNumberInput = document.getElementById('cardNumber');
    const cardDigits = digitsOnly(cardNumberInput.value);

    setSubmitting(true);

    // Simulate a network round-trip to a payment provider.
    setTimeout(() => {
      if (cardDigits === DECLINED_TEST_CARD) {
        setSubmitting(false);
        const message = 'Your card was declined. Try the test card 4242 4242 4242 4242.';
        UI.setFieldError(cardNumberInput, message);
        showErrorSummary([{ input: cardNumberInput, message }]);
        cardNumberInput.focus();
        return;
      }

      const value = id => document.getElementById(id).value.trim();
      const order = Orders.create({
        customer: {
          name: value('fullName'),
          email: value('email'),
          address: value('address'),
          city: value('city'),
          zip: value('zip'),
          country: value('country'),
        },
        cardLast4: cardDigits.slice(-4),
      });

      Cart.clear();
      window.location.href = `confirmation.html?order=${encodeURIComponent(order.id)}`;
    }, PROCESSING_DELAY_MS);
  });
})();

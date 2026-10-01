/**
 * Login / register page. When logged in, shows the account panel with
 * order history instead.
 *
 * Supports ?next=<page>.html to return somewhere after logging in
 * (e.g. login.html?next=checkout.html).
 */
(function () {
  const accountPanel = document.getElementById('account-panel');
  const authForms = document.getElementById('auth-forms');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const $ = id => document.getElementById(id);

  const validators = {
    name: v => (v.trim().length < 2 ? 'Enter your name (at least 2 characters).' : ''),
    email: v => (!v.trim() ? 'Enter your email address.'
      : !UI.isValidEmail(v) ? 'Enter a valid email address, like name@example.com.' : ''),
    loginPassword: v => (!v ? 'Enter your password.' : ''),
    newPassword: v => (v.length < 6 ? 'Password must be at least 6 characters.' : ''),
  };

  /** Only allow redirects to local pages like "checkout.html". */
  function nextPage() {
    const next = UI.getParam('next');
    return next && /^[a-z0-9-]+\.html$/i.test(next) ? next : null;
  }

  /** Validates [input, validator] pairs, focuses the first invalid one, returns true if all valid. */
  function validate(pairs) {
    let firstInvalid = null;
    pairs.forEach(([input, check]) => {
      const message = check(input.value);
      UI.setFieldError(input, message);
      if (message && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function showFormError(element, message) {
    element.textContent = message;
    element.hidden = !message;
  }

  function resetForm(form) {
    form.reset();
    form.querySelectorAll('input').forEach(input => UI.setFieldError(input, ''));
    form.querySelectorAll('[role="alert"]').forEach(alert => showFormError(alert, ''));
  }

  function renderOrderHistory(user) {
    const list = $('order-history');
    const orders = Orders.forUser(user.email);
    $('order-history-empty').hidden = orders.length > 0;
    list.hidden = orders.length === 0;
    list.innerHTML = orders.map(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' });
      const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
      return `
        <li>
          <a href="confirmation.html?order=${encodeURIComponent(order.id)}" data-testid="order-history-item">
            <span class="order-id">${UI.escapeHtml(order.id)}</span>
            <span class="muted">${date} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}</span>
            <strong>${UI.formatPrice(order.totals.total)}</strong>
          </a>
        </li>`;
    }).join('');
  }

  function render() {
    const user = Auth.current();
    accountPanel.hidden = !user;
    authForms.hidden = Boolean(user);
    document.title = `${user ? 'Your account' : 'Log in'} · Nova Store`;
    if (!user) return;

    accountPanel.querySelector('[data-testid="account-name"]').textContent = user.name;
    accountPanel.querySelector('[data-testid="account-email"]').textContent = user.email;
    renderOrderHistory(user);
  }

  function onAuthenticated(message) {
    const next = nextPage();
    if (next) {
      UI.flash(message);
      window.location.href = next;
      return;
    }
    resetForm(loginForm);
    resetForm(registerForm);
    render();
    UI.toast(message, { type: 'success' });
    $('account-title').focus();
  }

  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    showFormError($('login-form-error'), '');
    const email = $('login-email');
    const password = $('login-password');
    if (!validate([[email, validators.email], [password, validators.loginPassword]])) return;

    const result = Auth.login({ email: email.value, password: password.value });
    if (!result.ok) {
      showFormError($('login-form-error'), result.error);
      password.select();
      password.focus();
      return;
    }
    onAuthenticated(`Welcome back, ${result.user.name}!`);
  });

  registerForm.addEventListener('submit', event => {
    event.preventDefault();
    showFormError($('register-form-error'), '');
    const name = $('register-name');
    const email = $('register-email');
    const password = $('register-password');
    const valid = validate([
      [name, validators.name],
      [email, validators.email],
      [password, validators.newPassword],
    ]);
    if (!valid) return;

    const result = Auth.register({ name: name.value, email: email.value, password: password.value });
    if (!result.ok) {
      UI.setFieldError(email, result.error);
      email.focus();
      return;
    }
    onAuthenticated(`Account created. Welcome, ${result.user.name}!`);
  });

  // Clear a field's error as soon as the user edits it.
  [loginForm, registerForm].forEach(form => {
    form.addEventListener('input', event => {
      if (event.target.matches('input')) UI.setFieldError(event.target, '');
    });
  });

  $('logout-button').addEventListener('click', () => {
    Auth.logout();
    UI.toast('You have been logged out.');
    $('login-email').focus();
  });

  // Re-render when auth changes (logout here or in another tab).
  document.addEventListener('auth:change', render);

  render();
})();

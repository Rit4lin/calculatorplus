(() => {
  'use strict';

  const expressionEl = document.getElementById('expression');
  const displayHint = document.getElementById('display-hint');
  const displayLabel = document.getElementById('display-label');
  const keypad = document.getElementById('keypad');
  const loadingScreen = document.getElementById('loading-screen');
  const backdrop = document.getElementById('paywall');
  const dialog = backdrop.querySelector('.paywall');
  const lockedExpression = document.getElementById('locked-expression');
  const closeButton = document.getElementById('close-paywall');
  const subscribeButton = document.getElementById('subscribe-button');
  const restoreButton = document.getElementById('restore-button');
  const toast = document.getElementById('toast');

  const operators = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  const MAX_DIGITS = 15;
  const LOADING_MS = 1250;
  let tokens = [];
  let current = '0';
  let awaitingNumber = false;
  let resultLocked = false;
  let loading = false;
  let loadingTimer = null;
  let toastTimer = null;
  let lastFocus = null;

  function prettyNumber(value) {
    if (value === '') return '';
    const isNegative = value.startsWith('-');
    const unsigned = isNegative ? value.slice(1) : value;
    const [integerPart, decimalPart] = unsigned.split('.');
    const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (isNegative ? '−' : '') + grouped + (decimalPart === undefined ? '' : ',' + decimalPart);
  }

  function displayExpression() {
    const pieces = tokens.map((token, index) => index % 2 === 0 ? prettyNumber(token) : token);
    if (!awaitingNumber || !tokens.length) pieces.push(prettyNumber(current));
    return pieces.join(' ') || '0';
  }

  function render() {
    expressionEl.textContent = displayExpression();
    expressionEl.scrollLeft = expressionEl.scrollWidth;
    displayLabel.textContent = resultLocked ? 'RESULTADO PROTEGIDO' : 'OPERACIÓN ACTUAL';
    displayHint.textContent = resultLocked ? 'Suscríbete para consultar la respuesta' : (tokens.length ? 'Pulsa = para obtener tu resultado' : 'Tu próxima operación empieza aquí');
  }

  function clear() {
    tokens = [];
    current = '0';
    awaitingNumber = false;
    resultLocked = false;
    render();
  }

  function readyToEdit() {
    if (resultLocked) clear();
  }

  function inputDigit(digit) {
    readyToEdit();
    if (awaitingNumber) { current = digit; awaitingNumber = false; }
    else if (current === '0') current = digit;
    else if (current === '-0') current = digit === '0' ? '-0' : '-' + digit;
    else if (current.replace(/\D/g, '').length < MAX_DIGITS) current += digit;
    render();
  }

  function decimal() {
    readyToEdit();
    if (awaitingNumber) { current = '0.'; awaitingNumber = false; }
    else if (!current.includes('.')) current += '.';
    render();
  }

  function sign() {
    readyToEdit();
    if (awaitingNumber) { current = '0'; awaitingNumber = false; }
    current = current.startsWith('-') ? current.slice(1) : '-' + current;
    render();
  }

  function percent() {
    readyToEdit();
    if (awaitingNumber) return;
    const value = Number(current) / 100;
    if (Number.isFinite(value)) current = String(Number(value.toPrecision(12)));
    render();
  }

  function operator(op) {
    readyToEdit();
    if (awaitingNumber && tokens.length) {
      tokens[tokens.length - 1] = op;
    } else {
      tokens.push(current, op);
      awaitingNumber = true;
    }
    render();
  }

  function backspace() {
    readyToEdit();
    if (awaitingNumber && tokens.length) {
      tokens.pop();
      current = tokens.pop() || '0';
      awaitingNumber = false;
    } else {
      current = current.slice(0, -1);
      if (current === '' || current === '-') current = '0';
    }
    render();
  }

  // Evaluate the entered expression without exposing the result in the interface.
  // Multiplication and division take precedence over addition and subtraction.
  function calculate() {
    const parts = [...tokens];
    if (!awaitingNumber || !parts.length) parts.push(current);
    if (parts.length % 2 === 0) parts.pop();
    if (!parts.length) return Number(current);

    const highPriority = [Number(parts[0])];
    for (let i = 1; i < parts.length; i += 2) {
      const op = parts[i];
      const number = Number(parts[i + 1]);
      if (op === '×' || op === '÷') {
        const prev = highPriority.pop();
        highPriority.push(op === '×' ? prev * number : prev / number);
      } else {
        highPriority.push(op, number);
      }
    }
    let value = highPriority[0];
    for (let i = 1; i < highPriority.length; i += 2) {
      value = highPriority[i] === '+' ? value + highPriority[i + 1] : value - highPriority[i + 1];
    }
    return value;
  }

  function equals() {
    if (loading) return;
    const calculation = calculate();
    if (!Number.isFinite(calculation)) {
      showToast('Esta operación no se puede calcular. Revisa los valores introducidos.');
      return;
    }
    loading = true;
    resultLocked = true;
    keypad.querySelectorAll('button').forEach(button => { button.disabled = true; });
    loadingScreen.hidden = false;
    lockedExpression.textContent = displayExpression();
    loadingTimer = window.setTimeout(() => {
      loading = false;
      loadingScreen.hidden = true;
      keypad.querySelectorAll('button').forEach(button => { button.disabled = false; });
      render();
      openPaywall();
    }, LOADING_MS);
  }

  function openPaywall() {
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    document.body.classList.add('modal-open');
    closeButton.focus();
  }

  function closePaywall() {
    backdrop.hidden = true;
    document.body.classList.remove('modal-open');
    toast.hidden = true;
    window.clearTimeout(toastTimer);
    if (lastFocus && lastFocus.isConnected && !lastFocus.disabled) lastFocus.focus();
    else keypad.querySelector('[data-key="equals"]').focus();
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
  }

  function handleKey(key) {
    if (loading || !backdrop.hidden) return;
    if (/^[0-9]$/.test(key)) return inputDigit(key);
    if (key in operators) return operator(operators[key]);
    if (key === 'clear') return clear();
    if (key === 'sign') return sign();
    if (key === 'percent') return percent();
    if (key === 'decimal') return decimal();
    if (key === 'backspace') return backspace();
    if (key === 'equals') return equals();
  }

  keypad.addEventListener('click', event => {
    const button = event.target.closest('button[data-key]');
    if (button && !button.disabled) handleKey(button.dataset.key);
  });

  const keyboardMap = { '+': 'add', '-': 'subtract', '*': 'multiply', x: 'multiply', X: 'multiply', '/': 'divide', '.': 'decimal', ',': 'decimal', '%': 'percent', Enter: 'equals', '=': 'equals', Backspace: 'backspace', Escape: 'clear', Delete: 'clear' };
  document.addEventListener('keydown', event => {
    if (!backdrop.hidden) {
      if (event.key === 'Escape') { event.preventDefault(); closePaywall(); }
      if (event.key === 'Tab') {
        const elements = [closeButton, subscribeButton, restoreButton];
        const index = elements.indexOf(document.activeElement);
        if (event.shiftKey && index === 0) { event.preventDefault(); elements[elements.length - 1].focus(); }
        else if (!event.shiftKey && index === elements.length - 1) { event.preventDefault(); elements[0].focus(); }
      }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = /^[0-9]$/.test(event.key) ? event.key : keyboardMap[event.key];
    if (key) {
      event.preventDefault();
      handleKey(key);
    }
  });

  closeButton.addEventListener('click', closePaywall);
  subscribeButton.addEventListener('click', () => showToast('El sistema de suscripciones está temporalmente saturado. Inténtalo de nuevo más tarde.'));
  restoreButton.addEventListener('click', () => showToast('No hemos encontrado ninguna suscripción Pro activa asociada a este dispositivo.'));

  window.addEventListener('pagehide', () => { window.clearTimeout(loadingTimer); window.clearTimeout(toastTimer); });
  render();
})();

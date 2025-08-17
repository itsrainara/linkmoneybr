function applyHeaderOffset() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const h = header.offsetHeight;
  document.body.style.paddingTop = h + 'px';
}
window.addEventListener('load', applyHeaderOffset);
window.addEventListener('resize', applyHeaderOffset);

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const phoneInput = document.getElementById('phone');

function onlyDigitsKeydown(e) {
  const allowedControl = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'Home', 'End'
  ];
  const isCtrlCombo = (e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase());
  if (allowedControl.includes(e.key) || isCtrlCombo) return;
  const isDigit = /^[0-9]$/.test(e.key);
  if (!isDigit) e.preventDefault();
}

function sanitizeToDigits(str) {
  return (str || '').replace(/\D/g, '');
}

function formatBRPhoneFromDigits(digits) {
  const d = digits.slice(0, 11); 
  if (d.length <= 2) return d;
  const ddd = d.slice(0, 2);
  if (d.length <= 6) return `(${ddd}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${ddd}) ${d.slice(2, 6)}-${d.slice(6)}`;     
  return `(${ddd}) ${d.slice(2, 7)}-${d.slice(7)}`;                         
}

function onPhoneInput(e) {
  const before = e.target.value;
  const digits = sanitizeToDigits(before);
  const formatted = formatBRPhoneFromDigits(digits);
  e.target.value = formatted;
}

function onPhonePaste(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text');
  const formatted = formatBRPhoneFromDigits(sanitizeToDigits(text));
  const start = e.target.selectionStart || 0;
  const end = e.target.selectionEnd || 0;
  const current = e.target.value;
  
  const newVal = current.slice(0, start) + formatted + current.slice(end);
  e.target.value = formatBRPhoneFromDigits(sanitizeToDigits(newVal));
}

if (phoneInput) {
  phoneInput.addEventListener('keydown', onlyDigitsKeydown);
  phoneInput.addEventListener('input', onPhoneInput);
  phoneInput.addEventListener('paste', onPhonePaste);
  phoneInput.addEventListener('drop', (e) => e.preventDefault());
}

const EMAILJS_PUBLIC_KEY  = "M6rnVxNGBI_Q8uoWv";
const EMAILJS_SERVICE_ID  = "service_rs9tq7o";
const EMAILJS_TEMPLATE_ID = "template_fffxl7w";

if (window.emailjs) {
  try { emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); }
  catch (e) { console.error("Falha ao iniciar EmailJS:", e); }
}

const form = document.getElementById('contact-form');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

function setStatus(type, text) {
  if (!statusEl) return;
  statusEl.className = `alert ${type || ""}`.trim();
  statusEl.textContent = text;
}

function validatePhoneMasked(val) {
  const digits = sanitizeToDigits(val);
  return digits.length >= 10 && digits.length <= 11;
}

const pageLoadedAt = Date.now();

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const honey = document.getElementById('company')?.value || "";
    if (honey) return; 

    const elapsed = Date.now() - pageLoadedAt;
    if (elapsed < 2000) {
      setStatus('error', 'Envio muito rápido. Tente novamente.');
      return;
    }

    const name = document.getElementById('name')?.value.trim() || '';
    const message = document.getElementById('message')?.value.trim() || '';
    const phoneMasked = phoneInput ? phoneInput.value : '';

    if (!name) {
      setStatus('error', 'Por favor, informe seu nome.');
      return;
    }
    if (!validatePhoneMasked(phoneMasked)) {
      setStatus('error', 'Telefone inválido. Use DDD + número (10 ou 11 dígitos).');
      return;
    }
    if (!message) {
      setStatus('error', 'Por favor, descreva sua dúvida.');
      return;
    }

    if (!window.emailjs) {
      setStatus('error', 'Biblioteca EmailJS não carregada.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = 0.7;
    setStatus('loading', 'Enviando sua mensagem...');

    const templateParams = {
      subject: "Nova dúvida",
      name,
      phone: phoneMasked,
      message,
      sent_at: new Date().toLocaleString('pt-BR')
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      setStatus('success', 'Mensagem enviada! Em breve entraremos em contato.');
      form.reset();
    } catch (err) {
      console.error('EmailJS error:', err);
      setStatus('error', 'Não foi possível enviar agora. Verifique Service/Template/Public Key no EmailJS e tente novamente.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = 1;
    }
  });
}

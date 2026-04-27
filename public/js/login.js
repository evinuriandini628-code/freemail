const username = document.getElementById('username');
const pwd = document.getElementById('pwd');
const btn = document.getElementById('login');
const err = document.getElementById('err');

let isSubmitting = false;

(function showLoginMessage() {
  const msg = sessionStorage.getItem('mf:login-message');
  if (msg) {
    sessionStorage.removeItem('mf:login-message');
    setTimeout(() => {
      if (typeof showToast === 'function') showToast(msg, 'info');
      else if (err) {
        err.textContent = msg;
        err.style.color = '#0b6ff6';
      }
    }, 300);
  }
})();

async function doLogin(){
  if (isSubmitting) return;
  const user = (username.value || '').trim();
  const password = (pwd.value || '').trim();

  if (!user){
    err.textContent = 'Username wajib diisi';
    await showToast('Username wajib diisi','warn');
    return;
  }
  if (!password){
    err.textContent = 'Kata sandi wajib diisi';
    await showToast('Kata sandi wajib diisi','warn');
    return;
  }

  err.textContent = '';
  isSubmitting = true;
  btn.disabled = true;
  const original = btn.textContent || 'Masuk';
  btn.textContent = 'Memproses...';

  try{
    const target = (() => {
      try{
        const u = new URL(location.href);
        const t = (u.searchParams.get('redirect') || '').trim();
        return t || '/';
      }catch(_){ return '/'; }
    })();

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        let finalTarget = target;
        if (result.role === 'mailbox') finalTarget = '/html/mailbox.html';
        else if (target === '/' && (result.role === 'admin' || result.role === 'guest')) finalTarget = '/';

        await showToast('Login berhasil, mengalihkan...', 'success');
        setTimeout(() => location.replace(finalTarget), 800);
        return;
      }
    } else {
      const errorText = await response.text();
      const message = errorText || 'Login gagal. Periksa username dan kata sandi.';
      err.textContent = message;
      await showToast(message, 'warn');
      isSubmitting = false;
      btn.disabled = false;
      btn.textContent = original;
      return;
    }

    location.replace('/templates/loading.html?redirect=' + encodeURIComponent(target) + '&status=' + encodeURIComponent('Memproses login...') + '&force=1');
    return;
  }catch(e){
    err.textContent = 'Koneksi bermasalah. Coba lagi.';
    await showToast('Koneksi bermasalah. Coba lagi.', 'warn');
    isSubmitting = false;
    btn.disabled = false;
    btn.textContent = original;
    return;
  }finally{
    if (isSubmitting) {
      isSubmitting = false;
      btn.disabled = false;
      btn.textContent = original;
    }
  }
}

btn.addEventListener('click', doLogin);
pwd.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
username.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

(() => {
  const $ = (id) => document.getElementById(id);
  let mode = 'login';
  let appLoaded = false;
  const message = (text, success = false) => {
    const el = $('authError');
    el.textContent = text;
    el.classList.toggle('success', success);
  };
  const setMode = (next) => {
    mode = next;
    const signup = mode === 'signup';
    $('authTitle').textContent = signup ? 'Crie sua conta' : 'Entre na sua conta';
    $('authSubmit').textContent = signup ? 'Criar conta grátis' : 'Entrar';
    $('nameField').hidden = !signup;
    $('authName').required = signup;
    $('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
    $('authSwitchText').textContent = signup ? 'Já tem uma conta?' : 'Ainda não tem conta?';
    $('authSwitch').textContent = signup ? 'Entrar' : 'Criar conta';
    $('forgotPassword').hidden = signup;
    message('');
  };
  function setupMessage() {
    message('Autenticação ainda não foi configurada. O administrador precisa conectar o Firebase e ativar os provedores Google e E-mail/senha.');
  }
  function loadPlayer() {
    if (appLoaded) return;
    appLoaded = true;
    $('authScreen').hidden = true;
    $('appShell').hidden = false;
    const hls = document.createElement('script');
    hls.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    hls.onload = () => {
      const app = document.createElement('script');
      app.src = 'app.js?v=neon-dashboard-20261025';
      document.body.appendChild(app);
    };
    hls.onerror = () => {
      const app = document.createElement('script');
      app.src = 'app.js?v=auth-gate-20261025';
      document.body.appendChild(app);
    };
    document.body.appendChild(hls);
    const actions = document.querySelector('.top-actions');
    if (actions && !$('logoutBtn')) {
      const btn = document.createElement('button');
      btn.id = 'logoutBtn';
      btn.className = 'icon-btn logout-btn';
      btn.title = 'Sair da conta';
      btn.setAttribute('aria-label', 'Sair da conta');
      btn.textContent = '↪';
      btn.addEventListener('click', () => window.firebase.auth().signOut());
      actions.appendChild(btn);
    }
  }

  $('authSwitch').addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));
  $('authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    message('');
    const config = window.WARLEY_FIREBASE_CONFIG || {};
    if (!window.firebase || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
      setupMessage();
      return;
    }
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    const submit = $('authSubmit');
    submit.disabled = true;
    try {
      if (mode === 'signup') {
        const credential = await window.firebase.auth().createUserWithEmailAndPassword(email, password);
        const name = $('authName').value.trim();
        if (name) await credential.user.updateProfile({displayName: name});
        message('Conta criada! Entrando no WARLEY IPTV…', true);
      } else {
        await window.firebase.auth().signInWithEmailAndPassword(email, password);
      }
    } catch (error) {
      const errors = {
        'auth/email-already-in-use': 'Este e-mail já tem uma conta. Tente entrar.',
        'auth/invalid-email': 'Digite um e-mail válido.',
        'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
        'auth/wrong-password': 'Senha incorreta. Tente novamente.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
        'auth/operation-not-allowed': 'Ative o método E-mail/senha no Firebase Authentication.'
      };
      message(errors[error.code] || error.message || 'Não foi possível autenticar. Tente novamente.');
    } finally {
      submit.disabled = false;
    }
  });

  $('googleAuth').addEventListener('click', async () => {
    const config = window.WARLEY_FIREBASE_CONFIG || {};
    if (!window.firebase || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
      setupMessage();
      return;
    }
    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      await window.firebase.auth().signInWithPopup(provider);
    } catch (error) {
      const errors = {
        'auth/popup-closed-by-user': 'A janela de login foi fechada antes de concluir.',
        'auth/unauthorized-domain': 'Adicione warleyvs597-ui.github.io aos domínios autorizados no Firebase.',
        'auth/operation-not-allowed': 'Ative o provedor Google no Firebase Authentication.'
      };
      message(errors[error.code] || error.message || 'Não foi possível entrar com Google.');
    }
  });

  $('forgotPassword').addEventListener('click', async () => {
    const config = window.WARLEY_FIREBASE_CONFIG || {};
    const email = $('authEmail').value.trim();
    if (!window.firebase || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
      setupMessage();
      return;
    }
    if (!email) {
      message('Digite seu e-mail no campo acima para receber o link de redefinição.');
      $('authEmail').focus();
      return;
    }
    try {
      await window.firebase.auth().sendPasswordResetEmail(email);
      message('Se esse e-mail estiver cadastrado, você receberá instruções para redefinir a senha.', true);
    } catch (error) {
      message(error.code === 'auth/invalid-email' ? 'Digite um e-mail válido.' : 'Não foi possível enviar o e-mail de redefinição.');
    }
  });

  const config = window.WARLEY_FIREBASE_CONFIG || {};
  if (!window.firebase || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    setupMessage();
    return;
  }
  try {
    window.firebase.initializeApp(config);
    window.firebase.auth().onAuthStateChanged((user) => {
      if (user) loadPlayer();
      else {
        appLoaded = false;
        $('appShell').hidden = true;
        $('authScreen').hidden = false;
        setMode('login');
      }
    });
  } catch (_) {
    setupMessage();
  }
})();

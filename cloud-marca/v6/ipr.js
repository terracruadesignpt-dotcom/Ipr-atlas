/* IPR Cloud v5 (28/10/2026): marca IPR e textos em português nas páginas de entrada, saída, recuperação e erro. */
(function () {
  var T = {
    "Sign-In": "Entrar", "Sign In": "Entrar", "Sign in": "Entrar", "Sign Out": "Sair", "Sign out": "Sair", "Log out": "Sair", "Logout": "Sair",
    "Login": "Utilizador ou e-mail", "Password": "Palavra-passe", "Username or email": "Nome de utilizador ou e-mail",
    "Forgot your password?": "Esqueceu-se da palavra-passe?", "Forgot Password?": "Recuperar a palavra-passe",
    "Remember Me": "Manter a sessão neste computador", "Or": "ou",
    "Are you sure you want to sign out?": "Quer mesmo sair da IPR Cloud?",
    "Password Reset": "Recuperar a palavra-passe", "Reset My Password": "Enviar a ligação",
    "E-mail address": "Endereço de e-mail", "Email address": "Endereço de e-mail", "Email": "E-mail", "E-mail": "E-mail",
    "Change Password": "Mudar a palavra-passe", "Set Password": "Definir a palavra-passe",
    "Sign Up": "Criar conta", "Signup": "Criar conta",
    "The username and/or password you specified are not correct.": "O nome de utilizador ou a palavra-passe não estão certos.",
    "The e-mail address and/or password you specified are not correct.": "O e-mail ou a palavra-passe não estão certos.",
    "Too many failed login attempts. Try again later.": "Demasiadas tentativas falhadas. Tente de novo daqui a pouco.",
    "This field is required.": "Este campo é obrigatório.",
    "Page not found": "Página não encontrada", "Not Found": "Não encontrado", "Forbidden": "Acesso recusado",
    "Server Error": "Erro no servidor", "Bad Request": "Pedido inválido",
    "Third-Party Login Failure": "A entrada com a Conta IPR falhou",
    "An error occurred while attempting to login via your third-party account.": "Houve um erro ao entrar com a Conta IPR. Tente de novo; se continuar, escreva para info@regenerativo.pt.",
    "Login Cancelled": "Entrada cancelada"
  };
  function tr(s) { var k = s.trim(); return k && T[k] ? s.replace(k, T[k]) : s; }
  function correr(raiz) {
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), n, ns = [];
    while ((n = w.nextNode())) ns.push(n);
    ns.forEach(function (x) { var p = x.parentNode && x.parentNode.nodeName; if (p !== "SCRIPT" && p !== "STYLE") { var v = tr(x.nodeValue); if (v !== x.nodeValue) x.nodeValue = v; } });
    raiz.querySelectorAll && raiz.querySelectorAll("[placeholder],[title],input[type=submit][value],[alt]").forEach(function (e) {
      ["placeholder", "title", "value", "alt"].forEach(function (a) { var v = e.getAttribute(a); if (v && (a !== "value" || e.type === "submit")) { var t = tr(v); if (t !== v) e.setAttribute(a, t); } });
    });
  }
  function aplicar() {
    document.title = document.title.replace(/QFieldCloud/g, "IPR Cloud").replace(/Sign-In/g, "Entrar").replace(/Sign Out/g, "Sair");
    document.documentElement.lang = "pt-PT";
    document.querySelectorAll(".brand-text").forEach(function (e) { e.textContent = "IPR Cloud"; });
    document.querySelectorAll("a[href='/'] img.qfc-header-logo").forEach(function (i) { i.alt = "IPR Cloud"; });
    document.querySelectorAll("img.qfc-main-logo").forEach(function (i) { i.alt = "IPR – Instituto de Planeamento Regenerativo"; });
    document.querySelectorAll(".provider-button strong").forEach(function (s) { if (/Conta IPR/.test(s.textContent)) s.textContent = "Entrar com a Conta IPR"; });
    document.querySelectorAll(".provider-button img").forEach(function (i) { if (!i.getAttribute("src")) i.alt = ""; });
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", "IPR Cloud: projectos de campo do IPR Atlas no QField, sincronizados com a equipa.");
    document.querySelectorAll("footer .navbar-text").forEach(function (f) {
      f.innerHTML = 'IPR Cloud · IPR – Instituto de Planeamento Regenerativo, Lda. · <a href="https://regenerativo.pt" target="_blank" rel="noopener">regenerativo.pt</a> · com tecnologia <a href="https://qfield.cloud" target="_blank" rel="noopener">QFieldCloud</a> (OPENGIS.ch)';
    });
    correr(document.body);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aplicar); else aplicar();
})();

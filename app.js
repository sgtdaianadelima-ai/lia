/* LIA — assistente pessoal da Daia.
 * Conversa (texto e voz), agenda, tarefas e saúde. Os dados ficam na planilha Google,
 * acessada pela "ponte" (Apps Script). Nenhum dado pessoal fica neste código. */

const SEM = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const SEMANA = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const LOCAIS = ['Barriga — lado esquerdo','Barriga — lado direito','Coxa esquerda','Coxa direita','Braço esquerdo','Braço direito'];
const TIPOS = {sim:'Sim / Não', peso:'Peso (kg)', agua:'Hidratação (ml)', refeicoes:'Refeições', texto:'Escolher uma opção'};
const DIAS_SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const TEMAS = [
  {id:'rosa', nome:'Rosa', cores:['#FAF6F1','#B8466A','#F7E1E8']},
  {id:'lilas', nome:'Lilás', cores:['#F7F5FC','#7B5CC4','#ECE6FA']},
  {id:'verde', nome:'Verde', cores:['#F4F7F3','#4F7F5B','#E1EEE3']},
  {id:'azul', nome:'Azul', cores:['#F3F7FB','#2D6CB5','#DFEBF8']},
  {id:'escuro', nome:'Escuro dourado', cores:['#16130F','#D4AF6A','#221E19']},
  {id:'noite', nome:'Noite rosa', cores:['#121417','#E77E9C','#1C2026']},
];
const DICAS = ['O que eu tenho hoje?','Tomei 2 canecas de chá','Marca dentista quinta às 15h','Comi 100 g de arroz, feijão e um filé de frango','Me lembra de pagar a conta dia 10','Quanto falta de proteína hoje?'];

let aba = 'lia';
let sub = 'hoje';   // dentro de Saúde: hoje | comida | evolucao
let D = null;       // dia aberto (saúde)
let R = null;       // relatório
let A = null;       // ajustes em edição
let G = null;       // agenda
let sug = [], foto = null, filtro = '';

/* ---------- guardar no aparelho ---------- */
function ler(k, padrao) { try { const v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; } }
function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
let CONEXAO = ler('lia_conexao', null);
let PREF = Object.assign({tema:'rosa', falar:'microfone', voz:'', velocidade:1.05}, ler('lia_pref', {}));
let CHAT = ler('lia_chat', []);
function salvarChat() { gravar('lia_chat', CHAT.slice(-80)); }
function salvarPref() { gravar('lia_pref', PREF); }

(function lerLinkDeConexao() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('u') && h.get('t')) {
    CONEXAO = {u: h.get('u'), t: h.get('t')};
    gravar('lia_conexao', CONEXAO);
    history.replaceState(null, '', location.pathname);
  }
})();

/* ---------- ajudantes ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => { if (typeof v === 'number') return v; const n = parseFloat(String(v ?? '').replace(/\s/g,'').replace(',','.')); return isNaN(n) ? 0 : n; };
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('pt-BR', {maximumFractionDigits: d});
const dt = s => { const [d,m,a] = s.split('/').map(Number); return new Date(a, m-1, d); };
const ds = x => String(x.getDate()).padStart(2,'0') + '/' + String(x.getMonth()+1).padStart(2,'0') + '/' + x.getFullYear();
const chave = s => { const p = s.split('/'); return p[2]+p[1]+p[0]; };
const curta = s => s.slice(0,5);
const hojeStr = () => ds(new Date());
const ehCelular = () => matchMedia('(pointer:coarse)').matches;
function diaComData(s) { if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s || '')) return s || 'Sem data'; const n = nomeDia(s); return /^(Hoje|Amanhã|Ontem)$/.test(n) ? n + ', ' + curta(s) : n; }
function autoAltura(t) { t.style.height = 'auto'; t.style.height = Math.min(120, t.scrollHeight) + 'px'; }
function nomeDia(s) {
  const x = dt(s), h = dt(hojeStr()), dif = Math.round((x - h) / 864e5);
  if (dif === 0) return 'Hoje'; if (dif === 1) return 'Amanhã'; if (dif === -1) return 'Ontem';
  return SEMANA[x.getDay()] + ', ' + curta(s);
}

/* ---------- ponte com o Google ---------- */
async function ponte(acao, dados) {
  if (!CONEXAO) throw new Error('A Lia ainda não está conectada. Abra o link que chegou no seu e-mail.');
  let r;
  try { r = await fetch(CONEXAO.u, {method: 'POST', body: JSON.stringify({token: CONEXAO.t, acao, dados})}); }
  catch (e) { throw new Error('Sem internet ou o Google não respondeu. Tente de novo.'); }
  let j;
  try { j = await r.json(); } catch (e) { throw new Error('O Google respondeu de um jeito estranho. Tente de novo.'); }
  if (!j.ok) throw new Error(j.erro || 'Erro desconhecido');
  return j.dados;
}
const api = (fn, ...args) => ponte('chamar', {fn, args});

let ocupado = 0;
async function rodar(fn, ...args) { return com(() => api(fn, ...args)); }
async function com(promessa) {
  ocupado++; $('#carregando').style.display = 'block';
  try { return await promessa(); }
  catch (e) { aviso((e && e.message) || String(e), true); throw e; }
  finally { if (--ocupado === 0) $('#carregando').style.display = 'none'; }
}
let tAviso;
function aviso(msg, erro) {
  const a = $('#aviso'); a.textContent = msg; a.className = erro ? 'erro' : ''; a.style.display = 'block';
  clearTimeout(tAviso); tAviso = setTimeout(() => a.style.display = 'none', erro ? 6000 : 2200);
}
function abrirModal(html) { $('#caixa').innerHTML = html; $('#modal').style.display = 'flex'; const i = $('#caixa input,#caixa select'); if (i && !ehCelular()) setTimeout(() => i.focus(), 50); }
function fecharModal() { $('#modal').style.display = 'none'; }

/* ---------- tema ---------- */
function aplicarTema() {
  document.documentElement.dataset.tema = PREF.tema;
  const t = TEMAS.find(x => x.id === PREF.tema) || TEMAS[0];
  document.querySelector('meta[name=theme-color]').content = t.cores[0];
}
function escolherTema(id) { PREF.tema = id; salvarPref(); aplicarTema(); render(); }

/* ---------- navegação ---------- */
function irAba(a) {
  if (['hoje','comida','evolucao'].includes(a)) { sub = a; a = 'saude'; }
  aba = a;
  document.querySelectorAll('nav.abas button').forEach(b => b.classList.toggle('ativa', b.dataset.aba === a));
  document.body.classList.toggle('com-chat', a === 'lia');
  $('#compositor').style.display = a === 'lia' ? 'block' : 'none';
  window.scrollTo(0, 0);
  render();
  if (!CONEXAO) return;
  if (a === 'saude') {
    if (!D) carregarDiaAtual();
    if (sub === 'evolucao') com(() => api('carregarRelatorio')).then(r => { R = r; if (aba === 'saude') render(); });
  }
  if (a === 'agenda') carregarAgenda();
  if (a === 'ajustes') com(() => api('carregarAjustes')).then(r => { A = prepararAjustes(r); if (aba === 'ajustes') render(); });
  if (a === 'lia') rolarFim();
}
function irSub(s) { irAba(s); }
async function carregarDiaAtual(data) { D = await rodar('carregarDia', data || ''); render(); }
async function mudarDia(delta) {
  const x = dt(D.data); x.setDate(x.getDate() + delta);
  const nova = ds(x);
  if (chave(nova) > chave(D.hoje)) return;
  sug = []; foto = null;
  D = await rodar('carregarDia', nova); render();
}
async function voltarHoje() { D = await rodar('carregarDia', D.hoje); render(); }
async function abrirDia(data) { D = await rodar('carregarDia', data); irAba('hoje'); }

function render() {
  const comData = aba === 'saude' && (sub === 'hoje' || sub === 'comida') && D;
  $('#titulo').innerHTML = aba === 'lia' ? '<span class="bola"></span>Lia' : {agenda:'Agenda', saude:'Saúde', ajustes:'Ajustes'}[aba];
  if (comData) {
    const x = dt(D.data), ehHoje = D.data === D.hoje;
    $('#nav').innerHTML = `<button onclick="mudarDia(-1)" aria-label="Dia anterior">‹</button>
      <div class="dia" ${ehHoje ? '' : 'onclick="voltarHoje()"'}>${SEM[x.getDay()]}, ${curta(D.data)}<small>${ehHoje ? 'hoje' : 'voltar para hoje'}</small></div>
      <button onclick="mudarDia(1)" ${ehHoje ? 'disabled' : ''} aria-label="Próximo dia">›</button>`;
  } else $('#nav').innerHTML = '';
  if (!CONEXAO && aba !== 'ajustes') { $('#conteudo').innerHTML = telaSemConexao(); return; }
  const tela = {lia: telaLia, agenda: telaAgenda, saude: telaSaude, ajustes: telaAjustes}[aba];
  $('#conteudo').innerHTML = tela();
  if (aba === 'saude' && sub === 'evolucao' && R) desenharGrafico();
}
function telaSemConexao() {
  return `<div class="boasvindas"><div class="bolao">L</div><h2>Oi! Eu sou a Lia.</h2>
    <p class="sub">Para eu acessar sua agenda e seu diário, abra uma vez, neste aparelho, o link “Conectar a Lia” que chegou no seu e-mail.</p></div>`;
}

/* ================= CONVERSA ================= */
function telaLia() {
  let h = '';
  if (!CHAT.length) {
    h += `<div class="boasvindas"><div class="bolao">L</div><h2 style="margin:0 0 4px">Oi, Daia! 💛</h2>
      <p class="sub" style="margin:0">Toque no 🎤 e fale, ou escreva. Eu marco na agenda, anoto tarefas, calculo a comida e acompanho sua saúde.</p></div>
      <div class="dicas">${DICAS.map(d => `<button class="bt" onclick="enviar(${esc(JSON.stringify(d))})">${esc(d)}</button>`).join('')}</div>`;
  }
  h += '<div class="msgs" id="msgs">' + CHAT.map((m, i) => balao(m, i)).join('') + '</div>';
  if (esperando) h += '<div class="msgs" style="margin-top:10px"><div class="msg lia digitando">Lia está pensando…</div></div>';
  return h;
}
function textoFormatado(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\n)\s*[-•]\s+/g, '$1• ').replace(/\n/g, '<br>');
}
function balao(m, i) {
  if (m.de === 'eu') return `<div class="msg eu">${textoFormatado(m.texto)}</div>`;
  const acoes = (m.acoes || []).map((a, k) => cartaoAcao(a, i, k)).join('');
  const fontes = m.fontes && m.fontes.length ? `<span>Fontes: ${esc([...new Set(m.fontes)].join(', '))}</span>` : '';
  return `<div class="msg lia">${textoFormatado(m.texto)}${acoes}
    <div class="rodape"><button onclick="falar(CHAT[${i}].texto,true)" aria-label="Ouvir">🔊 ouvir</button>${fontes}</div></div>`;
}
function cartaoAcao(a, i, k) {
  const d = a.dados || {};
  let tit = '', corpo = '';
  if (a.tipo === 'evento') {
    tit = '📅 ' + esc(d.titulo);
    const fimTxt = d.hora_inicio ? (() => { const [hh, mm] = d.hora_inicio.split(':').map(Number); const t = hh * 60 + mm + (Number(d.duracao_min) || 60); return String(Math.floor(t / 60) % 24).padStart(2,'0') + ':' + String(t % 60).padStart(2,'0'); })() : '';
    corpo = `${esc(diaComData(d.data))}<br>${d.hora_inicio ? esc(d.hora_inicio) + ' – ' + fimTxt : 'Dia inteiro'}${d.local ? '<br>📍 ' + esc(d.local) : ''}${d.hora_inicio ? `<br><span class="sub">Aviso ${(d.aviso_min ?? 30) == 0 ? 'na hora' : (d.aviso_min ?? 30) + ' min antes'}</span>` : ''}`;
  } else if (a.tipo === 'tarefa') {
    tit = '✅ ' + esc(d.titulo);
    corpo = d.data ? 'Para ' + esc(diaComData(d.data)) : 'Sem data';
    if (d.observacao) corpo += '<br><span class="sub">' + esc(d.observacao) + '</span>';
  } else if (a.tipo === 'saude') {
    tit = '💚 Registrar' + (d.data && d.data !== hojeStr() ? ' em ' + esc(d.data) : '');
    const l = [];
    if (d.agua_ml) l.push(`💧 + ${fmt(d.agua_ml)} ml de hidratação`);
    if (d.item) l.push(`${esc(d.item)}: <b>${esc(d.valor)}</b>`);
    corpo = l.join('<br>');
  } else if (a.tipo === 'refeicao') {
    const it = d.itens || [];
    const tk = it.reduce((t, x) => ({k: t.k + num(x.calorias), p: t.p + num(x.proteina)}), {k: 0, p: 0});
    tit = '🍽️ Registrar refeição' + (d.data && d.data !== hojeStr() ? ' em ' + esc(d.data) : '');
    corpo = `<table>${it.map((x, j) => `<tr><td>${esc(x.alimento)}${x.quantidade ? ` <span class="sub">— ${esc(x.quantidade)}</span>` : ''}</td><td class="n">${fmt(x.calorias)} kcal</td><td class="n">${fmt(x.proteina, 1)} g</td>${a.estado ? '' : `<td class="n"><button class="x" onclick="tirarItemAcao(${i},${k},${j})" aria-label="Tirar">×</button></td>`}</tr>`).join('')}
      <tr class="total"><td>Total</td><td class="n">${fmt(tk.k)} kcal</td><td class="n">${fmt(tk.p, 1)} g</td>${a.estado ? '' : '<td></td>'}</tr></table>`;
  } else if (a.tipo === 'mounjaro') {
    tit = '💉 Aplicação do Mounjaro';
    corpo = [d.data ? esc(d.data) : 'Hoje', d.dose && 'Dose ' + esc(d.dose), d.local && esc(d.local), d.observacao && esc(d.observacao)].filter(Boolean).join(' · ');
  }
  let botoes;
  if (a.estado === 'feito') botoes = `<div class="sub" style="margin-top:6px;color:var(--ok)">✓ ${esc(a.resultado || 'Salvo')}</div>`;
  else if (a.estado === 'cancelado') botoes = '<div class="sub" style="margin-top:6px">Cancelado</div>';
  else botoes = `<div class="botoes"><button class="bt pri" onclick="confirmarAcao(${i},${k})">✓ Confirmar</button>
      ${['evento','tarefa'].includes(a.tipo) ? `<button class="bt" onclick="editarAcao(${i},${k})">Editar</button>` : ''}
      <button class="bt" onclick="cancelarAcao(${i},${k})">Cancelar</button></div>`;
  return `<div class="acao ${a.estado || ''}"><div class="tit">${tit}</div>${corpo}${botoes}</div>`;
}
async function confirmarAcao(i, k) {
  const a = CHAT[i].acoes[k];
  const r = await com(() => ponte('executar', {tipo: a.tipo, dados: a.dados}));
  a.estado = 'feito'; a.resultado = r.texto; salvarChat();
  if (['saude','refeicao','mounjaro'].includes(a.tipo)) { D = null; R = null; }
  if (['evento','tarefa'].includes(a.tipo)) G = null;
  render(); aviso(r.texto);
}
function cancelarAcao(i, k) { CHAT[i].acoes[k].estado = 'cancelado'; salvarChat(); render(); }
function tirarItemAcao(i, k, j) { CHAT[i].acoes[k].dados.itens.splice(j, 1); salvarChat(); render(); }
function editarAcao(i, k) {
  const d = CHAT[i].acoes[k].dados, ev = CHAT[i].acoes[k].tipo === 'evento';
  abrirModal(`<h3>${ev ? '📅 Editar compromisso' : '✅ Editar tarefa'}</h3>
    <div class="campo"><label>Título</label><input id="eTit" value="${esc(d.titulo)}"></div>
    <div class="linha2 campo"><div><label class="sub">Data (dd/mm/aaaa)</label><input id="eData" value="${esc(d.data || '')}"></div>
    ${ev ? `<div><label class="sub">Hora (vazio = dia inteiro)</label><input id="eHora" type="time" value="${esc(d.hora_inicio || '')}"></div>` : ''}</div>
    ${ev ? `<div class="linha2 campo"><div><label class="sub">Duração (min)</label><input id="eDur" inputmode="numeric" value="${esc(d.duracao_min || 60)}"></div>
      <div><label class="sub">Avisar (min antes)</label><input id="eAviso" inputmode="numeric" value="${esc(d.aviso_min ?? 30)}"></div></div>
      <div class="campo"><label>Local</label><input id="eLocal" value="${esc(d.local || '')}"></div>` :
      `<div class="campo"><label>Observação</label><input id="eObs" value="${esc(d.observacao || '')}"></div>`}
    <button class="bt pri cheio" onclick="salvarEdicao(${i},${k})">Pronto</button>`);
}
function salvarEdicao(i, k) {
  const a = CHAT[i].acoes[k], d = a.dados;
  const data = $('#eData').value.trim();
  if (data && !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) { aviso('Data no formato dd/mm/aaaa', true); return; }
  d.titulo = $('#eTit').value.trim() || d.titulo; d.data = data;
  if (a.tipo === 'evento') { d.hora_inicio = $('#eHora').value; d.duracao_min = num($('#eDur').value) || 60; d.aviso_min = num($('#eAviso').value); d.local = $('#eLocal').value.trim(); }
  else d.observacao = $('#eObs').value.trim();
  salvarChat(); fecharModal(); render();
}

let esperando = false;
function rolarFim() { setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 30); }
function enviarDigitado() { const t = $('#entrada').value.trim(); if (!t) return; $('#entrada').value = ''; autoAltura($('#entrada')); enviar(t, false); }
async function enviar(texto, porVoz) {
  if (esperando) return;
  if (aba !== 'lia') irAba('lia');
  const historico = CHAT.slice(-12).map(m => ({de: m.de, texto: m.texto}));
  CHAT.push({de: 'eu', texto, hora: Date.now()}); salvarChat();
  esperando = true; render(); rolarFim();
  try {
    const r = await ponte('conversar', {mensagem: texto, historico});
    CHAT.push({de: 'lia', texto: r.texto, acoes: r.acoes || [], fontes: r.fontes || [], hora: Date.now()});
    salvarChat();
    if (PREF.falar === 'sempre' || (PREF.falar === 'microfone' && porVoz)) falar(r.texto);
  } catch (e) {
    CHAT.push({de: 'lia', texto: '⚠️ ' + ((e && e.message) || e), hora: Date.now()});
  } finally {
    esperando = false; render(); rolarFim();
  }
}
function limparConversa() {
  abrirModal(`<h3>Apagar a conversa deste aparelho?</h3><p class="sub">Só some daqui. O que já foi salvo na agenda e no diário continua.</p>
    <div class="linha2"><button class="bt cheio" onclick="fecharModal()">Cancelar</button><button class="bt pri cheio" onclick="CHAT=[];salvarChat();fecharModal();render()">Apagar</button></div>`);
}

/* ---------- voz ---------- */
const Reconhecedor = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, ouvindo = false;
function microfone() {
  if (!Reconhecedor) { aviso('Este navegador não entende voz. Use o Google Chrome.', true); return; }
  if (ouvindo) { rec.stop(); return; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  rec = new Reconhecedor();
  rec.lang = 'pt-BR'; rec.interimResults = true; rec.continuous = false;
  let final = '';
  rec.onresult = e => {
    let t = '';
    for (let n = 0; n < e.results.length; n++) t += e.results[n][0].transcript;
    final = t; $('#entrada').value = t; autoAltura($('#entrada'));
  };
  rec.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') aviso('Libere o microfone para a Lia: toque no cadeado ao lado do endereço > Microfone > Permitir.', true);
    else if (e.error === 'network') aviso('A voz precisa de internet.', true);
    else if (e.error !== 'no-speech' && e.error !== 'aborted') aviso('Não consegui ouvir (' + e.error + ').', true);
  };
  rec.onend = () => {
    ouvindo = false; marcarMic();
    if (final.trim()) { $('#entrada').value = ''; autoAltura($('#entrada')); enviar(final.trim(), true); }
  };
  try { rec.start(); ouvindo = true; marcarMic(); } catch (e) { aviso('Não consegui ligar o microfone.', true); }
}
function marcarMic() { const b = $('#btMic'); b.classList.toggle('ouvindo', ouvindo); b.textContent = ouvindo ? '■' : '🎤'; }
function vozes() { return 'speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => /^pt/i.test(v.lang)) : []; }
function falar(texto, forcar) {
  if (!('speechSynthesis' in window)) { if (forcar) aviso('Este navegador não fala.', true); return; }
  if (!forcar && PREF.falar === 'nunca') return;
  speechSynthesis.cancel();
  const limpo = String(texto).replace(/\*\*/g, '').replace(/[#*_`>]/g, '').replace(/https?:\/\/\S+/g, 'o link').replace(/\s+/g, ' ').trim();
  const u = new SpeechSynthesisUtterance(limpo);
  u.lang = 'pt-BR'; u.rate = PREF.velocidade || 1.05;
  const v = vozes().find(x => x.name === PREF.voz) || vozes().find(x => /pt-BR/i.test(x.lang));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { if (aba === 'ajustes') render(); };

/* ================= AGENDA ================= */
async function carregarAgenda() {
  try { G = await com(() => ponte('agenda', {inicio: hojeStr(), dias: 14})); } catch (e) { G = G || {erro: true}; }
  if (aba === 'agenda') render();
}
function telaAgenda() {
  let h = `<div class="ctl" style="margin-bottom:12px"><button class="bt pri" onclick="novoEvento()">+ Compromisso</button><button class="bt" onclick="novaTarefa()">+ Tarefa</button>
    <button class="bt" onclick="carregarAgenda()">↻ Atualizar</button></div>`;
  if (!G) return h + '<p class="vazio">Carregando…</p>';
  if (G.erro) return h + '<p class="vazio">Não consegui abrir a agenda agora.</p>';
  const porDia = {};
  G.eventos.forEach(e => (porDia[e.data] = porDia[e.data] || []).push(e));
  const dias = Object.keys(porDia).sort((a, b) => chave(a) < chave(b) ? -1 : 1);
  h += `<div class="card"><h2>📅 Próximos 14 dias</h2>${dias.length ? dias.map(d => `<div class="dia-ag">${esc(nomeDia(d))}</div>` +
      porDia[d].map(e => `<div class="ev"><div class="h">${e.hora ? esc(e.hora) : 'dia todo'}</div><div class="t">${esc(e.titulo)}<small>${e.hora ? esc(e.hora) + '–' + esc(e.fim) : ''}${e.local ? ' · ' + esc(e.local) : ''}</small></div></div>`).join('')).join('')
    : '<p class="vazio">Nenhum compromisso. Fale com a Lia para marcar.</p>'}</div>`;
  h += `<div class="card"><h2>✅ Tarefas</h2>${G.tarefas.length ? G.tarefas.map(t => `<div class="tarefa"><button class="caixa" onclick="concluirTarefa('${esc(t.id)}')" aria-label="Concluir"></button>
      <div>${esc(t.titulo)}${t.data ? `<div class="sub">${esc(nomeDia(t.data))}</div>` : ''}${t.obs ? `<div class="sub">${esc(t.obs)}</div>` : ''}</div></div>`).join('')
    : '<p class="vazio">Nenhuma tarefa aberta.</p>'}
    <p class="sub" style="margin:8px 0 0">Toque no quadradinho para concluir. As tarefas aparecem também no app Google Tarefas.</p></div>`;
  return h;
}
async function concluirTarefa(id) { G = await com(() => ponte('concluirTarefa', {id})); render(); aviso('Tarefa concluída ✓'); }
function novoEvento() {
  abrirModal(`<h3>📅 Novo compromisso</h3>
    <div class="campo"><label>Título</label><input id="nTit" placeholder="Ex.: Dentista"></div>
    <div class="linha2 campo"><div><label class="sub">Data</label><input id="nData" type="date"></div><div><label class="sub">Hora (vazio = dia todo)</label><input id="nHora" type="time"></div></div>
    <div class="linha2 campo"><div><label class="sub">Duração (min)</label><input id="nDur" inputmode="numeric" value="60"></div><div><label class="sub">Avisar (min antes)</label><input id="nAviso" inputmode="numeric" value="30"></div></div>
    <div class="campo"><label>Local</label><input id="nLocal"></div>
    <button class="bt pri cheio" onclick="salvarNovo('evento')">Salvar na agenda</button>`);
}
function novaTarefa() {
  abrirModal(`<h3>✅ Nova tarefa</h3>
    <div class="campo"><label>O que fazer</label><input id="nTit" placeholder="Ex.: Pagar a conta de luz"></div>
    <div class="campo"><label>Data (opcional)</label><input id="nData" type="date"></div>
    <div class="campo"><label>Observação</label><input id="nObs"></div>
    <button class="bt pri cheio" onclick="salvarNovo('tarefa')">Salvar tarefa</button>`);
}
async function salvarNovo(tipo) {
  const tit = $('#nTit').value.trim(), iso = $('#nData').value;
  if (!tit) { aviso('Escreva o título', true); return; }
  if (tipo === 'evento' && !iso) { aviso('Escolha a data', true); return; }
  const data = iso ? iso.split('-').reverse().join('/') : '';
  const dados = tipo === 'evento'
    ? {titulo: tit, data, hora_inicio: $('#nHora').value, duracao_min: num($('#nDur').value) || 60, aviso_min: num($('#nAviso').value), local: $('#nLocal').value.trim()}
    : {titulo: tit, data, observacao: $('#nObs').value.trim()};
  fecharModal();
  const r = await com(() => ponte('executar', {tipo, dados}));
  aviso(r.texto); carregarAgenda();
}

/* ================= SAÚDE ================= */
function telaSaude() {
  const seg = `<div class="seg"><button class="${sub === 'hoje' ? 'on' : ''}" onclick="irSub('hoje')">📋 Dia</button><button class="${sub === 'comida' ? 'on' : ''}" onclick="irSub('comida')">🍽️ Comida</button><button class="${sub === 'evolucao' ? 'on' : ''}" onclick="irSub('evolucao')">📈 Evolução</button></div>`;
  return seg + ({hoje: telaHoje, comida: telaComida, evolucao: telaEvolucao}[sub])();
}
function statusItem(i, v, nRef, cfg) {
  if (i.tipo === 'agua') { const ml = num(v); return ml >= cfg.meta_agua_ml ? 'ok' : (ml > 0 ? 'parcial' : 'pend'); }
  if (i.tipo === 'refeicoes') return nRef > 0 ? 'ok' : 'pend';
  if (!v) return 'pend';
  if (i.tipo === 'sim') return v === 'Sim' ? 'ok' : 'nao';
  if (i.tipo === 'texto') return /^n[ãa]o\b/i.test(v) ? 'nao' : 'ok';
  return 'ok';
}
const ICONE = {ok:'✅', nao:'✖️', parcial:'⏳', pend:'⏳'};
function barra(rotulo, valor, meta, unid, cor, cor2, tipo) {
  const pct = meta ? Math.min(100, valor / meta * 100) : 0;
  let resto;
  if (tipo === 'kcal') resto = valor <= meta ? `restam ${fmt(meta - valor)} ${unid}` : `${fmt(valor - meta)} ${unid} acima da meta`;
  else resto = valor >= meta ? 'meta atingida ✓' : `faltam ${fmt(meta - valor, 1)} ${unid}`;
  return `<div class="barra"><div class="rot"><span>${rotulo}</span><span><b>${fmt(valor, 1)}</b> / ${fmt(meta)} ${unid}</span></div>
    <div class="trilho" style="background:${cor2}"><div class="enchido" style="width:${pct}%;background:${cor}"></div></div>
    <div class="sub">${resto}</div></div>`;
}
function totais() { return D.refeicoes.reduce((t, r) => ({kcal: t.kcal + num(r.calorias), prot: t.prot + num(r.proteina)}), {kcal: 0, prot: 0}); }
function telaHoje() {
  if (!D) return '<p class="vazio">Carregando…</p>';
  const c = D.config, t = totais();
  const itemAgua = D.checklist.find(i => i.tipo === 'agua');
  const ml = itemAgua ? num(D.registros[itemAgua.item]) : 0;
  let h = '';
  if (D.situacao) h += `<div class="faixa"><span>${D.situacao === 'Livre' ? '🎈 Dia livre' : '📝 ' + esc(D.situacao)}${D.obsDia ? ' — ' + esc(D.obsDia) : ''}</span><button class="lnk" onclick="situacao('')">desfazer</button></div>`;
  h += cardMounjaroHoje();
  h += `<div class="card">
    ${barra('🥩 Proteína', t.prot, c.meta_proteina, 'g', 'var(--pri)', 'var(--pri2)')}
    ${barra('🔥 Calorias', t.kcal, c.meta_calorias, 'kcal', 'var(--kcal)', 'var(--kcal2)', 'kcal')}
    ${itemAgua && itemAgua.ativo ? barra('💧 Hidratação', ml, c.meta_agua_ml, 'ml', 'var(--agua)', 'var(--agua2)') : ''}
  </div>`;
  const ativos = D.checklist.map((i, ix) => ({i, ix})).filter(o => o.i.ativo);
  h += `<div class="card">${ativos.map(o => linhaItem(o.i, o.ix, t)).join('') || '<p class="vazio">Nenhum item na lista. Inclua em Ajustes.</p>'}</div>`;
  if (!D.situacao) h += `<div class="ctl" style="justify-content:center;margin-top:4px">
    <button class="lnk" onclick="situacao('Livre')">Marcar como dia livre</button>
    <span class="sub">·</span>
    <button class="lnk" onclick="situacao('Sem registro')">Dia sem registro de comida</button></div>`;
  return h;
}
function linhaItem(i, ix, t) {
  const v = D.registros[i.item] || '';
  const st = statusItem(i, v, D.refeicoes.length, D.config);
  let ctl = '';
  if (i.tipo === 'sim') {
    ctl = `<button class="bt ${v === 'Sim' ? 'on' : ''}" onclick="marcar(${ix},'Sim')">✓ Sim</button>
           <button class="bt ${v === 'Não' ? 'on no' : ''}" onclick="marcar(${ix},'Não')">Não</button>`;
  } else if (i.tipo === 'peso') {
    ctl = v ? `<span class="valor">${fmt(num(v), 2)} kg</span><button class="lnk" onclick="pedirPeso(${ix})">alterar</button>`
            : `<button class="bt pri" onclick="pedirPeso(${ix})">Registrar peso</button>`;
  } else if (i.tipo === 'agua') {
    ctl = `<span class="valor">${fmt(num(v))} ml</span>
      <button class="bt" onclick="pedirCanecas()">+ ☕ canecas de chá</button>
      <button class="bt" onclick="agua(${D.config.copo_agua_ml})">+ 💧 ${fmt(D.config.copo_agua_ml)}</button>
      <button class="bt" onclick="pedirAgua()">outro</button>`;
  } else if (i.tipo === 'refeicoes') {
    ctl = `<span>${D.refeicoes.length ? `${D.refeicoes.length} ${D.refeicoes.length === 1 ? 'item' : 'itens'} · ${fmt(t.kcal)} kcal · ${fmt(t.prot, 1)} g prot.` : '<span class="sub">nada registrado</span>'}</span>
      <button class="bt pri" onclick="irSub('comida')">+ Comida</button>`;
  } else {
    const ops = String(i.opcoes || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
    if (v && !ops.includes(v)) ops.push(v);
    ctl = ops.map(o => `<button class="bt ${v === o ? (/^n[ãa]o\b/i.test(o) ? 'on no' : 'on') : ''}" onclick="marcar(${ix},${esc(JSON.stringify(o))})">${esc(o)}</button>`).join('')
        + `<button class="bt" onclick="pedirTexto(${ix})">outro…</button>`;
  }
  return `<div class="item"><div class="cab"><span>${esc(i.emoji)}</span><span class="nome">${esc(i.item)}</span><span class="st">${ICONE[st]}</span></div><div class="ctl">${ctl}</div></div>`;
}
async function marcar(ix, valor) {
  const i = D.checklist[ix];
  const atual = D.registros[i.item] || '';
  const novo = atual === valor ? '' : valor;
  D.registros[i.item] = novo; render();
  D = await rodar('salvarRegistro', D.data, i.item, novo); render();
}
function pedirPeso(ix) {
  const v = D.registros[D.checklist[ix].item] || '';
  abrirModal(`<h3>⚖️ Peso de ${curta(D.data)}</h3>
    <div class="campo"><input id="mPeso" inputmode="decimal" placeholder="Ex.: 56,15" value="${esc(v ? fmt(num(v), 2) : '')}"></div>
    <div class="linha2">${v ? `<button class="bt cheio" onclick="salvarPeso(${ix},true)">Apagar</button>` : ''}<button class="bt pri cheio" onclick="salvarPeso(${ix})">Salvar</button></div>`);
}
async function salvarPeso(ix, apagar) {
  const v = apagar ? '' : num($('#mPeso').value);
  if (!apagar && (v < 20 || v > 300)) { aviso('Digite o peso em kg, ex.: 56,15', true); return; }
  fecharModal();
  D = await rodar('salvarRegistro', D.data, D.checklist[ix].item, v ? String(v).replace('.', ',') : ''); render();
}
async function agua(ml) { D = await rodar('somarAgua', D.data, ml); render(); aviso(`${ml > 0 ? '+' : ''}${fmt(ml)} ml`); }
function pedirCanecas() {
  const ml = D.config.caneca_cha_ml;
  abrirModal(`<h3>☕ Quantas canecas de chá?</h3>
    <p class="sub" style="margin:0 0 10px">Cada caneca conta como ${fmt(ml)} ml.</p>
    <div class="ctl" style="margin-bottom:12px">${[1, 2, 3, 4, 5].map(n => `<button class="bt" onclick="somarCanecas(${n})">${n} = ${fmt(n * ml)} ml</button>`).join('')}</div>
    <div class="linha2"><input id="mCanecas" inputmode="numeric" placeholder="Outro número"><button class="bt pri" onclick="somarCanecas(num($('#mCanecas').value))">Somar</button></div>`);
}
function somarCanecas(n) { if (!n) return; fecharModal(); agua(n * D.config.caneca_cha_ml); }
function pedirAgua() {
  abrirModal(`<h3>💧 Hidratação</h3>
    <div class="campo"><label>Quantos ml? (para tirar, use o botão de baixo)</label><input id="mAgua" inputmode="numeric" placeholder="Ex.: 500"></div>
    <div class="linha2"><button class="bt cheio" onclick="salvarAgua(-1)">− Tirar</button><button class="bt pri cheio" onclick="salvarAgua(1)">+ Somar</button></div>`);
}
function salvarAgua(sinal) { const ml = num($('#mAgua').value); if (!ml) return; fecharModal(); agua(sinal * ml); }
function pedirTexto(ix) {
  const i = D.checklist[ix];
  abrirModal(`<h3>${esc(i.emoji)} ${esc(i.item)}</h3>
    <div class="campo"><input id="mTexto" placeholder="Escreva aqui" value="${esc(D.registros[i.item] || '')}"></div>
    <button class="bt pri cheio" onclick="salvarTexto(${ix})">Salvar</button>`);
}
async function salvarTexto(ix) { const v = $('#mTexto').value.trim(); fecharModal(); D = await rodar('salvarRegistro', D.data, D.checklist[ix].item, v); render(); }
async function situacao(s) { D = await rodar('definirSituacao', D.data, s, s === 'Sem registro' ? 'Alimentação não registrada' : ''); render(); }

/* ---------- Mounjaro ---------- */
function proximoLocal(ultima) { if (!ultima) return LOCAIS[0]; return LOCAIS[(LOCAIS.indexOf(ultima.local) + 1) % LOCAIS.length]; }
function cardMounjaroHoje() {
  const m = D.mounjaro;
  if (m.doDia) return `<div class="faixa"><span>💉 Mounjaro aplicado${m.doDia.dose ? ' · ' + esc(m.doDia.dose) : ''}${m.doDia.local ? ' · ' + esc(m.doDia.local) : ''}</span></div>`;
  if (!m.ehDia) return '';
  return `<div class="card"><h2>💉 Hoje é dia do Mounjaro</h2>
    ${m.ultima ? `<p class="sub" style="margin:0 0 10px">Última: ${curta(m.ultima.data)} · ${esc(m.ultima.local || 'local não informado')}</p>` : ''}
    <button class="bt pri cheio" onclick="pedirMounjaro()">Registrar aplicação</button></div>`;
}
function pedirMounjaro() {
  const ultima = D ? D.mounjaro.ultima : (R && R.mounjaro.length ? R.mounjaro[R.mounjaro.length - 1] : null);
  const cfg = D ? D.config : R.config;
  const sugerido = proximoLocal(ultima);
  abrirModal(`<h3>💉 Aplicação do Mounjaro</h3>
    <div class="linha2 campo"><div><label class="sub">Data</label><input id="mjData" value="${esc(D ? D.data : R.hoje)}"></div>
      <div><label class="sub">Dose</label><input id="mjDose" placeholder="Ex.: 5 mg" value="${esc(cfg.mounjaro_dose || '')}"></div></div>
    <div class="campo"><label>Local ${ultima ? `<span class="sub">(última: ${esc(ultima.local || '—')})</span>` : ''}</label>
      <select id="mjLocal">${LOCAIS.map(l => `<option ${l === sugerido ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="campo"><label>Observação (sintomas, etc.)</label><input id="mjObs" placeholder="Opcional"></div>
    <button class="bt pri cheio" onclick="salvarMounjaro()">Salvar</button>`);
}
async function salvarMounjaro() {
  const data = $('#mjData').value.trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) { aviso('Data no formato dd/mm/aaaa', true); return; }
  const args = [data, $('#mjDose').value.trim(), $('#mjLocal').value, $('#mjObs').value.trim()];
  fecharModal();
  const d = await rodar('registrarMounjaro', ...args);
  if (D && d.data === D.data) D = d;
  aviso('Aplicação registrada');
  if (sub === 'evolucao') irSub('evolucao'); else render();
}

/* ---------- Comida ---------- */
function telaComida() {
  if (!D) return '<p class="vazio">Carregando…</p>';
  const t = totais(), c = D.config;
  let h = `<div class="faixa"><span>💬 Dica: fale para a Lia o que comeu (até receitas). Ela pesquisa na Tabela TACO e nos rótulos e calcula.</span><button class="lnk" onclick="irAba('lia')">abrir</button></div>
    <div class="card"><h2>Registrar comida</h2>
    <textarea id="txtComida" rows="3" placeholder="Ex.: 100 g de arroz, 110 g de feijão, 1 filé de frango empanado">${esc(window._txtComida || '')}</textarea>
    <div class="ctl" style="margin-top:8px">
      <label class="bt" for="arqFoto">📷 Foto</label>
      <input type="file" id="arqFoto" accept="image/*" style="display:none" onchange="escolherFoto(this)">
      <button class="bt pri" onclick="calcular()" ${D.temIA ? '' : 'disabled'}>Calcular</button>
      <button class="bt" onclick="pedirManual()">Digitar valores</button>
    </div>
    ${foto ? `<img class="foto" src="data:image/jpeg;base64,${foto}"><button class="lnk" onclick="foto=null;render()">tirar foto</button>` : ''}
    ${D.temIA ? '' : `<p class="sub" style="margin:10px 0 0">Para calcular sozinho, coloque a chave da IA em <button class="lnk" onclick="irAba('ajustes')">Ajustes</button>.</p>`}
  </div>`;
  if (sug.length) h += cardSugestoes();
  h += `<div class="card"><h2>Meus alimentos</h2>
    <input id="busca" placeholder="Procurar…" value="${esc(filtro)}" oninput="filtro=this.value;$('#chips').innerHTML=chips()" style="margin-bottom:8px">
    <div class="chips" id="chips">${chips()}</div>
    <p class="sub" style="margin:8px 0 0">Toque para somar 1 porção no dia.</p></div>`;
  h += `<div class="card"><h2>Comida de ${curta(D.data)}</h2>`;
  if (!D.refeicoes.length) h += '<p class="vazio">Nada registrado ainda.</p>';
  else h += `<table><tr><th>Alimento</th><th class="n">kcal</th><th class="n">Prot.</th><th></th></tr>
    ${D.refeicoes.map(r => `<tr><td>${esc(r.alimento)}${r.quantidade ? ` <span class="sub">— ${esc(r.quantidade)}</span>` : ''}</td><td class="n">${fmt(r.calorias)}</td><td class="n">${fmt(r.proteina, 1)} g</td><td class="n"><button class="x" onclick="removerRef(${r.linha})" aria-label="Remover">×</button></td></tr>`).join('')}
    <tr class="total"><td>Total</td><td class="n">${fmt(t.kcal)}</td><td class="n">${fmt(t.prot, 1)} g</td><td></td></tr></table>
    <p class="sub" style="margin:8px 0 0">Proteína: faltam ${fmt(Math.max(0, c.meta_proteina - t.prot), 1)} g para ${fmt(c.meta_proteina)} g · Calorias: ${fmt(t.kcal)} de ${fmt(c.meta_calorias)} kcal</p>`;
  return h + '</div>';
}
function chips() {
  const tira = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const f = tira(filtro.trim());
  const lista = D.alimentos.filter(a => !f || tira(a.alimento).includes(f));
  if (!lista.length) return '<span class="sub">Nenhum alimento encontrado. Use “Digitar valores” e marque “salvar em Meus alimentos”.</span>';
  return lista.map(a => `<button class="chip" onclick="somarAlimento(${a.linha})">${esc(a.alimento)}<small>${esc(a.quantidade)} · ${fmt(a.calorias)} kcal · ${fmt(a.proteina, 1)} g</small></button>`).join('');
}
async function somarAlimento(linha) {
  const a = D.alimentos.find(x => x.linha === linha);
  D = await rodar('adicionarRefeicoes', D.data, [{alimento: a.alimento, quantidade: a.quantidade, calorias: a.calorias, proteina: a.proteina}], false);
  render(); aviso('+ ' + a.alimento);
}
async function removerRef(linha) { D = await rodar('removerRefeicao', D.data, linha); render(); }
function pedirManual() {
  abrirModal(`<h3>Digitar valores</h3>
    <div class="campo"><label>Alimento</label><input id="mmNome" placeholder="Ex.: Iogurte grego"></div>
    <div class="campo"><label>Quantidade</label><input id="mmQtd" placeholder="Ex.: 90 g"></div>
    <div class="linha2 campo"><div><label class="sub">Calorias (kcal)</label><input id="mmKcal" inputmode="decimal"></div><div><label class="sub">Proteína (g)</label><input id="mmProt" inputmode="decimal"></div></div>
    <label class="campo" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mmSalvar" style="width:auto"> salvar em Meus alimentos</label>
    <button class="bt pri cheio" onclick="salvarManual()">Adicionar</button>`);
}
async function salvarManual() {
  const it = {alimento: $('#mmNome').value.trim(), quantidade: $('#mmQtd').value.trim(), calorias: num($('#mmKcal').value), proteina: num($('#mmProt').value)};
  if (!it.alimento) { aviso('Escreva o nome do alimento', true); return; }
  const salvar = $('#mmSalvar').checked; fecharModal();
  D = await rodar('adicionarRefeicoes', D.data, [it], salvar); render();
}
function escolherFoto(inp) {
  const arq = inp.files[0]; if (!arq) return;
  window._txtComida = $('#txtComida').value;
  const img = new Image(), url = URL.createObjectURL(arq);
  img.onload = () => {
    const s = Math.min(1, 1024 / Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    foto = cv.toDataURL('image/jpeg', 0.8).split(',')[1]; URL.revokeObjectURL(url); render();
  };
  img.onerror = () => aviso('Não consegui abrir a foto', true);
  img.src = url;
}
async function calcular() {
  const txt = $('#txtComida').value.trim();
  if (!txt && !foto) { aviso('Escreva o que comeu ou escolha uma foto', true); return; }
  window._txtComida = txt; aviso('Calculando…');
  const itens = await rodar('analisarComida', txt, foto, 'image/jpeg');
  sug = itens.map(i => ({...i, marcado: true}));
  if (!sug.length) aviso('A IA não encontrou alimentos. Tente escrever de outro jeito.', true);
  render();
}
function cardSugestoes() {
  const tk = sug.filter(s => s.marcado).reduce((t, s) => ({k: t.k + num(s.calorias), p: t.p + num(s.proteina)}), {k: 0, p: 0});
  return `<div class="card"><h2>Confira antes de salvar</h2>
    ${sug.map((s, k) => `<div class="sug">
      <label style="display:flex;gap:8px;align-items:center;font-size:15px;color:var(--txt)"><input type="checkbox" style="width:auto" ${s.marcado ? 'checked' : ''} onchange="sug[${k}].marcado=this.checked;render()"><input value="${esc(s.alimento)}" oninput="sug[${k}].alimento=this.value"></label>
      <div class="linha2"><div><label>Quantidade</label><input value="${esc(s.quantidade)}" oninput="sug[${k}].quantidade=this.value"></div>
        <div><label>kcal</label><input inputmode="decimal" value="${esc(s.calorias)}" onchange="sug[${k}].calorias=num(this.value);render()"></div>
        <div><label>Prot. (g)</label><input inputmode="decimal" value="${esc(s.proteina)}" onchange="sug[${k}].proteina=num(this.value);render()"></div></div></div>`).join('')}
    <p style="margin:6px 0 10px"><b>Total: ${fmt(tk.k)} kcal · ${fmt(tk.p, 1)} g de proteína</b></p>
    <label style="display:flex;gap:8px;align-items:center;margin-bottom:10px" class="sub"><input type="checkbox" id="sugSalvar" style="width:auto"> salvar também em Meus alimentos</label>
    <div class="linha2"><button class="bt cheio" onclick="sug=[];render()">Descartar</button><button class="bt pri cheio" onclick="salvarSug()">Adicionar ao dia</button></div></div>`;
}
async function salvarSug() {
  const itens = sug.filter(s => s.marcado).map(s => ({alimento: s.alimento, quantidade: s.quantidade, calorias: s.calorias, proteina: s.proteina, fonte: 'IA'}));
  if (!itens.length) { aviso('Marque pelo menos um alimento', true); return; }
  D = await rodar('adicionarRefeicoes', D.data, itens, $('#sugSalvar').checked);
  sug = []; foto = null; window._txtComida = ''; render(); aviso('Comida registrada');
}

/* ---------- Evolução ---------- */
function dadosRelatorio() {
  const c = R.config;
  const itemPeso = R.checklist.find(i => i.tipo === 'peso'), itemAgua = R.checklist.find(i => i.tipo === 'agua');
  const nPeso = itemPeso ? itemPeso.item : 'Peso', nAgua = itemAgua ? itemAgua.item : 'Hidratação';
  const pesos = R.dias.filter(d => num(d.reg[nPeso]) > 0).map(d => ({data: d.data, peso: num(d.reg[nPeso])}));
  return {c, pesos, nAgua};
}
function medias(dias, nAgua, ate, n) {
  const ini = new Date(ate); ini.setDate(ini.getDate() - n + 1);
  const janela = dias.filter(d => { const x = dt(d.data); return x >= ini && x <= ate; });
  const comComida = janela.filter(d => d.nRef > 0 && !d.situacao);
  const comAgua = janela.filter(d => num(d.reg[nAgua]) > 0);
  const m = (l, f) => l.length ? l.reduce((s, d) => s + f(d), 0) / l.length : null;
  return {kcal: m(comComida, d => d.kcal), prot: m(comComida, d => d.prot), agua: m(comAgua, d => num(d.reg[nAgua])), nComida: comComida.length};
}
function telaEvolucao() {
  if (!R) return '<p class="vazio">Carregando…</p>';
  const {c, pesos, nAgua} = dadosRelatorio();
  const ini = num(c.peso_inicial), meta = num(c.meta_peso);
  const atual = pesos.length ? pesos[pesos.length - 1] : null;
  let h = '';
  if (atual) {
    const perdido = ini - atual.peso, falta = atual.peso - meta;
    const caminho = ini - meta > 0 ? Math.max(0, Math.min(100, perdido / (ini - meta) * 100)) : 0;
    const semanas = Math.max(1, (dt(atual.data) - dt(c.data_inicio)) / (7 * 864e5));
    const menor = pesos.reduce((m, p) => p.peso < m.peso ? p : m, pesos[0]);
    h += `<div class="card"><div class="grade">
      <div class="kpi"><small>Início · ${curta(c.data_inicio)}</small><b>${fmt(ini, 2)} kg</b></div>
      <div class="kpi"><small>Último · ${curta(atual.data)}</small><b>${fmt(atual.peso, 2)} kg</b></div>
      <div class="kpi"><small>Diferença desde o início</small><b>${perdido >= 0 ? '−' : '+'}${fmt(Math.abs(perdido), 2)} kg</b></div>
      <div class="kpi"><small>Até a meta de ${fmt(meta, 1)} kg</small><b>${falta > 0 ? fmt(falta, 2) + ' kg' : 'meta ✓'}</b></div>
      <div class="kpi"><small>Média por semana</small><b>${perdido >= 0 ? '−' : '+'}${fmt(Math.abs(perdido) / semanas, 2)} kg</b></div>
      <div class="kpi"><small>Menor peso · ${curta(menor.data)}</small><b>${fmt(menor.peso, 2)} kg</b></div>
    </div>
    <div class="barra" style="margin-top:12px"><div class="rot"><span>Caminho até a meta</span><b>${fmt(caminho)}%</b></div><div class="trilho"><div class="enchido" style="width:${caminho}%;background:var(--ok)"></div></div></div></div>`;
    h += `<div class="card"><h2>Peso</h2><div id="grafico"></div></div>`;
  } else h += '<div class="card"><p class="vazio">Ainda não há pesos registrados.</p></div>';
  const hoje = dt(R.hoje);
  const m7 = medias(R.dias, nAgua, hoje, 7), m30 = medias(R.dias, nAgua, hoje, 30);
  const cel = (v, d, u) => v === null ? '<span class="sub">—</span>' : fmt(v, d) + ' ' + u;
  h += `<div class="card"><h2>Médias por dia</h2><table>
    <tr><th></th><th class="n">7 dias</th><th class="n">30 dias</th><th class="n">Meta</th></tr>
    <tr><td>🥩 Proteína</td><td class="n">${cel(m7.prot, 0, 'g')}</td><td class="n">${cel(m30.prot, 0, 'g')}</td><td class="n">${fmt(c.meta_proteina)} g</td></tr>
    <tr><td>🔥 Calorias</td><td class="n">${cel(m7.kcal, 0, '')}</td><td class="n">${cel(m30.kcal, 0, '')}</td><td class="n">${fmt(c.meta_calorias)}</td></tr>
    <tr><td>💧 Hidratação</td><td class="n">${cel(m7.agua === null ? null : m7.agua / 1000, 1, 'L')}</td><td class="n">${cel(m30.agua === null ? null : m30.agua / 1000, 1, 'L')}</td><td class="n">${fmt(c.meta_agua_ml / 1000, 1)} L</td></tr>
  </table><p class="sub" style="margin:8px 0 0">Conta só os dias com registro (sem dias livres). Comida: ${m7.nComida} dia(s) em 7 · ${m30.nComida} em 30.</p></div>`;
  const mj = R.mounjaro;
  h += `<div class="card"><h2>💉 Mounjaro</h2>
    ${c.mounjaro_dia ? `<p class="sub" style="margin:0 0 8px">Aplicação toda ${esc(c.mounjaro_dia.toLowerCase())}${c.mounjaro_dose ? ' · dose atual ' + esc(c.mounjaro_dose) : ''}</p>` : `<p class="sub" style="margin:0 0 8px">Escolha o dia da aplicação em Ajustes.</p>`}
    ${mj.length ? `<table><tr><th>Data</th><th>Dose</th><th>Local</th><th></th></tr>${mj.slice().reverse().slice(0, 12).map(m => `<tr><td>${curta(m.data)}</td><td>${esc(m.dose)}</td><td>${esc(m.local)}${m.obs ? `<div class="sub">${esc(m.obs)}</div>` : ''}</td><td class="n"><button class="x" onclick="apagarMj(${m.linha},'${m.data}')">×</button></td></tr>`).join('')}</table>` : '<p class="vazio">Nenhuma aplicação registrada.</p>'}
    <button class="bt pri cheio" style="margin-top:10px" onclick="pedirMounjaro()">Registrar aplicação</button></div>`;
  const ativos = R.checklist.filter(i => i.ativo && i.tipo !== 'peso');
  const itemPeso = R.checklist.find(i => i.tipo === 'peso');
  const dias = R.dias.slice().reverse();
  const mostrar = window._todos ? dias : dias.slice(0, 30);
  h += `<div class="card"><h2>Histórico por dia</h2><table>
    <tr><th>Dia</th><th class="n">Peso</th><th class="n">kcal</th><th class="n">Prot.</th><th class="n">Água</th><th class="n">✅</th></tr>
    ${mostrar.map(d => {
      const feitos = ativos.filter(i => statusItem(i, d.reg[i.item] || '', d.nRef, c) === 'ok').length;
      const p = itemPeso ? num(d.reg[itemPeso.item]) : 0;
      const sit = d.situacao ? `<div class="sub">${d.situacao === 'Livre' ? 'dia livre' : 'sem registro'}</div>` : '';
      return `<tr onclick="abrirDia('${d.data}')" style="cursor:pointer"><td>${SEM[dt(d.data).getDay()]} ${curta(d.data)}${sit}</td>
        <td class="n">${p ? fmt(p, 2) : '—'}</td><td class="n">${d.nRef ? fmt(d.kcal) : '—'}</td><td class="n">${d.nRef ? fmt(d.prot) + ' g' : '—'}</td>
        <td class="n">${num(d.reg[nAgua]) ? fmt(num(d.reg[nAgua]) / 1000, 1) + ' L' : '—'}</td><td class="n">${feitos}/${ativos.length}</td></tr>`;
    }).join('')}</table>
    ${dias.length > 30 && !window._todos ? `<button class="bt cheio" style="margin-top:10px" onclick="window._todos=true;render()">Ver todos os dias</button>` : ''}
    <p class="sub" style="margin:8px 0 0">Toque num dia para abrir e completar.</p></div>`;
  return h;
}
function apagarMj(linha, data) {
  abrirModal(`<h3>Apagar a aplicação de ${curta(data)}?</h3><div class="linha2"><button class="bt cheio" onclick="fecharModal()">Cancelar</button><button class="bt pri cheio" onclick="confirmaApagarMj(${linha},'${data}')">Apagar</button></div>`);
}
async function confirmaApagarMj(linha, data) { fecharModal(); R = await rodar('removerMounjaro', linha, data); render(); }
function desenharGrafico() {
  const el = $('#grafico'); if (!el) return;
  const {c, pesos} = dadosRelatorio();
  if (pesos.length < 2) { el.innerHTML = '<p class="vazio">Registre mais pesos para ver o gráfico.</p>'; return; }
  const W = Math.max(280, el.clientWidth), H = 190, pe = 34, pd = 10, pt = 10, pb = 22;
  const meta = num(c.meta_peso);
  const t0 = dt(pesos[0].data).getTime(), t1 = dt(pesos[pesos.length - 1].data).getTime();
  const vals = pesos.map(p => p.peso).concat([meta]);
  const yMin = Math.floor(Math.min(...vals) - 0.5), yMax = Math.ceil(Math.max(...vals) + 0.5);
  const X = t => pe + (t1 === t0 ? 0 : (t - t0) / (t1 - t0)) * (W - pe - pd);
  const Y = v => pt + (yMax - v) / (yMax - yMin) * (H - pt - pb);
  let g = '';
  const passo = yMax - yMin > 8 ? 2 : 1;
  for (let v = yMin; v <= yMax; v += passo) g += `<line x1="${pe}" x2="${W - pd}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--linha)"/><text x="${pe - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  g += `<line x1="${pe}" x2="${W - pd}" y1="${Y(meta)}" y2="${Y(meta)}" stroke="var(--ok)" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${W - pd}" y="${Y(meta) - 5}" text-anchor="end" style="fill:var(--ok)">meta ${fmt(meta, 1)}</text>`;
  const pts = pesos.map(p => [X(dt(p.data).getTime()), Y(p.peso)]);
  g += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--pri)" stroke-width="2" stroke-linejoin="round"/>`;
  g += pts.map((p, k) => `<circle cx="${p[0]}" cy="${p[1]}" r="${k === pts.length - 1 ? 4.5 : 3}" fill="var(--pri)"><title>${pesos[k].data}: ${fmt(pesos[k].peso, 2)} kg</title></circle>`).join('');
  g += `<text x="${pe}" y="${H - 5}">${curta(pesos[0].data)}</text><text x="${W - pd}" y="${H - 5}" text-anchor="end">${curta(pesos[pesos.length - 1].data)}</text>`;
  el.innerHTML = `<svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico do peso">${g}</svg>`;
}

/* ================= AJUSTES ================= */
function prepararAjustes(r) {
  return {config: {...r.config}, temIA: r.temIA, chave: '',
    checklist: r.checklist.map(i => ({item: i.item, nomeAntigo: i.item, emoji: i.emoji, tipo: i.tipo, lembretes: i.lembretes, opcoes: i.opcoes, ativo: i.ativo}))};
}
function campoCfg(k, rot, tipo) {
  return `<div class="campo"><label>${rot}</label><input ${tipo === 'n' ? 'inputmode="decimal"' : ''} value="${esc(A.config[k] ?? '')}" oninput="A.config['${k}']=this.value"></div>`;
}
function telaAjustes() {
  let h = `<div class="card"><h2>🎨 Tema</h2><div class="temas">${TEMAS.map(t => `<button class="tema ${PREF.tema === t.id ? 'on' : ''}" onclick="escolherTema('${t.id}')">
      <div class="amostra">${t.cores.map(c => `<span style="background:${c}"></span>`).join('')}</div>${t.nome}</button>`).join('')}</div></div>`;
  const vs = vozes();
  h += `<div class="card"><h2>🔊 Voz da Lia</h2>
    <div class="campo"><label>Responder falando</label><select onchange="PREF.falar=this.value;salvarPref()">
      ${[['microfone','Só quando eu usar o microfone'],['sempre','Sempre'],['nunca','Nunca']].map(o => `<option value="${o[0]}" ${PREF.falar === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
    <div class="campo"><label>Voz</label><select onchange="PREF.voz=this.value;salvarPref()"><option value="">Automática (português)</option>
      ${vs.map(v => `<option ${PREF.voz === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
      ${vs.length ? '' : '<p class="sub" style="margin:6px 0 0">Este aparelho não mostrou vozes em português. A Lia usa a voz padrão.</p>'}</div>
    <div class="campo"><label>Velocidade: ${fmt(PREF.velocidade, 2)}×</label><input type="range" min="0.7" max="1.5" step="0.05" value="${PREF.velocidade}" oninput="PREF.velocidade=Number(this.value);salvarPref();this.previousElementSibling.textContent='Velocidade: '+fmt(PREF.velocidade,2)+'×'" style="padding:0"></div>
    <div class="linha2"><button class="bt cheio" onclick="falar('Oi, Daia! Eu sou a Lia. Assim fica bom?',true)">▶ Ouvir teste</button><button class="bt cheio" onclick="limparConversa()">Apagar conversa</button></div></div>`;
  h += `<div class="card"><h2>🔗 Conexão</h2>${CONEXAO ? '<p style="margin:0 0 8px">✅ Lia conectada à sua planilha e agenda.</p><button class="lnk" onclick="desconectar()">desconectar este aparelho</button>'
    : '<p class="sub" style="margin:0">Não conectada. Abra o link “Conectar a Lia” que chegou no seu e-mail.</p>'}</div>`;
  if (!CONEXAO) return h;
  if (!A) return h + '<p class="vazio">Carregando…</p>';
  const c = A.config;
  h += `<div class="card"><h2>🎯 Metas</h2><div class="grade">
    ${campoCfg('meta_proteina', 'Proteína por dia (g)', 'n')}${campoCfg('meta_calorias', 'Calorias por dia (kcal)', 'n')}
    ${campoCfg('meta_agua_ml', 'Hidratação por dia (ml)', 'n')}${campoCfg('meta_peso', 'Meta de peso (kg)', 'n')}
    ${campoCfg('peso_inicial', 'Peso no início (kg)', 'n')}${campoCfg('data_inicio', 'Data do início', '')}
    ${campoCfg('caneca_cha_ml', 'Caneca de chá (ml)', 'n')}${campoCfg('copo_agua_ml', 'Copo de água (ml)', 'n')}
  </div></div>`;
  h += `<div class="card"><h2>💉 Mounjaro</h2><div class="grade">
    <div class="campo"><label>Dia da aplicação</label><select onchange="A.config.mounjaro_dia=this.value"><option value="">— escolha —</option>${DIAS_SEMANA.map(d => `<option ${c.mounjaro_dia === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
    ${campoCfg('mounjaro_dose', 'Dose atual', '')}
  </div></div>`;
  h += `<div class="card"><h2>📋 Minha lista do dia</h2>
    ${A.checklist.map((i, k) => `<div class="edit">
      <div class="linha2"><input class="emoji" value="${esc(i.emoji)}" oninput="A.checklist[${k}].emoji=this.value"><input value="${esc(i.item)}" placeholder="Nome do item" oninput="A.checklist[${k}].item=this.value"></div>
      <div class="linha2"><select onchange="A.checklist[${k}].tipo=this.value;render()">${Object.keys(TIPOS).map(t => `<option value="${t}" ${i.tipo === t ? 'selected' : ''}>${TIPOS[t]}</option>`).join('')}</select></div>
      ${i.tipo === 'texto' ? `<div class="linha2"><input value="${esc(i.opcoes)}" placeholder="Opções separadas por vírgula" oninput="A.checklist[${k}].opcoes=this.value"></div>` : ''}
      <div class="linha2"><label style="display:flex;gap:6px;align-items:center;font-size:14px"><input type="checkbox" style="width:auto" ${i.ativo ? 'checked' : ''} onchange="A.checklist[${k}].ativo=this.checked"> mostrar</label>
        <div class="ord"><button class="bt peq" onclick="moverItem(${k},-1)" ${k === 0 ? 'disabled' : ''}>↑</button><button class="bt peq" onclick="moverItem(${k},1)" ${k === A.checklist.length - 1 ? 'disabled' : ''}>↓</button><button class="bt peq" onclick="tirarItem(${k})">🗑</button></div></div>
    </div>`).join('')}
    <button class="bt cheio" onclick="A.checklist.push({item:'',nomeAntigo:'',emoji:'⭐',tipo:'sim',lembretes:'',opcoes:'',ativo:true});render()">+ Incluir item</button></div>`;
  h += `<div class="card"><h2>🤖 IA (Gemini, grátis)</h2>
    ${A.temIA ? '<p style="margin:0 0 8px">✅ Chave salva. <button class="lnk" onclick="A.chave=\'__apagar__\';A.temIA=false;render()">apagar chave</button></p>' : ''}
    <div class="campo"><label>${A.temIA ? 'Trocar a chave' : 'Colar a chave'}</label><input type="password" autocomplete="off" placeholder="Cole aqui" oninput="A.chave=this.value"></div>
    <p class="sub" style="margin:0">Para conseguir a chave: entre em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> com a sua conta Google, toque em “Criar chave de API”, copie e cole aqui. A chave fica guardada no seu Google, não neste aparelho.</p></div>`;
  h += `<button class="bt pri cheio" onclick="salvarAjustes()">Salvar ajustes</button>
    <p class="sub" style="text-align:center">Tema e voz são salvos na hora, só neste aparelho.</p>`;
  return h;
}
function moverItem(k, d) { const l = A.checklist; [l[k], l[k + d]] = [l[k + d], l[k]]; render(); }
function tirarItem(k) {
  abrirModal(`<h3>Tirar “${esc(A.checklist[k].item || 'item')}” da lista?</h3><p class="sub">O que você já registrou continua guardado.</p>
    <div class="linha2"><button class="bt cheio" onclick="fecharModal()">Cancelar</button><button class="bt pri cheio" onclick="A.checklist.splice(${k},1);fecharModal();render()">Tirar</button></div>`);
}
async function salvarAjustes() {
  const r = await rodar('salvarAjustes', A.config, A.checklist.filter(i => i.item.trim()), A.chave);
  A = prepararAjustes(r); D = null; R = null; render(); aviso('Ajustes salvos ✓');
}
function desconectar() {
  abrirModal(`<h3>Desconectar este aparelho?</h3><p class="sub">Para conectar de novo, abra outra vez o link do seu e-mail.</p>
    <div class="linha2"><button class="bt cheio" onclick="fecharModal()">Cancelar</button><button class="bt pri cheio" onclick="localStorage.removeItem('lia_conexao');location.reload()">Desconectar</button></div>`);
}

/* ---------- início ---------- */
aplicarTema();
irAba('lia');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

/* LIA — assistente pessoal da Daia (versão 2: visual novo).
 * Telas: Hoje, Agenda, Conversa (botão do meio), Saúde (Dia, Comida, Gráficos, Metas) e Ajustes.
 * Os dados ficam na planilha Google, acessada pela "ponte" (Apps Script). Nenhum dado pessoal fica neste código. */

const VERSAO_APP = 3;
const SEM = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const SEMANA = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const LOCAIS = ['Barriga — lado esquerdo','Barriga — lado direito','Coxa esquerda','Coxa direita','Braço esquerdo','Braço direito'];
const TIPOS = {sim:'Sim / Não', peso:'Peso (kg)', agua:'Hidratação (ml)', refeicoes:'Refeições', texto:'Escolher uma opção'};
const DIAS_SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DICAS = ['O que eu tenho hoje?','Tomei 2 canecas de chá','Marca dentista quinta às 15h','Comi 100 g de arroz, feijão e um filé de frango','Me lembra de pagar a conta dia 10','Quanto falta de proteína hoje?'];

/* ---------- ícones (traço fino) ---------- */
const sv = (d, w = 2) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  hoje: sv('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  agenda: sv('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  saude: sv('<path d="M3 12h4l3-7 4 14 3-7h4"/>'),
  ajustes: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', 1.8),
  mic: sv('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  parar: sv('<rect x="7" y="7" width="10" height="10" rx="2"/>'),
  enviar: sv('<path d="M5 12h14M13 6l6 6-6 6"/>', 2.2),
  ouvir: sv('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6"/>'),
  check: sv('<path d="M5 12l5 5 9-10"/>', 2.6),
  mais: sv('<path d="M12 5v14M5 12h14"/>', 2.2),
  esq: sv('<path d="M15 6l-6 6 6 6"/>', 2.2),
  dir: sv('<path d="M9 6l6 6-6 6"/>', 2.2),
  x: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
  lixo: sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  cima: sv('<path d="M6 15l6-6 6 6"/>', 2.2),
  baixo: sv('<path d="M6 9l6 6 6-6"/>', 2.2),
  camera: sv('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  atualizar: sv('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  peso: sv('<rect x="3" y="4" width="18" height="16" rx="4"/><path d="M8.5 10a3.5 3.5 0 0 1 7 0"/><path d="M12 10l1.5-2"/>'),
  remedio: sv('<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="M9.3 8.8l5 7"/>'),
  prato: sv('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>'),
  gota: sv('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  treino: sv('<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>'),
  vitamina: sv('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>'),
  brilho: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
  rosto: sv('<circle cx="12" cy="12" r="8"/><path d="M9 10h.01M15 10h.01M9 14.5q3 2.2 6 0"/>'),
  seringa: sv('<path d="M14 4l6 6M17 7l-9 9-3 1 1-3 9-9M10 10l4 4M3 21l3-3"/>'),
  item: sv('<circle cx="12" cy="12" r="8"/><path d="M9 12l2 2 4-4"/>'),
  editar: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  sair: sv('<path d="M15 4h4v16h-4M10 16l-4-4 4-4M6 12h10"/>'),
};
function iconeItem(i) {
  if (i.tipo === 'peso') return IC.peso; if (i.tipo === 'agua') return IC.gota; if (i.tipo === 'refeicoes') return IC.prato;
  const n = i.item.toLowerCase();
  if (/rem[ée]dio|tireoide|jejum/.test(n)) return IC.remedio;
  if (/vitamina/.test(n)) return IC.vitamina;
  if (/treino|academia|pilates|exerc/.test(n) || i.tipo === 'texto') return IC.treino;
  if (/minox/.test(n)) return IC.brilho;
  if (/skin|pele|rosto/.test(n)) return IC.rosto;
  if (/mounjaro/.test(n)) return IC.seringa;
  return IC.item;
}

/* ---------- avatares da robozinha ---------- */
const AVATARES = {
  laco: {nome:'Laço', svg:(c)=>`<svg class="av" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 11V7" stroke="${c.a}" stroke-width="2.4" stroke-linecap="round"/><path d="M24 .6l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#F0BE4E"/><rect x="5" y="20" width="4" height="10" rx="2" fill="${c.a}" opacity=".7"/><rect x="39" y="20" width="4" height="10" rx="2" fill="${c.a}" opacity=".7"/><rect x="7" y="11" width="34" height="30" rx="14" fill="${c.a}"/><rect x="12" y="17" width="24" height="17" rx="8.5" fill="${c.f}"/><path d="M16.5 24.4q2.5-2.6 5 0M26.5 24.4q2.5-2.6 5 0" stroke="${c.i}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M16.6 24.1l-1.4-.9M31.4 24.1l1.4-.9" stroke="${c.i}" stroke-width="1.3" stroke-linecap="round"/><circle cx="16" cy="29" r="1.8" fill="#F4A3C2"/><circle cx="32" cy="29" r="1.8" fill="#F4A3C2"/><path d="M21.6 29.4q2.4 2 4.8 0" stroke="${c.i}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M35.5 12.5l-4.6-3.4v6.8zM35.5 12.5l4.6-3.4v6.8z" fill="#F28DB5"/><circle cx="35.5" cy="12.5" r="1.7" fill="#E8679A"/></svg>`},
  fone: {nome:'Fone', svg:(c)=>`<svg class="av" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 11V7" stroke="${c.a}" stroke-width="2.4" stroke-linecap="round"/><path d="M24 .6l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#F0BE4E"/><rect x="7" y="11" width="34" height="30" rx="14" fill="${c.a}"/><path d="M6.5 25a17.5 15 0 0 1 35 0" stroke="${c.i}" stroke-width="1.6" fill="none" opacity=".55"/><rect x="3.5" y="21" width="6" height="10" rx="3" fill="${c.i}"/><rect x="38.5" y="21" width="6" height="10" rx="3" fill="${c.i}"/><path d="M6.5 30q0 7 9 7.5" stroke="${c.i}" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="16.5" cy="37.5" r="1.8" fill="${c.i}"/><rect x="12" y="17" width="24" height="16" rx="8" fill="${c.f}"/><circle cx="19" cy="24" r="2.5" fill="${c.i}"/><circle cx="29" cy="24" r="2.5" fill="${c.i}"/><circle cx="19.8" cy="23.2" r=".8" fill="${c.f}"/><circle cx="29.8" cy="23.2" r=".8" fill="${c.f}"/><path d="M16.6 21.6l-1.2-1M31.4 21.6l1.2-1" stroke="${c.i}" stroke-width="1.2" stroke-linecap="round"/><circle cx="16" cy="28.6" r="1.6" fill="#F4A3C2"/><circle cx="32" cy="28.6" r="1.6" fill="#F4A3C2"/><path d="M21.8 28.8q2.2 1.8 4.4 0" stroke="${c.i}" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`},
  estrela: {nome:'Estrelinha', svg:(c)=>`<svg class="av" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 11V7" stroke="${c.a}" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="5" r="2.6" fill="#F0BE4E"/><rect x="7" y="11" width="34" height="30" rx="15" fill="${c.a}"/><rect x="12" y="17" width="24" height="17" rx="8.5" fill="${c.f}"/><ellipse cx="19" cy="24.5" rx="2.4" ry="2.9" fill="${c.i}"/><ellipse cx="29" cy="24.5" rx="2.4" ry="2.9" fill="${c.i}"/><circle cx="19.8" cy="23.6" r=".9" fill="${c.f}"/><circle cx="29.8" cy="23.6" r=".9" fill="${c.f}"/><path d="M16.4 22.3l-1.4-1.1M16.9 21.4l-.9-1.4M31.6 22.3l1.4-1.1M31.1 21.4l.9-1.4" stroke="${c.i}" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.8" cy="29.4" r="1.7" fill="#F4A3C2"/><circle cx="32.2" cy="29.4" r="1.7" fill="#F4A3C2"/><path d="M22 29.8q2 1.6 4 0" stroke="${c.i}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M35 9.4l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="#F0BE4E"/></svg>`},
};
const avatar = () => (AVATARES[PREF.avatar] || AVATARES.laco).svg({a: COR.accent, f: COR.surface, i: COR.ink});
const avatarFab = () => (AVATARES[PREF.avatar] || AVATARES.laco).svg({a: COR.accentInk, f: COR.accent, i: COR.accentInk});

/* ---------- temas ---------- */
const P = (bg, surface, soft, line, ink, ink2, ink3, accent) => ({bg, surface, soft, line, ink, ink2, ink3, accent});
const TEMAS = {
  lavanda: {nome:'Lavanda', claro:P('#F8F6FC','#FFFFFF','#EEE9F8','#E6E0F2','#2A2338','#5C5374','#918AA6','#7A5CC8'), escuro:P('#141119','#1E1925','#2A2334','#342C40','#EEE9F7','#C4BAD6','#8D84A0','#B49CF0')},
  rosacha: {nome:'Rosa chá', claro:P('#FCF7F7','#FFFFFF','#F7E8EA','#EEDDE0','#33232A','#6A5058','#A08890','#C46A86'), escuro:P('#181214','#221A1D','#31252A','#3D2E34','#F4E9EC','#CDB6BE','#977F88','#E79BB3')},
  pessego: {nome:'Pêssego', claro:P('#FFF8F4','#FFFFFF','#FBEDE6','#F1DDD2','#33231C','#6B5247','#9E877C','#D9694A'), escuro:P('#1A1310','#231A16','#2D221D','#3D2F28','#F6EAE4','#CDB7AC','#998378','#F29C7F')},
  salvia: {nome:'Sálvia', claro:P('#F4F7F3','#FFFFFF','#E6EFE6','#DCE6DA','#1F2A23','#4A5B4F','#829087','#4E8A66'), escuro:P('#111712','#18211A','#202B23','#2D3A30','#E7EFE9','#B3C2B7','#7E8E83','#7FC79A')},
  ceu: {nome:'Céu', claro:P('#F4F8FC','#FFFFFF','#E6EEF8','#DCE5F0','#1A2233','#4C5770','#8590A6','#3F6FD1'), escuro:P('#0F141C','#161D28','#1E2734','#2B3647','#E6ECF6','#AAB6CB','#7987A0','#8EAEF5')},
  areia: {nome:'Areia', claro:P('#FAF7F2','#FFFFFF','#F1EBE1','#E6DED1','#2E2720','#655A4D','#9A8F82','#A0784C'), escuro:P('#16130F','#201C17','#2A251F','#3A332B','#F2ECE3','#CBBFAF','#968B7E','#D7AE7C')},
  grafite: {nome:'Grafite', claro:P('#F7F7F5','#FFFFFF','#EFEFEC','#E2E2DE','#18191A','#55585B','#8C8F92','#2F3437'), escuro:P('#111213','#18191B','#202224','#2E3033','#EDEDEA','#B4B6B8','#7F8285','#E8E8E6')},
};
const CORES_LIVRES = ['#7A5CC8','#9B6FD6','#C46A86','#E07AA0','#D9694A','#E0A33A','#4E8A66','#2E8B8B','#3F6FD1','#5B6B8C','#A0784C','#2F3437'];

/* ---------- guardar no aparelho ---------- */
function ler(k, padrao) { try { const v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; } }
function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
let CONEXAO = ler('lia_conexao', null);
let PREF = Object.assign({tema:'lavanda', cor:'', modo:'auto', avatar:'laco', falar:'microfone', voz:'', velocidade:1.05}, ler('lia_pref', {}));
if (!TEMAS[PREF.tema]) PREF.tema = 'lavanda';
if (!AVATARES[PREF.avatar]) PREF.avatar = 'laco';
if (['microfone','sempre','nunca'].indexOf(PREF.falar) < 0) PREF.falar = 'microfone';
let CHAT = ler('lia_chat', []);
const salvarChat = () => gravar('lia_chat', CHAT.slice(-80));
const salvarPref = () => gravar('lia_pref', PREF);
(function lerLinkDeConexao() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('u') && h.get('t')) { CONEXAO = {u: h.get('u'), t: h.get('t')}; gravar('lia_conexao', CONEXAO); history.replaceState(null, '', location.pathname); }
})();

/* ---------- cores calculadas ---------- */
let COR = {};
const hexRgb = h => { const x = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(x.substr(i, 2), 16)); };
const rgbHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mistura = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };
const luz = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
const escuroAgora = () => PREF.modo === 'escuro' || (PREF.modo === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
function aplicarTema() {
  const escuro = escuroAgora();
  const p = TEMAS[PREF.tema][escuro ? 'escuro' : 'claro'];
  let accent = PREF.cor || p.accent;
  if (PREF.cor && escuro && luz(accent) < .18) accent = mistura(accent, '#FFFFFF', .35);
  const accentInk = luz(accent) > .45 ? mistura(p.ink, '#000000', .3) : '#FFFFFF';
  COR = {...p, accent, accentInk, accentSoft: mistura(p.surface, accent, escuro ? .22 : .13)};
  const r = document.documentElement.style;
  const v = {bg:p.bg, surface:p.surface, soft:p.soft, line:p.line, ink:p.ink, 'ink-2':p.ink2, 'ink-3':p.ink3, accent, 'accent-ink':accentInk, 'accent-soft':COR.accentSoft,
    ok: escuro ? '#7FCB98' : '#3E8E5E', 'ok-soft': escuro ? '#1E3A2A' : '#E1F1E6', bad: escuro ? '#F08576' : '#C94A3D', 'bad-soft': escuro ? '#3E201D' : '#F8DEDA',
    agua: escuro ? '#6AAEE8' : '#3B7FC4', kcal: escuro ? '#E9B45A' : '#C98A2B', treino: escuro ? '#7FC79A' : '#4E8A66',
    sombra: escuro ? '0 1px 2px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.25)' : '0 1px 2px rgba(42,35,56,.05),0 10px 30px rgba(42,35,56,.06)'};
  Object.entries(v).forEach(([k, x]) => r.setProperty('--' + k, x));
  document.documentElement.style.colorScheme = escuro ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = p.bg;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (PREF.modo === 'auto') { aplicarTema(); desenhar(); } });

/* ---------- ajudantes ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => { if (typeof v === 'number') return v; const n = parseFloat(String(v ?? '').replace(/\s/g,'').replace(',','.')); return isNaN(n) ? 0 : n; };
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('pt-BR', {maximumFractionDigits: d});
const fmtF = (n, d) => Number(n || 0).toLocaleString('pt-BR', {maximumFractionDigits: d, minimumFractionDigits: d});
const dt = s => { const [d,m,a] = s.split('/').map(Number); return new Date(a, m-1, d); };
const ds = x => String(x.getDate()).padStart(2,'0') + '/' + String(x.getMonth()+1).padStart(2,'0') + '/' + x.getFullYear();
const chave = s => { const p = s.split('/'); return p[2]+p[1]+p[0]; };
const curta = s => s.slice(0,5);
const hojeStr = () => ds(new Date());
const ehCelular = () => matchMedia('(pointer:coarse)').matches;
function nomeDia(s) {
  const dif = Math.round((dt(s) - dt(hojeStr())) / 864e5);
  if (dif === 0) return 'Hoje'; if (dif === 1) return 'Amanhã'; if (dif === -1) return 'Ontem';
  return SEMANA[dt(s).getDay()] + ', ' + curta(s);
}
function diaComData(s) { if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s || '')) return s || 'Sem data'; const n = nomeDia(s); return /^(Hoje|Amanhã|Ontem)$/.test(n) ? n + ', ' + curta(s) : n; }
function anel(v, meta, cor, rot, sub) {
  const d = (meta ? Math.min(1, v / meta) : 0) * 94.25;
  return `<div class="anel"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--soft)" stroke-width="4"/><circle opacity="${d > 0.5 ? 1 : 0}" cx="18" cy="18" r="15" fill="none" stroke="${cor}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${d.toFixed(1)} 94.25" transform="rotate(-90 18 18)"/></svg><b>${rot}</b><small>${sub}</small></div>`;
}
function barraMeta(rot, valor, meta, unid, cor, tipo) {
  const pct = meta ? Math.min(100, valor / meta * 100) : 0;
  const resto = tipo === 'kcal' ? (valor <= meta ? `restam ${fmt(meta - valor)} ${unid}` : `${fmt(valor - meta)} ${unid} acima`) : (valor >= meta ? 'meta atingida' : `faltam ${fmt(meta - valor, 1)} ${unid}`);
  return `<div class="meta"><div class="rot"><span>${rot}</span><span><b>${fmt(valor, 1)}</b> / ${fmt(meta)} ${unid}</span></div><div class="trilho"><i style="width:${pct}%;background:${cor}"></i></div><span class="sub">${resto}</span></div>`;
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
async function com(f) {
  ocupado++; $('#carregando').style.display = 'block';
  try { return await f(); }
  catch (e) { aviso((e && e.message) || String(e), true); throw e; }
  finally { if (--ocupado === 0) $('#carregando').style.display = 'none'; }
}
const rodar = (fn, ...args) => com(() => api(fn, ...args));
let tAviso;
function aviso(msg, erro) {
  const a = $('#aviso'); a.textContent = msg; a.className = erro ? 'erro' : ''; a.style.display = 'block';
  clearTimeout(tAviso); tAviso = setTimeout(() => a.style.display = 'none', erro ? 6000 : 2200);
}
function abrirModal(html) { $('#caixa').innerHTML = html; $('#modal').style.display = 'flex'; const i = $('#caixa input,#caixa select'); if (i && !ehCelular()) setTimeout(() => i.focus(), 50); }
function fecharModal() { $('#modal').style.display = 'none'; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') fecharModal(); });

/* ================= ESTADO E NAVEGAÇÃO ================= */
let aba = 'hoje', sub = 'dia';
let H = null;   // hoje (para a tela Hoje)
let D = null;   // dia aberto em Saúde
let R = null;   // relatório (gráficos)
let A = null;   // ajustes em edição
let G = null;   // agenda (14 dias)
let sug = [], foto = null, filtro = '';
let graf = {metrica: 'peso', periodo: 'tudo'};
let calc = null;

const ABAS = [['hoje','Hoje',IC.hoje],['agenda','Agenda',IC.agenda],['lia','Falar',null],['saude','Saúde',IC.saude],['ajustes','Ajustes',IC.ajustes]];
function desenharNav() {
  $('#tabbar').innerHTML = ABAS.map(([k, n, ic]) => k === 'lia'
    ? `<button class="tab fab" data-ir="lia" aria-label="Falar com a Lia" ${aba === 'lia' ? 'aria-current="page"' : ''}><span class="bolha ${ouvindo ? 'ouvindo' : ''}">${avatarFab()}</span>Falar</button>`
    : `<button class="tab" data-ir="${k}" ${aba === k ? 'aria-current="page"' : ''}>${ic}${n}</button>`).join('');
  $('#rail').innerHTML = `<div class="marca">${avatar()}<b>Lia</b></div>` +
    ABAS.filter(a => a[0] !== 'lia').map(([k, n, ic]) => `<button data-ir="${k}" ${aba === k ? 'aria-current="page"' : ''}>${ic}${n}</button>`).join('') +
    `<button class="falar" data-ir="lia" ${aba === 'lia' ? 'aria-current="page"' : ''}>${IC.mic}Falar com a Lia</button>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ir]'); if (!b) return;
  const destino = b.dataset.ir;
  // O botão do meio abre a conversa e já começa a ouvir.
  if (destino === 'lia' && b.classList.contains('fab')) { if (aba !== 'lia') irAba('lia'); if (CONEXAO) microfone(); return; }
  irAba(destino);
});

function irAba(a, s) {
  if (['dia','comida','graficos','metas'].includes(a)) { s = a; a = 'saude'; }
  aba = a; if (s) sub = s;
  window.scrollTo(0, 0);
  desenhar();
  if (!CONEXAO) return;
  if (a === 'hoje') { carregarHoje(); if (!G) carregarAgenda(); }
  if (a === 'agenda') carregarAgenda();
  if (a === 'saude') {
    if (!D && (sub === 'dia' || sub === 'comida')) carregarDia();
    if ((sub === 'graficos' || sub === 'metas') && !R) com(() => api('carregarRelatorio')).then(r => { R = r; calc = null; if (aba === 'saude') desenhar(); });
  }
  if (a === 'ajustes' && !H) carregarHoje();
  if (a === 'ajustes') com(() => api('carregarAjustes')).then(r => { A = prepararAjustes(r); if (aba === 'ajustes') desenhar(); });
  if (a === 'lia') rolarFim();
}
async function carregarHoje() { try { H = await rodar('carregarDia', hojeStr()); if (D && D.data === H.data) D = H; } catch (e) {} if (aba === 'hoje') desenhar(); }
async function carregarDia(data) { try { D = await rodar('carregarDia', data || ''); if (D.data === D.hoje) H = D; } catch (e) {} if (aba === 'saude') desenhar(); }
async function carregarAgenda() { try { G = await com(() => ponte('agenda', {inicio: hojeStr(), dias: 14})); } catch (e) { G = G || {erro: true}; } if (aba === 'agenda' || aba === 'hoje') desenhar(); }
function aposMudarDia(novo) { D = novo; if (D.data === D.hoje) H = D; R = null; desenhar(); }

function desenhar() {
  aplicarTema();
  desenharNav();
  $('#main').classList.toggle('conversa', aba === 'lia');
  $('#compositor').hidden = aba !== 'lia' || !CONEXAO;
  const v = $('#view');
  if (!CONEXAO && aba !== 'ajustes') { v.innerHTML = telaSemConexao(); return; }
  v.innerHTML = ({hoje: telaHoje, agenda: telaAgenda, lia: telaLia, saude: telaSaude, ajustes: telaAjustes})[aba]();
  if (aba === 'saude' && sub === 'graficos') ligarGrafico();
}
function telaSemConexao() {
  return `<div class="boasvindas">${avatar()}<h1>Oi! Eu sou a Lia.</h1><p>Para eu acessar sua agenda e seu diário, abra uma vez, neste aparelho, o link “Conectar a Lia” que chegou no seu e-mail.</p></div>`;
}
function saudacao() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
function cabecalho(pre, titulo, extra = '') {
  return `<div class="topo"><div class="ola">${avatar()}<div><small>${pre}</small><h1>${titulo}</h1></div></div>${extra}</div>`;
}
function dataLonga() { const x = new Date(); return `${SEMANA[x.getDay()]}, ${x.getDate()} de ${MESES[x.getMonth()]}`; }

/* ================= HOJE ================= */
function totaisDe(dia) { return dia.refeicoes.reduce((t, r) => ({kcal: t.kcal + num(r.calorias), prot: t.prot + num(r.proteina)}), {kcal: 0, prot: 0}); }
function telaHoje() {
  let h = cabecalho(dataLonga(), `${saudacao()}, Daia`);
  if (!H) return h + '<div class="card"><p class="vazio">Carregando seu dia…</p></div>';
  const c = H.config, t = totaisDe(H);
  const itAgua = H.checklist.find(i => i.tipo === 'agua');
  const ml = itAgua ? num(H.registros[itAgua.item]) : 0;
  const falta = [];
  if (t.prot < c.meta_proteina) falta.push(`faltam ${fmt(c.meta_proteina - t.prot)} g de proteína`);
  if (ml < c.meta_agua_ml) falta.push(`${fmt((c.meta_agua_ml - ml) / 1000, 1)} L de água`);
  const frase = falta.length ? `Hoje ${falta.join(' e ')}.` : 'Proteína e água em dia. Muito bem!';
  h += `<div class="fala">${avatar()}<p>${frase}${H.mounjaro.ehDia && !H.mounjaro.doDia ? ' Hoje é dia do Mounjaro.' : ''}</p></div>`;
  h += `<div class="card"><div class="cab"><h2>Seu dia</h2><button class="lnk" data-ir="dia">abrir</button></div><div class="aneis">
    ${anel(t.prot, c.meta_proteina, 'var(--accent)', fmt(t.prot) + ' g', `de ${fmt(c.meta_proteina)} g proteína`)}
    ${anel(ml, c.meta_agua_ml, 'var(--agua)', fmt(ml / 1000, 1) + ' L', `de ${fmt(c.meta_agua_ml / 1000, 1)} L água`)}
    ${anel(t.kcal, c.meta_calorias, 'var(--kcal)', fmt(t.kcal), `de ${fmt(c.meta_calorias)} kcal`)}</div></div>`;
  h += cardRelogio(H.atividade);
  const hoje = hojeStr();
  const evs = G && !G.erro ? G.eventos.filter(e => e.data === hoje) : [];
  const tars = G && !G.erro ? G.tarefas.filter(x => x.data && chave(x.data) <= chave(hoje)) : [];
  h += `<div class="grade-auto"><div class="card"><div class="cab"><h2>Agenda de hoje</h2><button class="lnk" data-ir="agenda">ver tudo</button></div>
    ${!G ? '<p class="vazio">Carregando…</p>' : (evs.length || tars.length) ? evs.map(e => `<div class="ev"><time>${e.hora || 'dia'}</time><div>${esc(e.titulo)}${e.local ? `<small>${esc(e.local)}</small>` : ''}</div></div>`).join('') + tars.map(x => `<div class="ev"><time>tarefa</time><div>${esc(x.titulo)}</div></div>`).join('') : '<p class="vazio">Nada marcado para hoje.</p>'}</div>`;
  const ativos = H.checklist.map((i, ix) => ({i, ix})).filter(o => o.i.ativo);
  const feitos = ativos.filter(o => statusItem(o.i, H.registros[o.i.item] || '', H.refeicoes.length, c) === 'ok').length;
  h += `<div class="card"><div class="cab"><h2>Checklist</h2><small>${feitos} de ${ativos.length}</small></div><div class="chips">
    ${ativos.map(o => { const ok = statusItem(o.i, H.registros[o.i.item] || '', H.refeicoes.length, c) === 'ok';
      return `<button class="chip ${ok ? 'feito' : ''}" data-rapido="${o.ix}">${ok ? IC.check : iconeItem(o.i)}${esc(o.i.item.replace(/ em jejum$/i, ''))}</button>`; }).join('')}</div>
    <p class="sub" style="margin:0">Toque para marcar. Peso, água, comida e treino abrem o dia.</p></div></div>`;
  return h;
}
const horasMin = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + String(m % 60).padStart(2, '0') : ''}` : `${m} min`;
function cardRelogio(at) {
  if (!at) return '';
  if (!at.tem && !at.ultimaSinc) return `<div class="card"><div class="cab"><h2>Relógio e celular</h2><button class="lnk" data-ir="ajustes">conectar</button></div><p class="sub" style="margin:0">Ligue o Samsung Health e o Garmin para os passos, o sono e os treinos chegarem sozinhos.</p></div>`;
  return `<div class="card"><div class="cab"><h2>Do relógio</h2><small>${at.ultimaSinc ? 'atualizado ' + esc(at.ultimaSinc.slice(11) || at.ultimaSinc) : ''}</small></div><div class="kpis">
    <div class="kpi"><small>Passos</small><b>${fmt(at.passos)}</b></div>
    <div class="kpi"><small>Sono</small><b>${at.sonoMin ? horasMin(at.sonoMin) : '—'}</b></div>
    <div class="kpi"><small>Calorias em movimento</small><b>${at.caloriasAtivas ? fmt(at.caloriasAtivas) : '—'}</b></div></div>
    ${at.treinos.length ? `<div class="chips">${at.treinos.map(t => `<span class="chip feito">${IC.treino}${esc(t.nome)} · ${t.inicio} · ${horasMin(t.minutos)}</span>`).join('')}</div>` : ''}</div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-rapido]'); if (!b || !H) return;
  const i = H.checklist[+b.dataset.rapido];
  if (i.tipo !== 'sim') { D = H; irAba('dia'); return; }
  const novo = H.registros[i.item] === 'Sim' ? '' : 'Sim';
  H.registros[i.item] = novo; desenhar();
  try { H = await rodar('salvarRegistro', H.data, i.item, novo); if (D && D.data === H.data) D = H; R = null; } catch (er) {}
  desenhar();
});

/* ================= CONVERSA ================= */
let esperando = false;
function textoFormatado(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\n)\s*[-•]\s+/g, '$1• ').replace(/\n/g, '<br>'); }
function telaLia() {
  let h = '';
  if (!CHAT.length) h += `<div class="boasvindas">${avatar()}<h1>Oi, Daia!</h1><p>Toque no microfone e fale, ou escreva. Eu marco na agenda, anoto tarefas, calculo a comida e acompanho sua saúde.</p></div>
    <div class="dicas">${DICAS.map(d => `<button class="chip" data-dica="${esc(d)}">${esc(d)}</button>`).join('')}</div>`;
  else h += `<div class="topo"><div class="ola">${avatar()}<div><small>Conversa</small><h1>Lia</h1></div></div><button class="lnk" id="btLimpar">limpar</button></div>`;
  h += '<div class="msgs">' + CHAT.map((m, i) => balao(m, i)).join('') + (esperando ? `<div class="lia-linha">${avatar()}<div class="msg lia pensando">pensando…</div></div>` : '') + '</div>';
  return h;
}
function balao(m, i) {
  if (m.de === 'eu') return `<div class="msg eu">${textoFormatado(m.texto)}</div>`;
  const acoes = (m.acoes || []).map((a, k) => cartaoAcao(a, i, k)).join('');
  const fontes = m.fontes && m.fontes.length ? `<span>Fontes: ${esc([...new Set(m.fontes)].join(', '))}</span>` : '';
  return `<div class="lia-linha">${avatar()}<div class="msg lia">${textoFormatado(m.texto)}${acoes}<div class="rodape"><button data-ouvir="${i}">${IC.ouvir}ouvir</button>${fontes}</div></div></div>`;
}
function cartaoAcao(a, i, k) {
  const d = a.dados || {};
  let ic = IC.item, tit = '', corpo = '';
  if (a.tipo === 'evento') {
    ic = IC.agenda; tit = esc(d.titulo);
    const fim = d.hora_inicio ? (() => { const [hh, mm] = d.hora_inicio.split(':').map(Number); const t = hh * 60 + mm + (Number(d.duracao_min) || 60); return String(Math.floor(t / 60) % 24).padStart(2,'0') + ':' + String(t % 60).padStart(2,'0'); })() : '';
    corpo = `${esc(diaComData(d.data))} · ${d.hora_inicio ? esc(d.hora_inicio) + ' às ' + fim : 'dia inteiro'}${d.local ? ' · ' + esc(d.local) : ''}${d.hora_inicio ? `<br><span class="sub">aviso ${(d.aviso_min ?? 30) == 0 ? 'na hora' : (d.aviso_min ?? 30) + ' min antes'}</span>` : ''}`;
  } else if (a.tipo === 'tarefa') {
    ic = IC.check; tit = esc(d.titulo);
    corpo = d.data ? 'Para ' + esc(diaComData(d.data)) : 'Sem data';
    if (d.observacao) corpo += `<span class="sub">${esc(d.observacao)}</span>`;
  } else if (a.tipo === 'saude') {
    ic = d.agua_ml ? IC.gota : IC.saude; tit = 'Registrar' + (d.data && d.data !== hojeStr() ? ' em ' + esc(d.data) : '');
    corpo = [d.agua_ml && `+ ${fmt(d.agua_ml)} ml de hidratação`, d.item && `${esc(d.item)}: <b>${esc(d.valor)}</b>`].filter(Boolean).join('<br>');
  } else if (a.tipo === 'refeicao') {
    ic = IC.prato; const it = d.itens || [];
    const tk = it.reduce((t, x) => ({k: t.k + num(x.calorias), p: t.p + num(x.proteina)}), {k: 0, p: 0});
    tit = 'Registrar refeição' + (d.data && d.data !== hojeStr() ? ' em ' + esc(d.data) : '');
    corpo = `<div class="tab-wrap"><table>${it.map((x, j) => `<tr><td>${esc(x.alimento)}${x.quantidade ? ` <span class="sub">${esc(x.quantidade)}</span>` : ''}</td><td class="n">${fmt(x.calorias)} kcal</td><td class="n">${fmt(x.proteina, 1)} g</td>${a.estado ? '' : `<td class="n"><button class="x" data-tirar="${i},${k},${j}" aria-label="Tirar">${IC.x}</button></td>`}</tr>`).join('')}
      <tr class="total"><td>Total</td><td class="n">${fmt(tk.k)} kcal</td><td class="n">${fmt(tk.p, 1)} g</td>${a.estado ? '' : '<td></td>'}</tr></table></div>`;
  } else if (a.tipo === 'mounjaro') {
    ic = IC.seringa; tit = 'Aplicação do Mounjaro';
    corpo = [d.data || 'Hoje', d.dose && 'dose ' + esc(d.dose), d.local && esc(d.local), d.observacao && esc(d.observacao)].filter(Boolean).join(' · ');
  }
  let bts;
  if (a.estado === 'feito') bts = `<span class="sub" style="color:var(--ok)">${esc(a.resultado || 'Salvo')}</span>`;
  else if (a.estado === 'cancelado') bts = '<span class="sub">Cancelado</span>';
  else bts = `<div class="linha-bt"><button class="bt pri peq" data-confirmar="${i},${k}">${IC.check}Confirmar</button>${['evento','tarefa'].includes(a.tipo) ? `<button class="bt peq" data-editar="${i},${k}">Editar</button>` : ''}<button class="bt peq" data-cancelar="${i},${k}">Cancelar</button></div>`;
  return `<div class="acao ${a.estado || ''}"><div class="tit">${ic}${tit}</div><div>${corpo}</div>${bts}</div>`;
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-dica],[data-ouvir],[data-confirmar],[data-cancelar],[data-editar],[data-tirar],#btLimpar'); if (!t) return;
  if (t.id === 'btLimpar') { limparConversa(); return; }
  if (t.dataset.dica) { enviar(t.dataset.dica, false); return; }
  if (t.dataset.ouvir) { falar(CHAT[+t.dataset.ouvir].texto, true); return; }
  const [i, k, j] = (t.dataset.confirmar || t.dataset.cancelar || t.dataset.editar || t.dataset.tirar).split(',').map(Number);
  const a = CHAT[i].acoes[k];
  if (t.dataset.cancelar) { a.estado = 'cancelado'; salvarChat(); desenhar(); return; }
  if (t.dataset.tirar) { a.dados.itens.splice(j, 1); salvarChat(); desenhar(); return; }
  if (t.dataset.editar) { editarAcao(i, k); return; }
  try {
    const r = await com(() => ponte('executar', {tipo: a.tipo, dados: a.dados}));
    a.estado = 'feito'; a.resultado = r.texto; salvarChat();
    if (['saude','refeicao','mounjaro'].includes(a.tipo)) { H = null; D = null; R = null; carregarHoje(); }
    if (['evento','tarefa'].includes(a.tipo)) G = null;
    desenhar(); aviso(r.texto);
  } catch (er) {}
});
function editarAcao(i, k) {
  const d = CHAT[i].acoes[k].dados, ev = CHAT[i].acoes[k].tipo === 'evento';
  abrirModal(`<h3>${ev ? 'Editar compromisso' : 'Editar tarefa'}</h3>
    <div class="campo"><label for="eTit">Título</label><input id="eTit" value="${esc(d.titulo)}"></div>
    <div class="grade2"><div class="campo"><label for="eData">Data (dd/mm/aaaa)</label><input id="eData" value="${esc(d.data || '')}"></div>
    ${ev ? `<div class="campo"><label for="eHora">Hora (vazio = dia inteiro)</label><input id="eHora" type="time" value="${esc(d.hora_inicio || '')}"></div>` : ''}</div>
    ${ev ? `<div class="grade2"><div class="campo"><label for="eDur">Duração (min)</label><input id="eDur" inputmode="numeric" value="${esc(d.duracao_min || 60)}"></div>
      <div class="campo"><label for="eAviso">Avisar (min antes)</label><input id="eAviso" inputmode="numeric" value="${esc(d.aviso_min ?? 30)}"></div></div>
      <div class="campo"><label for="eLocal">Local</label><input id="eLocal" value="${esc(d.local || '')}"></div>` :
      `<div class="campo"><label for="eObs">Observação</label><input id="eObs" value="${esc(d.observacao || '')}"></div>`}
    <button class="bt pri cheio" id="btEdicao">Pronto</button>`);
  $('#btEdicao').onclick = () => {
    const data = $('#eData').value.trim();
    if (data && !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) { aviso('Data no formato dd/mm/aaaa', true); return; }
    d.titulo = $('#eTit').value.trim() || d.titulo; d.data = data;
    if (ev) { d.hora_inicio = $('#eHora').value; d.duracao_min = num($('#eDur').value) || 60; d.aviso_min = num($('#eAviso').value); d.local = $('#eLocal').value.trim(); }
    else d.observacao = $('#eObs').value.trim();
    salvarChat(); fecharModal(); desenhar();
  };
}
function rolarFim() { setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 40); }
function autoAltura(t) { t.style.height = 'auto'; t.style.height = Math.min(120, t.scrollHeight) + 'px'; }
$('#entrada').addEventListener('input', e => autoAltura(e.target));
$('#entrada').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !ehCelular()) { e.preventDefault(); enviarDigitado(); } });
$('#btEnviar').addEventListener('click', enviarDigitado);
$('#btMic').addEventListener('click', microfone);
function enviarDigitado() { const t = $('#entrada').value.trim(); if (!t) return; $('#entrada').value = ''; autoAltura($('#entrada')); enviar(t, false); }
async function enviar(texto, porVoz) {
  if (esperando) return;
  if (aba !== 'lia') irAba('lia');
  const historico = CHAT.slice(-12).map(m => ({de: m.de, texto: m.texto}));
  CHAT.push({de: 'eu', texto, hora: Date.now()}); salvarChat();
  esperando = true; desenhar(); rolarFim();
  try {
    const r = await ponte('conversar', {mensagem: texto, historico});
    CHAT.push({de: 'lia', texto: r.texto, acoes: r.acoes || [], fontes: r.fontes || [], hora: Date.now()});
    salvarChat();
    if (PREF.falar === 'sempre' || (PREF.falar === 'microfone' && porVoz)) falar(r.texto);
  } catch (e) {
    CHAT.push({de: 'lia', texto: (e && e.message) || String(e), hora: Date.now()});
  } finally { esperando = false; desenhar(); rolarFim(); }
}
function limparConversa() {
  abrirModal(`<h3>Apagar a conversa deste aparelho?</h3><p class="sub">Só some daqui. O que já foi salvo na agenda e no diário continua.</p>
    <div class="grade2"><button class="bt cheio" id="mNao">Cancelar</button><button class="bt pri cheio" id="mSim">Apagar</button></div>`);
  $('#mNao').onclick = fecharModal; $('#mSim').onclick = () => { CHAT = []; salvarChat(); fecharModal(); desenhar(); };
}

/* ---------- voz ---------- */
const Reconhecedor = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, ouvindo = false;
function marcarMic() { $('#btMic').innerHTML = ouvindo ? IC.parar : IC.mic; $('#btMic').classList.toggle('ouvindo', ouvindo); desenharNav(); }
function microfone() {
  if (!Reconhecedor) { aviso('Este navegador não entende voz. Use o Google Chrome.', true); return; }
  if (aba !== 'lia') irAba('lia');
  if (ouvindo) { rec.stop(); return; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  rec = new Reconhecedor(); rec.lang = 'pt-BR'; rec.interimResults = true; rec.continuous = false;
  let final = '';
  rec.onresult = e => { let t = ''; for (let n = 0; n < e.results.length; n++) t += e.results[n][0].transcript; final = t; $('#entrada').value = t; autoAltura($('#entrada')); };
  rec.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') aviso('Libere o microfone: toque no cadeado ao lado do endereço > Microfone > Permitir.', true);
    else if (e.error === 'network') aviso('A voz precisa de internet.', true);
    else if (e.error !== 'no-speech' && e.error !== 'aborted') aviso('Não consegui ouvir (' + e.error + ').', true);
  };
  rec.onend = () => { ouvindo = false; marcarMic(); if (final.trim()) { $('#entrada').value = ''; autoAltura($('#entrada')); enviar(final.trim(), true); } };
  try { rec.start(); ouvindo = true; marcarMic(); } catch (e) { aviso('Não consegui ligar o microfone.', true); }
}
const vozes = () => 'speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => /^pt/i.test(v.lang)) : [];
function falar(texto, forcar) {
  if (!('speechSynthesis' in window)) { if (forcar) aviso('Este navegador não fala.', true); return; }
  if (!forcar && PREF.falar === 'nunca') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(texto).replace(/\*\*/g, '').replace(/[#*_`>]/g, '').replace(/https?:\/\/\S+/g, 'o link').replace(/\s+/g, ' ').trim());
  u.lang = 'pt-BR'; u.rate = PREF.velocidade || 1.05;
  const v = vozes().find(x => x.name === PREF.voz) || vozes().find(x => /pt-BR/i.test(x.lang)); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { if (aba === 'ajustes') desenhar(); };

/* ================= AGENDA ================= */
function telaAgenda() {
  let h = cabecalho('Próximos 14 dias', 'Agenda', `<div class="linha-bt"><button class="bt pri peq" id="btNovoEv">${IC.mais}Compromisso</button><button class="bt peq" id="btNovaTar">${IC.mais}Tarefa</button><button class="bt peq" id="btAtualAg" aria-label="Atualizar">${IC.atualizar}</button></div>`);
  if (!G) return h + '<div class="card"><p class="vazio">Carregando…</p></div>';
  if (G.erro) return h + '<div class="card"><p class="vazio">Não consegui abrir a agenda agora.</p></div>';
  const porDia = {}; G.eventos.forEach(e => (porDia[e.data] = porDia[e.data] || []).push(e));
  const dias = Object.keys(porDia).sort((a, b) => chave(a) < chave(b) ? -1 : 1);
  h += `<div class="grade-auto"><div class="card"><h2>Compromissos</h2>${dias.length ? dias.map(d => `<div class="dia-ag">${esc(nomeDia(d))}</div>` +
      porDia[d].map(e => `<div class="ev"><time>${e.hora ? esc(e.hora) : 'dia'}</time><div>${esc(e.titulo)}<small>${e.hora ? esc(e.hora) + ' às ' + esc(e.fim) : 'dia inteiro'}${e.local ? ' · ' + esc(e.local) : ''}</small></div></div>`).join('')).join('')
    : '<p class="vazio">Nenhum compromisso. Fale com a Lia para marcar.</p>'}</div>`;
  h += `<div class="card"><h2>Tarefas</h2>${G.tarefas.length ? G.tarefas.map(t => `<div class="tarefa"><button class="caixa" data-concluir="${esc(t.id)}" aria-label="Concluir ${esc(t.titulo)}"></button>
      <div>${esc(t.titulo)}${t.data ? `<div class="sub">${esc(nomeDia(t.data))}</div>` : ''}${t.obs ? `<div class="sub">${esc(t.obs)}</div>` : ''}</div></div>`).join('')
    : '<p class="vazio">Nenhuma tarefa aberta.</p>'}<p class="sub" style="margin:0">Toque no quadradinho para concluir. Elas aparecem também no Google Tarefas.</p></div></div>`;
  return h;
}
document.addEventListener('click', async e => {
  const t = e.target.closest('#btNovoEv,#btNovaTar,#btAtualAg,[data-concluir]'); if (!t) return;
  if (t.id === 'btAtualAg') { G = null; desenhar(); carregarAgenda(); return; }
  if (t.dataset.concluir) { try { G = await com(() => ponte('concluirTarefa', {id: t.dataset.concluir})); desenhar(); aviso('Tarefa concluída'); } catch (er) {} return; }
  const ev = t.id === 'btNovoEv';
  abrirModal(ev ? `<h3>Novo compromisso</h3>
    <div class="campo"><label for="nTit">Título</label><input id="nTit" placeholder="Ex.: Dentista"></div>
    <div class="grade2"><div class="campo"><label for="nData">Data</label><input id="nData" type="date"></div><div class="campo"><label for="nHora">Hora (vazio = dia todo)</label><input id="nHora" type="time"></div></div>
    <div class="grade2"><div class="campo"><label for="nDur">Duração (min)</label><input id="nDur" inputmode="numeric" value="60"></div><div class="campo"><label for="nAviso">Avisar (min antes)</label><input id="nAviso" inputmode="numeric" value="30"></div></div>
    <div class="campo"><label for="nLocal">Local</label><input id="nLocal"></div><button class="bt pri cheio" id="btSalvarNovo">Salvar na agenda</button>`
    : `<h3>Nova tarefa</h3><div class="campo"><label for="nTit">O que fazer</label><input id="nTit" placeholder="Ex.: Pagar a conta de luz"></div>
    <div class="campo"><label for="nData">Data (opcional)</label><input id="nData" type="date"></div>
    <div class="campo"><label for="nObs">Observação</label><input id="nObs"></div><button class="bt pri cheio" id="btSalvarNovo">Salvar tarefa</button>`);
  $('#btSalvarNovo').onclick = async () => {
    const tit = $('#nTit').value.trim(), iso = $('#nData').value;
    if (!tit) { aviso('Escreva o título', true); return; }
    if (ev && !iso) { aviso('Escolha a data', true); return; }
    const data = iso ? iso.split('-').reverse().join('/') : '';
    const dados = ev ? {titulo: tit, data, hora_inicio: $('#nHora').value, duracao_min: num($('#nDur').value) || 60, aviso_min: num($('#nAviso').value), local: $('#nLocal').value.trim()}
      : {titulo: tit, data, observacao: $('#nObs').value.trim()};
    fecharModal();
    try { const r = await com(() => ponte('executar', {tipo: ev ? 'evento' : 'tarefa', dados})); aviso(r.texto); carregarAgenda(); } catch (er) {}
  };
});

/* ================= SAÚDE ================= */
function telaSaude() {
  const nav = (sub === 'dia' || sub === 'comida') && D ? (() => { const x = dt(D.data), ehHoje = D.data === D.hoje;
    return `<div class="dianav"><button data-mudardia="-1" aria-label="Dia anterior">${IC.esq}</button><span ${ehHoje ? '' : 'data-voltarhoje="1" style="cursor:pointer"'}>${SEM[x.getDay()]}, ${curta(D.data)}<small>${ehHoje ? 'hoje' : 'voltar para hoje'}</small></span><button data-mudardia="1" ${ehHoje ? 'disabled' : ''} aria-label="Próximo dia">${IC.dir}</button></div>`; })() : '';
  const seg = `<div class="seg">${[['dia','Dia'],['comida','Comida'],['graficos','Gráficos'],['metas','Metas']].map(([k, n]) => `<button data-ir="${k}" aria-pressed="${sub === k}">${n}</button>`).join('')}</div>`;
  return cabecalho('Saúde', {dia:'Meu dia', comida:'Comida', graficos:'Gráficos', metas:'Minhas metas'}[sub], nav) + seg + ({dia: telaDia, comida: telaComida, graficos: telaGraficos, metas: telaMetas})[sub]();
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-mudardia],[data-voltarhoje]'); if (!t || !D) return;
  if (t.dataset.voltarhoje) { aposMudarDia(await rodar('carregarDia', D.hoje)); return; }
  const x = dt(D.data); x.setDate(x.getDate() + Number(t.dataset.mudardia));
  const nova = ds(x); if (chave(nova) > chave(D.hoje)) return;
  sug = []; foto = null;
  try { D = await rodar('carregarDia', nova); desenhar(); } catch (er) {}
});
function statusItem(i, v, nRef, cfg) {
  if (i.tipo === 'agua') { const ml = num(v); return ml >= cfg.meta_agua_ml ? 'ok' : (ml > 0 ? 'parcial' : 'pend'); }
  if (i.tipo === 'refeicoes') return nRef > 0 ? 'ok' : 'pend';
  if (!v) return 'pend';
  if (i.tipo === 'sim') return v === 'Sim' ? 'ok' : 'nao';
  if (i.tipo === 'texto') return /^n[ãa]o\b/i.test(v) ? 'nao' : 'ok';
  return 'ok';
}

/* ---------- Dia ---------- */
function telaDia() {
  if (!D) return '<div class="card"><p class="vazio">Carregando…</p></div>';
  const c = D.config, t = totaisDe(D);
  const itAgua = D.checklist.find(i => i.tipo === 'agua');
  const ml = itAgua ? num(D.registros[itAgua.item]) : 0;
  let h = '';
  if (D.situacao) h += `<div class="faixa"><span>${D.situacao === 'Livre' ? 'Dia livre' : esc(D.situacao)}${D.obsDia ? ' · ' + esc(D.obsDia) : ''}</span><button class="lnk" data-situacao="">desfazer</button></div>`;
  h += cardMounjaroDia();
  h += `<div class="card">${barraMeta('Proteína', t.prot, c.meta_proteina, 'g', 'var(--accent)')}${barraMeta('Calorias', t.kcal, c.meta_calorias, 'kcal', 'var(--kcal)', 'kcal')}${itAgua && itAgua.ativo ? barraMeta('Hidratação', ml, c.meta_agua_ml, 'ml', 'var(--agua)') : ''}</div>`;
  const ativos = D.checklist.map((i, ix) => ({i, ix})).filter(o => o.i.ativo);
  h += `<div class="card">${ativos.map(o => linhaItem(o.i, o.ix, t)).join('') || '<p class="vazio">Nenhum item na lista. Inclua em Ajustes.</p>'}</div>`;
  if (!D.situacao) h += `<div class="linha-bt" style="justify-content:center"><button class="lnk" data-situacao="Livre">Marcar como dia livre</button><span class="sub">ou</span><button class="lnk" data-situacao="Sem registro">dia sem registro de comida</button></div>`;
  return h;
}
function linhaItem(i, ix, t) {
  const v = D.registros[i.item] || '';
  const st = statusItem(i, v, D.refeicoes.length, D.config);
  let ctl = '';
  if (i.tipo === 'sim') ctl = `<button class="bt peq ${v === 'Sim' ? 'ok' : ''}" data-marcar="${ix}" data-valor="Sim">Sim</button><button class="bt peq ${v === 'Não' ? 'pri' : ''}" data-marcar="${ix}" data-valor="Não">Não</button>`;
  else if (i.tipo === 'peso') ctl = v ? `<span class="valor">${fmt(num(v), 2)} kg</span><button class="lnk" data-peso="${ix}">alterar</button>` : `<button class="bt pri peq" data-peso="${ix}">Registrar peso</button>`;
  else if (i.tipo === 'agua') ctl = `<span class="valor">${fmt(num(v))} ml</span><button class="bt peq" id="btCanecas">${IC.mais}canecas de chá</button><button class="bt peq" data-agua="${D.config.copo_agua_ml}">${IC.mais}${fmt(D.config.copo_agua_ml)} ml</button><button class="bt peq" id="btAguaOutro">outro</button>`;
  else if (i.tipo === 'refeicoes') ctl = `<span class="sub">${D.refeicoes.length ? `${fmt(t.kcal)} kcal · ${fmt(t.prot, 1)} g de proteína` : 'nada registrado'}</span><button class="bt pri peq" data-ir="comida">${IC.mais}Comida</button>`;
  else {
    const ops = String(i.opcoes || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
    if (v && !ops.includes(v)) ops.push(v);
    ctl = ops.map(o => `<button class="chip ${v === o ? 'on' : ''}" data-marcar="${ix}" data-valor="${esc(o)}">${esc(o)}</button>`).join('') + `<button class="chip" data-texto="${ix}">outro…</button>`;
  }
  return `<div class="item"><div class="nome"><span class="ico">${iconeItem(i)}</span><span>${esc(i.item)}</span><span class="st ${st === 'ok' ? 'ok' : ''}">${st === 'ok' ? IC.check : ''}</span></div><div class="ctl">${ctl}</div></div>`;
}
async function salvarDia(promessa) { try { const novo = await promessa; D = novo; if (D.data === D.hoje) H = D; R = null; } catch (e) {} desenhar(); }
document.addEventListener('click', e => {
  const t = e.target.closest('[data-marcar],[data-peso],[data-agua],#btCanecas,#btAguaOutro,[data-texto],[data-situacao]'); if (!t || !D) return;
  if (t.dataset.marcar !== undefined) {
    const i = D.checklist[+t.dataset.marcar], valor = t.dataset.valor, novo = (D.registros[i.item] || '') === valor ? '' : valor;
    D.registros[i.item] = novo; desenhar(); salvarDia(rodar('salvarRegistro', D.data, i.item, novo)); return;
  }
  if (t.dataset.situacao !== undefined) { const s = t.dataset.situacao; salvarDia(rodar('definirSituacao', D.data, s, s === 'Sem registro' ? 'Alimentação não registrada' : '')); return; }
  if (t.dataset.agua) { somarAgua(num(t.dataset.agua)); return; }
  if (t.id === 'btCanecas') {
    const ml = D.config.caneca_cha_ml;
    abrirModal(`<h3>Quantas canecas de chá?</h3><p class="sub" style="margin:0">Cada caneca conta como ${fmt(ml)} ml.</p>
      <div class="chips">${[1, 2, 3, 4, 5].map(n => `<button class="chip" data-canecas="${n}">${n} = ${fmt(n * ml)} ml</button>`).join('')}</div>
      <div class="grade2"><input id="mCanecas" inputmode="numeric" placeholder="Outro número" aria-label="Outro número de canecas"><button class="bt pri" data-canecas="campo">Somar</button></div>`);
    return;
  }
  if (t.id === 'btAguaOutro') {
    abrirModal(`<h3>Hidratação</h3><div class="campo"><label for="mAgua">Quantos ml?</label><input id="mAgua" inputmode="numeric" placeholder="Ex.: 500"></div>
      <div class="grade2"><button class="bt cheio" data-aguasinal="-1">Tirar</button><button class="bt pri cheio" data-aguasinal="1">Somar</button></div>`);
    return;
  }
  if (t.dataset.peso !== undefined) {
    const ix = +t.dataset.peso, v = D.registros[D.checklist[ix].item] || '';
    abrirModal(`<h3>Peso de ${curta(D.data)}</h3><div class="campo"><label for="mPeso">Peso em kg</label><input id="mPeso" inputmode="decimal" placeholder="Ex.: 55,2" value="${esc(v ? fmt(num(v), 2) : '')}"></div>
      <div class="grade2">${v ? `<button class="bt cheio" data-salvarpeso="${ix}" data-apagar="1">Apagar</button>` : '<span></span>'}<button class="bt pri cheio" data-salvarpeso="${ix}">Salvar</button></div>`);
    return;
  }
  if (t.dataset.texto !== undefined) {
    const i = D.checklist[+t.dataset.texto];
    abrirModal(`<h3>${esc(i.item)}</h3><div class="campo"><label for="mTexto">Escreva</label><input id="mTexto" value="${esc(D.registros[i.item] || '')}"></div><button class="bt pri cheio" data-salvartexto="${t.dataset.texto}">Salvar</button>`);
  }
});
document.addEventListener('click', e => {
  const t = e.target.closest('[data-canecas],[data-aguasinal],[data-salvarpeso],[data-salvartexto]'); if (!t || !D) return;
  if (t.dataset.canecas) { const n = t.dataset.canecas === 'campo' ? num($('#mCanecas').value) : +t.dataset.canecas; if (!n) return; fecharModal(); somarAgua(n * D.config.caneca_cha_ml); return; }
  if (t.dataset.aguasinal) { const ml = num($('#mAgua').value); if (!ml) return; fecharModal(); somarAgua(+t.dataset.aguasinal * ml); return; }
  if (t.dataset.salvarpeso) {
    const apagar = !!t.dataset.apagar, v = apagar ? '' : num($('#mPeso').value);
    if (!apagar && (v < 20 || v > 300)) { aviso('Digite o peso em kg, ex.: 55,2', true); return; }
    fecharModal(); salvarDia(rodar('salvarRegistro', D.data, D.checklist[+t.dataset.salvarpeso].item, v ? String(v).replace('.', ',') : ''));
    return;
  }
  if (t.dataset.salvartexto) { const v = $('#mTexto').value.trim(); fecharModal(); salvarDia(rodar('salvarRegistro', D.data, D.checklist[+t.dataset.salvartexto].item, v)); }
});
async function somarAgua(ml) { await salvarDia(rodar('somarAgua', D.data, ml)); aviso(`${ml > 0 ? '+' : ''}${fmt(ml)} ml`); }

/* ---------- Mounjaro ---------- */
const proximoLocal = u => !u ? LOCAIS[0] : LOCAIS[(LOCAIS.indexOf(u.local) + 1) % LOCAIS.length];
function cardMounjaroDia() {
  const m = D.mounjaro;
  if (m.doDia) return `<div class="faixa"><span>Mounjaro aplicado${m.doDia.dose ? ' · ' + esc(m.doDia.dose) : ''}${m.doDia.local ? ' · ' + esc(m.doDia.local) : ''}</span></div>`;
  if (!m.ehDia) return '';
  return `<div class="card"><div class="cab"><h2>Hoje é dia do Mounjaro</h2></div>${m.ultima ? `<p class="sub" style="margin:0">Última: ${curta(m.ultima.data)} · ${esc(m.ultima.local || 'local não informado')}</p>` : ''}<button class="bt pri cheio" data-mounjaro="1">Registrar aplicação</button></div>`;
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-mounjaro],#btSalvarMj,[data-apagarmj]'); if (!t) return;
  if (t.dataset.apagarmj) {
    const [linha, data] = t.dataset.apagarmj.split('|');
    abrirModal(`<h3>Apagar a aplicação de ${curta(data)}?</h3><div class="grade2"><button class="bt cheio" id="mNao">Cancelar</button><button class="bt pri cheio" id="mSim">Apagar</button></div>`);
    $('#mNao').onclick = fecharModal;
    $('#mSim').onclick = async () => { fecharModal(); try { R = await rodar('removerMounjaro', +linha, data); desenhar(); } catch (er) {} };
    return;
  }
  if (t.dataset.mounjaro) {
    const ultima = D ? D.mounjaro.ultima : (R && R.mounjaro.length ? R.mounjaro[R.mounjaro.length - 1] : null);
    const cfg = D ? D.config : R.config, sugerido = proximoLocal(ultima);
    abrirModal(`<h3>Aplicação do Mounjaro</h3>
      <div class="grade2"><div class="campo"><label for="mjData">Data</label><input id="mjData" value="${esc(D ? D.data : R.hoje)}"></div><div class="campo"><label for="mjDose">Dose</label><input id="mjDose" placeholder="Ex.: 5 mg" value="${esc(cfg.mounjaro_dose || '')}"></div></div>
      <div class="campo"><label for="mjLocal">Local ${ultima ? `(última: ${esc(ultima.local || '—')})` : ''}</label><select id="mjLocal">${LOCAIS.map(l => `<option ${l === sugerido ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="campo"><label for="mjObs">Observação (sintomas etc.)</label><input id="mjObs" placeholder="Opcional"></div><button class="bt pri cheio" id="btSalvarMj">Salvar</button>`);
    return;
  }
  const data = $('#mjData').value.trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) { aviso('Data no formato dd/mm/aaaa', true); return; }
  const args = [data, $('#mjDose').value.trim(), $('#mjLocal').value, $('#mjObs').value.trim()];
  fecharModal();
  try { const d = await rodar('registrarMounjaro', ...args); if (D && d.data === D.data) D = d; H = null; R = null; aviso('Aplicação registrada'); irAba(aba === 'saude' ? sub : aba); } catch (er) {}
});

/* ---------- Comida ---------- */
function telaComida() {
  if (!D) return '<div class="card"><p class="vazio">Carregando…</p></div>';
  const t = totaisDe(D), c = D.config;
  let h = `<div class="fala">${avatar()}<p>Você também pode me falar o que comeu, até receitas. Eu procuro na Tabela TACO e nos rótulos e faço a conta. <button class="lnk" data-ir="lia">falar com a Lia</button></p></div>
    <div class="card"><h2>Registrar comida</h2>
    <textarea id="txtComida" rows="3" placeholder="Ex.: 100 g de arroz, 110 g de feijão, 1 filé de frango">${esc(window._txtComida || '')}</textarea>
    <div class="linha-bt"><label class="bt peq" for="arqFoto">${IC.camera}Foto</label><input type="file" id="arqFoto" accept="image/*" hidden>
      <button class="bt pri peq" id="btCalcular" ${D.temIA ? '' : 'disabled'}>Calcular</button><button class="bt peq" id="btManual">Digitar valores</button></div>
    ${foto ? `<div class="linha-bt"><img src="data:image/jpeg;base64,${foto}" alt="Foto da refeição" style="max-width:120px;border-radius:14px"><button class="lnk" id="btTirarFoto">tirar foto</button></div>` : ''}
    ${D.temIA ? '' : '<p class="sub" style="margin:0">Para calcular sozinha, coloque a chave da IA em Ajustes.</p>'}</div>`;
  if (sug.length) h += cardSugestoes();
  h += `<div class="card"><h2>Meus alimentos</h2><input id="busca" placeholder="Procurar…" value="${esc(filtro)}" aria-label="Procurar alimento"><div class="chips" id="chipsAlim" style="max-height:240px;overflow:auto">${chipsAlimentos()}</div><p class="sub" style="margin:0">Toque para somar 1 porção no dia.</p></div>`;
  h += `<div class="card"><div class="cab"><h2>Comida de ${curta(D.data)}</h2><small>${fmt(t.kcal)} kcal · ${fmt(t.prot, 1)} g</small></div>`;
  if (!D.refeicoes.length) h += '<p class="vazio">Nada registrado ainda.</p>';
  else h += `<div class="tab-wrap"><table><tr><th>Alimento</th><th class="n">kcal</th><th class="n">Prot.</th><th></th></tr>
    ${D.refeicoes.map(r => `<tr><td>${esc(r.alimento)}${r.quantidade ? ` <span class="sub">${esc(r.quantidade)}</span>` : ''}</td><td class="n">${fmt(r.calorias)}</td><td class="n">${fmt(r.proteina, 1)} g</td><td class="n"><button class="x" data-tirarref="${r.linha}" aria-label="Remover">${IC.x}</button></td></tr>`).join('')}
    <tr class="total"><td>Total</td><td class="n">${fmt(t.kcal)}</td><td class="n">${fmt(t.prot, 1)} g</td><td></td></tr></table></div>
    <p class="sub" style="margin:0">Proteína: faltam ${fmt(Math.max(0, c.meta_proteina - t.prot), 1)} g para ${fmt(c.meta_proteina)} g · Calorias: ${fmt(t.kcal)} de ${fmt(c.meta_calorias)}</p>`;
  return h + '</div>';
}
function chipsAlimentos() {
  const tira = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const f = tira(filtro.trim());
  const lista = D.alimentos.filter(a => !f || tira(a.alimento).includes(f));
  if (!lista.length) return '<span class="sub">Nenhum alimento encontrado. Use “Digitar valores” e marque “salvar em Meus alimentos”.</span>';
  return lista.map(a => `<button class="chip" data-alim="${a.linha}" style="flex-direction:column;align-items:flex-start;border-radius:14px">${esc(a.alimento)}<small style="font-weight:600;opacity:.8">${esc(a.quantidade)} · ${fmt(a.calorias)} kcal · ${fmt(a.proteina, 1)} g</small></button>`).join('');
}
document.addEventListener('input', e => { if (e.target.id === 'busca') { filtro = e.target.value; $('#chipsAlim').innerHTML = chipsAlimentos(); } });
document.addEventListener('change', e => { if (e.target.id === 'arqFoto') escolherFoto(e.target); });
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-alim],[data-tirarref],#btCalcular,#btManual,#btTirarFoto,#btSalvarManual,#btSalvarSug,#btDescartarSug'); if (!t || !D) return;
  if (t.dataset.alim) { const a = D.alimentos.find(x => x.linha === +t.dataset.alim); await salvarDia(rodar('adicionarRefeicoes', D.data, [{alimento: a.alimento, quantidade: a.quantidade, calorias: a.calorias, proteina: a.proteina}], false)); aviso('+ ' + a.alimento); return; }
  if (t.dataset.tirarref) { salvarDia(rodar('removerRefeicao', D.data, +t.dataset.tirarref)); return; }
  if (t.id === 'btTirarFoto') { foto = null; desenhar(); return; }
  if (t.id === 'btDescartarSug') { sug = []; desenhar(); return; }
  if (t.id === 'btManual') {
    abrirModal(`<h3>Digitar valores</h3><div class="campo"><label for="mmNome">Alimento</label><input id="mmNome" placeholder="Ex.: Iogurte grego"></div>
      <div class="campo"><label for="mmQtd">Quantidade</label><input id="mmQtd" placeholder="Ex.: 90 g"></div>
      <div class="grade2"><div class="campo"><label for="mmKcal">Calorias (kcal)</label><input id="mmKcal" inputmode="decimal"></div><div class="campo"><label for="mmProt">Proteína (g)</label><input id="mmProt" inputmode="decimal"></div></div>
      <label class="troca"><span>Salvar em Meus alimentos</span><input type="checkbox" id="mmSalvar"></label><button class="bt pri cheio" id="btSalvarManual">Adicionar</button>`);
    return;
  }
  if (t.id === 'btSalvarManual') {
    const it = {alimento: $('#mmNome').value.trim(), quantidade: $('#mmQtd').value.trim(), calorias: num($('#mmKcal').value), proteina: num($('#mmProt').value)};
    if (!it.alimento) { aviso('Escreva o nome do alimento', true); return; }
    const salvar = $('#mmSalvar').checked; fecharModal(); salvarDia(rodar('adicionarRefeicoes', D.data, [it], salvar)); return;
  }
  if (t.id === 'btCalcular') {
    const txt = $('#txtComida').value.trim();
    if (!txt && !foto) { aviso('Escreva o que comeu ou escolha uma foto', true); return; }
    window._txtComida = txt; aviso('Calculando…');
    try { const itens = await rodar('analisarComida', txt, foto, 'image/jpeg'); sug = itens.map(i => ({...i, marcado: true})); if (!sug.length) aviso('Não encontrei alimentos. Tente escrever de outro jeito.', true); desenhar(); } catch (er) {}
    return;
  }
  if (t.id === 'btSalvarSug') {
    const itens = sug.filter(s => s.marcado).map(s => ({alimento: s.alimento, quantidade: s.quantidade, calorias: s.calorias, proteina: s.proteina, fonte: 'IA'}));
    if (!itens.length) { aviso('Marque pelo menos um alimento', true); return; }
    const salvar = $('#sugSalvar').checked; sug = []; foto = null; window._txtComida = '';
    await salvarDia(rodar('adicionarRefeicoes', D.data, itens, salvar)); aviso('Comida registrada');
  }
});
function escolherFoto(inp) {
  const arq = inp.files[0]; if (!arq) return;
  window._txtComida = $('#txtComida').value;
  const img = new Image(), url = URL.createObjectURL(arq);
  img.onload = () => { const s = Math.min(1, 1024 / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); foto = cv.toDataURL('image/jpeg', .8).split(',')[1]; URL.revokeObjectURL(url); desenhar(); };
  img.onerror = () => aviso('Não consegui abrir a foto', true);
  img.src = url;
}
function cardSugestoes() {
  const tk = sug.filter(s => s.marcado).reduce((t, s) => ({k: t.k + num(s.calorias), p: t.p + num(s.proteina)}), {k: 0, p: 0});
  return `<div class="card"><h2>Confira antes de salvar</h2>${sug.map((s, k) => `<div class="edit">
      <div class="linha"><input type="checkbox" style="flex:none" data-sug="${k}" data-campo="marcado" ${s.marcado ? 'checked' : ''} aria-label="Incluir"><input value="${esc(s.alimento)}" data-sug="${k}" data-campo="alimento" aria-label="Alimento"></div>
      <div class="linha"><input value="${esc(s.quantidade)}" data-sug="${k}" data-campo="quantidade" aria-label="Quantidade"><input inputmode="decimal" value="${esc(s.calorias)}" data-sug="${k}" data-campo="calorias" aria-label="Calorias"><input inputmode="decimal" value="${esc(s.proteina)}" data-sug="${k}" data-campo="proteina" aria-label="Proteína"></div></div>`).join('')}
    <b>Total: ${fmt(tk.k)} kcal · ${fmt(tk.p, 1)} g de proteína</b>
    <label class="troca"><span>Salvar também em Meus alimentos</span><input type="checkbox" id="sugSalvar"></label>
    <div class="grade2"><button class="bt cheio" id="btDescartarSug">Descartar</button><button class="bt pri cheio" id="btSalvarSug">Adicionar ao dia</button></div></div>`;
}
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.sug; if (k === undefined) return;
  const c = e.target.dataset.campo;
  sug[+k][c] = c === 'marcado' ? e.target.checked : (c === 'calorias' || c === 'proteina') ? num(e.target.value) : e.target.value;
  if (c === 'marcado' || c === 'calorias' || c === 'proteina') desenhar();
});

/* ---------- Gráficos ---------- */
function nomesItens(r) {
  const p = r.checklist.find(i => i.tipo === 'peso'), a = r.checklist.find(i => i.tipo === 'agua');
  const t = r.checklist.find(i => i.tipo === 'texto' && /treino/i.test(i.item)) || r.checklist.find(i => i.tipo === 'texto');
  return {peso: p ? p.item : 'Peso', agua: a ? a.item : 'Hidratação', treino: t};
}
function noPeriodo(data) {
  if (graf.periodo === 'tudo') return true;
  const lim = new Date(dt(hojeStr())); lim.setDate(lim.getDate() - (+graf.periodo) + 1);
  return dt(data) >= lim;
}
function svgLinha(pts, meta, unid) {
  const W = 340, H = 190, e = 34, d = 10, t = 12, b = 24;
  const t0 = dt(pts[0][0]).getTime(), t1 = dt(pts[pts.length - 1][0]).getTime();
  const vals = pts.map(p => p[1]).concat(meta ? [meta] : []);
  const mn = Math.floor(Math.min(...vals) - .5), mx = Math.ceil(Math.max(...vals) + .5);
  const X = x => e + (t1 === t0 ? (W - e - d) / 2 : (dt(x).getTime() - t0) / (t1 - t0) * (W - e - d));
  const Y = v => t + (mx - v) / (mx - mn) * (H - t - b);
  const passo = mx - mn > 8 ? 2 : 1;
  let g = '';
  for (let v = mn; v <= mx; v += passo) g += `<line x1="${e}" x2="${W - d}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--soft)"/><text x="${e - 6}" y="${Y(v) + 3.5}" text-anchor="end">${v}</text>`;
  if (meta) g += `<line x1="${e}" x2="${W - d}" y1="${Y(meta)}" y2="${Y(meta)}" stroke="var(--ok)" stroke-dasharray="5 4"/><text x="${W - d}" y="${Y(meta) - 5}" text-anchor="end" style="fill:var(--ok)">meta ${fmt(meta, 1)} ${unid}</text>`;
  const linha = pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  g += `<polygon points="${X(pts[0][0]).toFixed(1)},${H - b} ${linha} ${X(pts[pts.length - 1][0]).toFixed(1)},${H - b}" fill="var(--accent)" opacity=".09"/>`;
  g += `<polyline points="${linha}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
  g += pts.map((p, i) => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 2.6}" fill="var(--accent)"><title>${p[0]}: ${fmt(p[1], 2)} ${unid}</title></circle>`).join('');
  g += `<text x="${e}" y="${H - 6}">${curta(pts[0][0])}</text><text x="${W - d}" y="${H - 6}" text-anchor="end">${curta(pts[pts.length - 1][0])}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de linha">${g}</svg>`;
}
function svgBarras(pts, meta, rotMeta, cor, unid) {
  const W = 340, H = 190, e = 38, d = 10, t = 14, b = 24;
  const mx = Math.max(...pts.map(p => p[1]), meta || 0) * 1.12 || 1, n = pts.length, larg = (W - e - d) / n;
  const Y = v => t + (1 - v / mx) * (H - t - b);
  const rot = v => v >= 1000 ? fmt(v / 1000, 1) + 'k' : mx < 10 ? fmt(v, 1) : fmt(v);
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = mx * k / 4; g += `<line x1="${e}" x2="${W - d}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--soft)"/><text x="${e - 6}" y="${Y(v) + 3.5}" text-anchor="end">${rot(v)}</text>`; }
  g += pts.map((p, i) => { const y = Y(p[1]), lb = Math.max(2, Math.min(34, larg * .66)); return `<rect x="${(e + i * larg + (larg - lb) / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${lb.toFixed(1)}" height="${Math.max(0, H - b - y).toFixed(1)}" rx="${Math.min(6, larg * .3).toFixed(1)}" fill="${cor}"><title>${p[0]}: ${fmt(p[1], 1)} ${unid}</title></rect>`; }).join('');
  if (meta) g += `<line x1="${e}" x2="${W - d}" y1="${Y(meta)}" y2="${Y(meta)}" stroke="var(--ink-2)" stroke-dasharray="5 4"/><text x="${W - d}" y="${Y(meta) - 5}" text-anchor="end" style="fill:var(--ink-2)">${rotMeta}</text>`;
  const marcas = n > 6 ? [0, Math.floor((n - 1) / 2), n - 1] : pts.map((_, i) => i);
  g += marcas.map(i => `<text x="${(e + i * larg + larg / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${curta(pts[i][0])}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de barras">${g}</svg>`;
}
function semanaDe(data) { const x = dt(data); const dia = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dia); return ds(x); }
function dadosGrafico() {
  const c = R.config, nm = nomesItens(R);
  const dias = R.dias.filter(d => noPeriodo(d.data));
  const media = l => l.length ? l.reduce((s, x) => s + x[1], 0) / l.length : 0;
  const kpi = (a, b) => `<div class="kpi"><small>${a}</small><b>${b}</b></div>`;
  const nada = msg => ({svg: `<p class="vazio">${msg}</p>`, kpis: ''});
  switch (graf.metrica) {
    case 'peso': {
      const p = dias.filter(d => num(d.reg[nm.peso]) > 0).map(d => [d.data, num(d.reg[nm.peso])]);
      if (p.length < 2) return nada('Registre mais pesos para ver o gráfico.');
      const ini = num(c.peso_inicial), atual = p[p.length - 1][1], meta = num(c.meta_peso);
      const menor = p.reduce((m, x) => x[1] < m[1] ? x : m, p[0]);
      const semanas = Math.max(1, (dt(p[p.length - 1][0]) - dt(c.data_inicio)) / (7 * 864e5));
      const caminho = ini - meta > 0 ? Math.max(0, Math.min(100, (ini - atual) / (ini - meta) * 100)) : 0;
      return {svg: svgLinha(p, meta, 'kg'), kpis: kpi(`Início · ${curta(c.data_inicio)}`, fmt(ini, 2) + ' kg') + kpi(`Último · ${curta(p[p.length - 1][0])}`, fmt(atual, 2) + ' kg') +
        kpi('Desde o início', (ini - atual >= 0 ? '−' : '+') + fmt(Math.abs(ini - atual), 2) + ' kg') + kpi(`Até ${fmt(meta, 1)} kg`, atual > meta ? fmt(atual - meta, 2) + ' kg' : 'meta alcançada') +
        kpi('Média por semana', (ini - atual >= 0 ? '−' : '+') + fmt(Math.abs(ini - atual) / semanas, 2) + ' kg') + kpi(`Menor · ${curta(menor[0])}`, fmt(menor[1], 2) + ' kg'),
        extra: `<div class="meta"><div class="rot"><span>Caminho até a meta</span><b>${fmt(caminho)}%</b></div><div class="trilho"><i style="width:${caminho}%;background:var(--ok)"></i></div></div>`};
    }
    case 'proteina': case 'calorias': {
      const prot = graf.metrica === 'proteina';
      const p = dias.filter(d => d.nRef > 0 && !d.situacao).map(d => [d.data, prot ? d.prot : d.kcal]);
      if (!p.length) return nada('Nenhuma refeição registrada nesse período.');
      const meta = prot ? c.meta_proteina : c.meta_calorias, u = prot ? 'g' : 'kcal';
      return {svg: svgBarras(p, meta, `meta ${fmt(meta)} ${u}`, prot ? 'var(--accent)' : 'var(--kcal)', u),
        kpis: kpi('Média por dia', fmt(media(p)) + ' ' + u) + kpi(prot ? 'Dias na meta' : 'Dias até a meta', p.filter(x => prot ? x[1] >= meta : x[1] <= meta).length + ' de ' + p.length) + kpi(prot ? 'Melhor dia' : 'Maior dia', fmt(Math.max(...p.map(x => x[1]))) + ' ' + u)};
    }
    case 'agua': {
      const p = dias.filter(d => num(d.reg[nm.agua]) > 0).map(d => [d.data, num(d.reg[nm.agua]) / 1000]);
      if (!p.length) return nada('Nenhuma hidratação registrada nesse período.');
      return {svg: svgBarras(p, c.meta_agua_ml / 1000, `meta ${fmt(c.meta_agua_ml / 1000, 1)} L`, 'var(--agua)', 'L'),
        kpis: kpi('Média por dia', fmt(media(p), 1) + ' L') + kpi('Dias na meta', p.filter(x => x[1] * 1000 >= c.meta_agua_ml).length + ' de ' + p.length) + kpi('Melhor dia', fmt(Math.max(...p.map(x => x[1])), 1) + ' L')};
    }
    case 'passos': {
      const p = dias.filter(d => d.passos > 0).map(d => [d.data, d.passos]);
      if (!p.length) return nada('Os passos aparecem aqui quando o relógio estiver ligado (Ajustes > Relógio e celular).');
      return {svg: svgBarras(p, 8000, '8 mil passos', 'var(--kcal)', 'passos'),
        kpis: kpi('Média por dia', fmt(media(p))) + kpi('Dias com 8 mil ou mais', p.filter(x => x[1] >= 8000).length + ' de ' + p.length) + kpi('Melhor dia', fmt(Math.max(...p.map(x => x[1]))))};
    }
    case 'sono': {
      const p = dias.filter(d => d.sonoMin > 0).map(d => [d.data, d.sonoMin / 60]);
      if (!p.length) return nada('O sono aparece aqui quando o relógio estiver ligado (Ajustes > Relógio e celular).');
      return {svg: svgBarras(p, 7, '7 h', 'var(--agua)', 'horas'),
        kpis: kpi('Média por noite', horasMin(Math.round(media(p) * 60))) + kpi('Noites com 7 h ou mais', p.filter(x => x[1] >= 7).length + ' de ' + p.length) + kpi('Menor noite', horasMin(Math.round(Math.min(...p.map(x => x[1])) * 60)))};
    }
    case 'treino': {
      if (!nm.treino) return nada('Inclua um item de treino na sua lista em Ajustes.');
      const feito = d => { const v = d.reg[nm.treino.item]; return (d.treinos > 0) || (!!v && !/^n[ãa]o\b/i.test(v)); };
      const semanas = {};
      dias.forEach(d => { const s = semanaDe(d.data); semanas[s] = (semanas[s] || 0) + (feito(d) ? 1 : 0); });
      const p = Object.keys(semanas).sort((a, b) => chave(a) < chave(b) ? -1 : 1).map(s => [s, semanas[s]]);
      if (!p.length) return nada('Nenhum treino registrado nesse período.');
      const total = p.reduce((s, x) => s + x[1], 0);
      const minutos = dias.reduce((s, d) => s + (d.treinoMin || 0), 0);
      return {svg: svgBarras(p, 3, '3 por semana', 'var(--treino)', 'treinos'),
        kpis: kpi('Treinos', String(total)) + kpi('Média por semana', fmt(total / p.length, 1)) + kpi(minutos ? 'Tempo no relógio' : 'Semanas com treino', minutos ? horasMin(minutos) : p.filter(x => x[1] > 0).length + ' de ' + p.length)};
    }
  }
}
function telaGraficos() {
  if (!R) return '<div class="card"><p class="vazio">Carregando seu histórico…</p></div>';
  const m = [['peso','Peso'],['proteina','Proteína'],['calorias','Calorias'],['agua','Hidratação'],['treino','Treino'],['passos','Passos'],['sono','Sono']];
  const per =[['30','30 dias'],['90','90 dias'],['tudo','Tudo']];
  const d = dadosGrafico();
  let h = `<div class="chips">${m.map(([k, n]) => `<button class="chip" data-graf="${k}" aria-pressed="${graf.metrica === k}">${n}</button>`).join('')}</div>
    <div class="card"><div class="cab"><h2>${m.find(x => x[0] === graf.metrica)[1]}</h2><div class="seg" style="flex:none">${per.map(([k, n]) => `<button data-periodo="${k}" aria-pressed="${graf.periodo === k}">${n}</button>`).join('')}</div></div>
    <div class="grafico">${d.svg}</div>${d.extra || ''}<div class="kpis">${d.kpis}</div><p class="sub" style="margin:0">Só entram os dias com registro. Dias livres ficam fora de proteína e calorias.</p></div>`;
  const mj = R.mounjaro, c = R.config;
  h += `<div class="grade-auto"><div class="card"><div class="cab"><h2>Mounjaro</h2><button class="bt pri peq" data-mounjaro="1">${IC.mais}Aplicação</button></div>
    <p class="sub" style="margin:0">${c.mounjaro_dia ? `Toda ${esc(c.mounjaro_dia.toLowerCase())}${c.mounjaro_dose ? ' · dose atual ' + esc(c.mounjaro_dose) : ''}` : 'Escolha o dia da aplicação em Ajustes.'}</p>
    ${mj.length ? `<div class="tab-wrap"><table><tr><th>Data</th><th>Dose</th><th>Local</th><th></th></tr>${mj.slice().reverse().slice(0, 12).map(x => `<tr><td>${curta(x.data)}</td><td>${esc(x.dose)}</td><td>${esc(x.local)}${x.obs ? `<div class="sub">${esc(x.obs)}</div>` : ''}</td><td class="n"><button class="x" data-apagarmj="${x.linha}|${x.data}" aria-label="Apagar">${IC.x}</button></td></tr>`).join('')}</table></div>` : '<p class="vazio">Nenhuma aplicação registrada.</p>'}</div>`;
  const nm = nomesItens(R), ativos = R.checklist.filter(i => i.ativo && i.tipo !== 'peso');
  const dias = R.dias.slice().reverse(), mostrar = window._todos ? dias : dias.slice(0, 20);
  h += `<div class="card"><h2>Histórico por dia</h2><div class="tab-wrap"><table><tr><th>Dia</th><th class="n">Peso</th><th class="n">kcal</th><th class="n">Prot.</th><th class="n">Água</th><th class="n">Feito</th></tr>
    ${mostrar.map(d => { const feitos = ativos.filter(i => statusItem(i, d.reg[i.item] || '', d.nRef, c) === 'ok').length, p = num(d.reg[nm.peso]);
      return `<tr data-abrirdia="${d.data}" style="cursor:pointer"><td>${SEM[dt(d.data).getDay()]} ${curta(d.data)}${d.situacao ? `<div class="sub">${d.situacao === 'Livre' ? 'dia livre' : 'sem registro'}</div>` : ''}</td>
        <td class="n">${p ? fmt(p, 2) : '—'}</td><td class="n">${d.nRef ? fmt(d.kcal) : '—'}</td><td class="n">${d.nRef ? fmt(d.prot) : '—'}</td><td class="n">${num(d.reg[nm.agua]) ? fmt(num(d.reg[nm.agua]) / 1000, 1) + ' L' : '—'}</td><td class="n">${feitos}/${ativos.length}</td></tr>`; }).join('')}</table></div>
    ${dias.length > 20 && !window._todos ? '<button class="bt cheio" id="btTodosDias">Ver todos os dias</button>' : ''}<p class="sub" style="margin:0">Toque num dia para abrir e completar.</p></div></div>`;
  return h;
}
function ligarGrafico() {}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-graf],[data-periodo],[data-abrirdia],#btTodosDias'); if (!t) return;
  if (t.id === 'btTodosDias') { window._todos = true; desenhar(); return; }
  if (t.dataset.graf) graf.metrica = t.dataset.graf;
  if (t.dataset.periodo) graf.periodo = t.dataset.periodo;
  if (t.dataset.abrirdia) { try { D = await rodar('carregarDia', t.dataset.abrirdia); irAba('dia'); } catch (er) {} return; }
  desenhar();
});

/* ---------- Metas (calculadora) ---------- */
function ultimoPeso() {
  if (!R) return 0; const nm = nomesItens(R);
  const p = R.dias.filter(d => num(d.reg[nm.peso]) > 0); return p.length ? num(p[p.length - 1].reg[nm.peso]) : num(R.config.peso_inicial);
}
function iniciarCalc() {
  const c = R.config;
  calc = {peso: ultimoPeso(), meta: num(c.meta_peso), altura: num(c.altura_cm) || 160, ano: num(c.ano_nascimento) || 1995, ativ: String(c.atividade || 1.375),
    musc: /^s/i.test(c.musculacao || 'Sim') ? 'sim' : 'nao', gkg: num(c.proteina_g_kg) || 1.6, mlkg: num(c.agua_ml_kg) || 35, deficit: String(num(c.deficit_kcal) || 500), auto: /^s/i.test(c.metas_auto || '')};
}
function contas() {
  const p = num(calc.peso), h = num(calc.altura) / 100, idade = new Date().getFullYear() - num(calc.ano);
  const imc = h ? p / (h * h) : 0;
  const ref = imc >= 30 ? 25 * h * h + .25 * (p - 25 * h * h) : p;
  const fx = calc.musc === 'sim' ? [1.2, 1.7] : [1.2, 1.6];
  const tmb = 10 * p + 6.25 * num(calc.altura) - 5 * idade - 161;
  const gasto = tmb * num(calc.ativ);
  const kcal = Math.round((gasto - num(calc.deficit)) / 10) * 10;
  const kg = Math.max(0, p - num(calc.meta));
  return {p, idade, imc, ref, fx, prot: Math.round(ref * calc.gkg), faixa: [Math.round(ref * fx[0]), Math.round(ref * fx[1])], max: Math.round(ref * 2), min: Math.round(p * .83),
    agua: Math.round(p * calc.mlkg / 50) * 50, tmb: Math.round(tmb), gasto: Math.round(gasto), kcal, kg, semanas: kg && num(calc.deficit) ? Math.round(kg * 7700 / num(calc.deficit) / 7) : 0};
}
function resultadosCalc() {
  const r = contas(), c = R.config;
  const faixaImc = r.imc < 18.5 ? 'abaixo do peso' : r.imc < 25 ? 'peso adequado' : r.imc < 30 ? 'sobrepeso' : 'obesidade';
  return `<div class="linha"><small>Proteína por dia</small><b>${r.prot} g</b><span>${fmtF(calc.gkg, 1)} g/kg sobre ${fmt(r.ref, 1)} kg${r.imc >= 30 ? ' (peso ajustado)' : ''}. Faixa sugerida: ${r.faixa[0]} a ${r.faixa[1]} g. Mínimo da OMS: ${r.min} g. Não passar de ${r.max} g (2 g/kg). Hoje sua meta é ${fmt(c.meta_proteina)} g.</span></div>
    <div class="linha"><small>Água por dia (bebidas)</small><b>${fmt(r.agua / 1000, 2)} L</b><span>${fmt(calc.mlkg)} ml por kg. Em dia de treino, mais 0,4 a 0,8 L por hora de exercício. Hoje sua meta é ${fmt(c.meta_agua_ml / 1000, 1)} L.</span></div>
    <div class="linha"><small>Calorias por dia</small><b>${fmt(r.kcal)} kcal</b><span>Gasto estimado ${fmt(r.gasto)} kcal (em repouso ${fmt(r.tmb)}, ${r.idade} anos)${num(calc.deficit) ? ` menos ${fmt(calc.deficit)}` : ''}. ${r.kg ? `Faltam ${fmt(r.kg, 1)} kg${r.semanas ? `: cerca de ${r.semanas} semanas nesse ritmo (estimativa)` : ''}.` : 'Meta de peso alcançada.'} Hoje sua meta é ${fmt(c.meta_calorias)} kcal.</span></div>
    <div class="linha"><small>IMC</small><b>${fmtF(r.imc, 1)}</b><span>${faixaImc} (OMS: 18,5 a 24,9 é adequado).</span></div>`;
}
function telaMetas() {
  if (!R) return '<div class="card"><p class="vazio">Carregando…</p></div>';
  if (!calc) iniciarCalc();
  const campo = (id, rot, extra = '') => `<div class="campo"><label for="k-${id}">${rot}</label><input id="k-${id}" data-k="${id}" inputmode="decimal" value="${esc(String(calc[id]).replace('.', ','))}" ${extra}></div>`;
  return `<div class="grade-auto"><div class="card"><h2>Seus dados</h2><div class="grade2">
      ${campo('peso', 'Peso atual (kg)')}${campo('meta', 'Meta de peso (kg)')}${campo('altura', 'Altura (cm)')}${campo('ano', 'Ano de nascimento')}
      <div class="campo"><label for="k-ativ">Atividade</label><select id="k-ativ" data-k="ativ">${[['1.2','Pouca'],['1.375','Leve (1 a 3x por semana)'],['1.55','Moderada (3 a 5x)'],['1.725','Intensa (6 a 7x)']].map(([v, n]) => `<option value="${v}" ${String(calc.ativ) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="campo"><label for="k-musc">Musculação</label><select id="k-musc" data-k="musc"><option value="sim" ${calc.musc === 'sim' ? 'selected' : ''}>Sim</option><option value="nao" ${calc.musc === 'nao' ? 'selected' : ''}>Não</option></select></div></div>
      <div class="campo"><label for="k-gkg">Proteína por kg: <b id="lbGkg">${fmtF(calc.gkg, 1)} g</b></label><input type="range" id="k-gkg" data-k="gkg" min="1" max="2" step="0.1" value="${calc.gkg}"></div>
      <div class="campo"><label for="k-mlkg">Água por kg: <b id="lbMlkg">${fmt(calc.mlkg)} ml</b></label><input type="range" id="k-mlkg" data-k="mlkg" min="30" max="45" step="1" value="${calc.mlkg}"></div>
      <div class="campo"><label for="k-deficit">Para emagrecer</label><select id="k-deficit" data-k="deficit">${[['0','Manter o peso'],['250','Devagar (−250 kcal por dia)'],['500','Normal (−500 kcal por dia)']].map(([v, n]) => `<option value="${v}" ${String(calc.deficit) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
    <div class="card"><h2>Resultado</h2><div class="res" id="resCalc">${resultadosCalc()}</div>
      <button class="bt pri cheio" id="btUsarMetas">Usar estas metas</button>
      <label class="troca"><span>Atualizar sozinha quando eu me pesar</span><input type="checkbox" id="k-auto" ${calc.auto ? 'checked' : ''}></label>
      <p class="fonte" style="margin:0">Proteína: <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12264624/" target="_blank" rel="noopener">documento conjunto ACLM, ASN, OMA e TOS (2025)</a>, 1,2 a 1,6 g/kg no emagrecimento com GLP-1 (até 1,7 com musculação, máximo 2). Mínimo: <a href="https://www.cambridge.org/core/services/aop-cambridge-core/content/view/S0007114512002450" target="_blank" rel="noopener">OMS/FAO/UNU 2007</a>, 0,83 g/kg. Água: 30 a 40 ml/kg (conta clínica); <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5133077" target="_blank" rel="noopener">EFSA 2,0 L e IOM 2,7 L</a> por dia, contando a comida. Calorias: Mifflin-St Jeor. São referências: a meta final é a que você combinar com seu médico ou nutricionista.</p></div></div>`;
}
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.k; if (!k || !calc) return;
  calc[k] = ['ativ', 'musc', 'deficit'].includes(k) ? e.target.value : num(e.target.value);
  if (k === 'gkg') $('#lbGkg').textContent = fmtF(calc.gkg, 1) + ' g';
  if (k === 'mlkg') $('#lbMlkg').textContent = fmt(calc.mlkg) + ' ml';
  if (num(calc.peso) > 0 && num(calc.altura) > 0) $('#resCalc').innerHTML = resultadosCalc();
});
document.addEventListener('change', async e => {
  if (e.target.dataset && ['ativ','musc','deficit'].includes(e.target.dataset.k)) { calc[e.target.dataset.k] = e.target.value; $('#resCalc').innerHTML = resultadosCalc(); }
  if (e.target.id !== 'k-auto') return;
  calc.auto = e.target.checked;
  try { R.config = await rodar('salvarConfig', Object.assign(cfgCalc(), {metas_auto: calc.auto ? 'Sim' : 'Não'})); aviso(calc.auto ? 'Vou recalcular quando você se pesar' : 'Metas automáticas desligadas'); } catch (er) {}
});
function cfgCalc() { return {altura_cm: num(calc.altura), ano_nascimento: num(calc.ano), atividade: num(calc.ativ), musculacao: calc.musc === 'sim' ? 'Sim' : 'Não', proteina_g_kg: calc.gkg, agua_ml_kg: calc.mlkg, deficit_kcal: num(calc.deficit), meta_peso: num(calc.meta)}; }
document.addEventListener('click', e => {
  if (!e.target.closest('#btUsarMetas')) return;
  const r = contas();
  abrirModal(`<h3>Trocar suas metas?</h3><div class="res">
    <div class="linha"><small>Proteína</small><b>${fmt(R.config.meta_proteina)} g → ${r.prot} g</b></div>
    <div class="linha"><small>Água</small><b>${fmt(R.config.meta_agua_ml / 1000, 1)} L → ${fmt(r.agua / 1000, 2)} L</b></div>
    <div class="linha"><small>Calorias</small><b>${fmt(R.config.meta_calorias)} → ${fmt(r.kcal)} kcal</b></div></div>
    <div class="grade2"><button class="bt cheio" id="mNao">Cancelar</button><button class="bt pri cheio" id="mSim">Trocar</button></div>`);
  $('#mNao').onclick = fecharModal;
  $('#mSim').onclick = async () => {
    fecharModal();
    try { R.config = await rodar('salvarConfig', Object.assign(cfgCalc(), {meta_proteina: r.prot, meta_agua_ml: r.agua, meta_calorias: r.kcal})); H = null; D = null; aviso('Metas atualizadas'); desenhar(); } catch (er) {}
  };
});

/* ================= AJUSTES ================= */
function prepararAjustes(r) {
  return {config: {...r.config}, temIA: r.temIA, chave: '',
    checklist: r.checklist.map(i => ({item: i.item, nomeAntigo: i.item, emoji: i.emoji, tipo: i.tipo, lembretes: i.lembretes, opcoes: i.opcoes, ativo: i.ativo}))};
}
function telaAjustes() {
  const temaAtual = TEMAS[PREF.tema], escuro = escuroAgora();
  let h = cabecalho('Do seu jeito', 'Ajustes');
  h += `<div class="grade-auto"><div class="card"><h2>Aparência</h2>
    <div class="campo"><span>Tema</span><div class="temas">${Object.entries(TEMAS).map(([k, t]) => { const p = t[escuro ? 'escuro' : 'claro'];
      return `<button class="tema" data-tema="${k}" aria-pressed="${PREF.tema === k}"><span class="amostra"><span style="background:${p.bg}"></span><span style="background:${p.accent}"></span><span style="background:${p.soft}"></span></span>${t.nome}</button>`; }).join('')}</div></div>
    <div class="campo"><span>Cor principal</span><div class="cores"><button class="chip ${PREF.cor ? '' : 'on'}" data-cor="">do tema</button>${CORES_LIVRES.map(c => `<button class="cor" data-cor="${c}" style="background:${c}" aria-label="Cor ${c}" aria-pressed="${PREF.cor.toLowerCase() === c.toLowerCase()}"></button>`).join('')}
      <label class="cor-livre">qualquer cor <input type="color" id="corLivre" value="${PREF.cor || temaAtual.claro.accent}"></label></div></div>
    <div class="campo"><span>Modo</span><div class="seg">${[['auto','Automático'],['claro','Claro'],['escuro','Escuro']].map(([k, n]) => `<button data-modo="${k}" aria-pressed="${PREF.modo === k}">${n}</button>`).join('')}</div></div>
    <div class="campo"><span>Avatar da Lia</span><div class="avatares">${Object.entries(AVATARES).map(([k, a]) => `<button class="avop" data-avatar="${k}" aria-pressed="${PREF.avatar === k}">${a.svg({a: COR.accent, f: COR.surface, i: COR.ink})}${a.nome}</button>`).join('')}</div></div>
    <p class="sub" style="margin:0">Aparência e voz ficam salvas neste aparelho.</p></div>`;
  const vs = vozes();
  h += `<div class="card"><h2>Voz</h2>
    <div class="campo"><label for="prFalar">Responder falando</label><select id="prFalar">${[['microfone','Só quando eu usar o microfone'],['sempre','Sempre'],['nunca','Nunca']].map(o => `<option value="${o[0]}" ${PREF.falar === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
    <div class="campo"><label for="prVoz">Voz</label><select id="prVoz"><option value="">Automática (português)</option>${vs.map(v => `<option ${PREF.voz === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></div>
    <div class="campo"><label for="prVel">Velocidade: <b id="lbVel">${fmtF(PREF.velocidade, 2)}×</b></label><input type="range" id="prVel" min="0.7" max="1.5" step="0.05" value="${PREF.velocidade}"></div>
    <button class="bt cheio" id="btTesteVoz">${IC.ouvir}Ouvir teste</button>
    <h2 style="margin-top:6px">Conexão</h2>${CONEXAO ? '<p style="margin:0">Lia conectada à sua planilha e agenda.</p><button class="lnk" id="btDesconectar">desconectar este aparelho</button>' : '<p class="sub" style="margin:0">Não conectada. Abra o link “Conectar a Lia” do seu e-mail.</p>'}</div></div>`;
  if (!CONEXAO) return h;
  const ult = H && H.atividade && H.atividade.ultimaSinc;
  h += `<div class="card"><div class="cab"><h2>Relógio e celular</h2><small>${ult ? 'última vez: ' + esc(ult) : 'ainda não ligado'}</small></div>
    <p style="margin:0">Passos, sono, treinos e peso chegam sozinhos do Samsung Health e do Garmin, pelo Health Connect do celular.</p>
    <ol class="sub" style="margin:0;padding-left:18px;display:grid;gap:4px">
      <li>No Garmin Connect: Mais > Configurações > Aplicativos conectados > Health Connect > ligar tudo.</li>
      <li>No Samsung Health: Configurações > Health Connect > permitir tudo.</li>
      <li>Instale o app <b>HC Webhook</b> na Play Store e toque em <b>Grant Permissions</b>: passos, sono, exercício, calorias ativas e peso.</li>
      <li>Em <b>Webhooks</b>, toque em adicionar e cole o endereço do botão abaixo. Formato: JSON.</li>
      <li>Em <b>Data Types</b>, deixe passos e calorias ativas em <b>Daily</b>. Sincronizar a cada 30 ou 60 minutos e <b>Save</b>.</li>
      <li>Toque em <b>Sync Now</b> para testar. Em Configurações do celular > Bateria, deixe o HC Webhook sem restrição.</li>
    </ol>
    <button class="bt pri cheio" id="btCopiarHc">Copiar endereço para o HC Webhook</button>
    <p class="sub" style="margin:0">Esse endereço tem o seu código de acesso: não mande para ninguém.</p></div>`;
  if (!A) return h + '<div class="card"><p class="vazio">Carregando…</p></div>';
  const c = A.config;
  const cfgCampo = (k, rot) => `<div class="campo"><label for="cf-${k}">${rot}</label><input id="cf-${k}" data-cfg="${k}" value="${esc(c[k] ?? '')}"></div>`;
  h += `<div class="grade-auto"><div class="card"><h2>Metas e corpo</h2><p class="sub" style="margin:0">A calculadora fica em Saúde > Metas.</p><div class="grade2">
    ${cfgCampo('meta_proteina', 'Proteína por dia (g)')}${cfgCampo('meta_calorias', 'Calorias por dia (kcal)')}${cfgCampo('meta_agua_ml', 'Hidratação por dia (ml)')}${cfgCampo('meta_peso', 'Meta de peso (kg)')}
    ${cfgCampo('peso_inicial', 'Peso no início (kg)')}${cfgCampo('data_inicio', 'Data do início')}${cfgCampo('altura_cm', 'Altura (cm)')}${cfgCampo('ano_nascimento', 'Ano de nascimento')}
    ${cfgCampo('caneca_cha_ml', 'Caneca de chá (ml)')}${cfgCampo('copo_agua_ml', 'Copo de água (ml)')}</div>
    <h2>Mounjaro</h2><div class="grade2"><div class="campo"><label for="cf-mjdia">Dia da aplicação</label><select id="cf-mjdia" data-cfg="mounjaro_dia"><option value="">escolha</option>${DIAS_SEMANA.map(d => `<option ${c.mounjaro_dia === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>${cfgCampo('mounjaro_dose', 'Dose atual')}</div></div>`;
  h += `<div class="card"><h2>Minha lista do dia</h2>${A.checklist.map((i, k) => `<div class="edit">
      <div class="linha"><input value="${esc(i.item)}" placeholder="Nome do item" data-lista="${k}" data-campo="item" aria-label="Nome do item"><select data-lista="${k}" data-campo="tipo" aria-label="Tipo">${Object.keys(TIPOS).map(t => `<option value="${t}" ${i.tipo === t ? 'selected' : ''}>${TIPOS[t]}</option>`).join('')}</select></div>
      ${i.tipo === 'texto' ? `<input value="${esc(i.opcoes)}" placeholder="Opções separadas por vírgula" data-lista="${k}" data-campo="opcoes" aria-label="Opções">` : ''}
      <div class="linha"><label class="troca" style="flex:1"><span class="sub">Mostrar</span><input type="checkbox" data-lista="${k}" data-campo="ativo" ${i.ativo ? 'checked' : ''}></label>
        <div class="linha-bt" style="flex:none"><button class="x" data-mover="${k},-1" ${k === 0 ? 'disabled' : ''} aria-label="Subir">${IC.cima}</button><button class="x" data-mover="${k},1" ${k === A.checklist.length - 1 ? 'disabled' : ''} aria-label="Descer">${IC.baixo}</button><button class="x" data-tiraritem="${k}" aria-label="Tirar">${IC.lixo}</button></div></div></div>`).join('')}
    <button class="bt cheio" id="btIncluirItem">${IC.mais}Incluir item</button>
    <h2>IA (Gemini, grátis)</h2>${A.temIA ? '<p style="margin:0">Chave salva. <button class="lnk" id="btApagarChave">apagar chave</button></p>' : ''}
    <div class="campo"><label for="cfChave">${A.temIA ? 'Trocar a chave' : 'Colar a chave'}</label><input type="password" autocomplete="off" id="cfChave" placeholder="Cole aqui"></div>
    <p class="sub" style="margin:0">Pegue a chave em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (“Criar chave de API”). Ela fica guardada no seu Google, não neste aparelho.</p></div></div>
    <button class="bt pri cheio" id="btSalvarAjustes">Salvar metas, lista e IA</button>`;
  return h;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tema],[data-cor],[data-modo],[data-avatar],#btTesteVoz,#btCopiarHc,#btDesconectar,#btIncluirItem,[data-mover],[data-tiraritem],#btApagarChave,#btSalvarAjustes'); if (!t) return;
  if (t.dataset.tema) { PREF.tema = t.dataset.tema; salvarPref(); desenhar(); return; }
  if (t.dataset.cor !== undefined) { PREF.cor = t.dataset.cor; salvarPref(); desenhar(); return; }
  if (t.dataset.modo) { PREF.modo = t.dataset.modo; salvarPref(); desenhar(); return; }
  if (t.dataset.avatar) { PREF.avatar = t.dataset.avatar; salvarPref(); desenhar(); return; }
  if (t.id === 'btTesteVoz') { falar('Oi, Daia! Eu sou a Lia. Assim fica bom?', true); return; }
  if (t.id === 'btCopiarHc') {
    const end = CONEXAO.u + (CONEXAO.u.includes('?') ? '&' : '?') + 'fonte=hc&t=' + encodeURIComponent(CONEXAO.t);
    const mostrar = () => { abrirModal(`<h3>Endereço para o HC Webhook</h3><p class="sub" style="margin:0">Segure o dedo no texto para copiar.</p><textarea id="endHc" rows="5" readonly>${esc(end)}</textarea><button class="bt pri cheio" id="mFechar">Pronto</button>`); $('#endHc').select(); $('#mFechar').onclick = fecharModal; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(end).then(() => aviso('Endereço copiado. Cole no HC Webhook.'), mostrar); else mostrar();
    return;
  }
  if (t.id === 'btDesconectar') {
    abrirModal(`<h3>Desconectar este aparelho?</h3><p class="sub">Para conectar de novo, abra outra vez o link do seu e-mail.</p><div class="grade2"><button class="bt cheio" id="mNao">Cancelar</button><button class="bt pri cheio" id="mSim">Desconectar</button></div>`);
    $('#mNao').onclick = fecharModal; $('#mSim').onclick = () => { try { localStorage.removeItem('lia_conexao'); } catch (er) {} location.reload(); };
    return;
  }
  if (!A) return;
  if (t.id === 'btIncluirItem') { A.checklist.push({item: '', nomeAntigo: '', emoji: '', tipo: 'sim', lembretes: '', opcoes: '', ativo: true}); desenhar(); return; }
  if (t.dataset.mover) { const [k, d] = t.dataset.mover.split(',').map(Number), l = A.checklist; [l[k], l[k + d]] = [l[k + d], l[k]]; desenhar(); return; }
  if (t.dataset.tiraritem) {
    const k = +t.dataset.tiraritem;
    abrirModal(`<h3>Tirar “${esc(A.checklist[k].item || 'item')}” da lista?</h3><p class="sub">O que você já registrou continua guardado.</p><div class="grade2"><button class="bt cheio" id="mNao">Cancelar</button><button class="bt pri cheio" id="mSim">Tirar</button></div>`);
    $('#mNao').onclick = fecharModal; $('#mSim').onclick = () => { A.checklist.splice(k, 1); fecharModal(); desenhar(); };
    return;
  }
  if (t.id === 'btApagarChave') { A.chave = '__apagar__'; A.temIA = false; desenhar(); return; }
  if (t.id === 'btSalvarAjustes') {
    const ch = $('#cfChave') && $('#cfChave').value.trim();
    com(() => api('salvarAjustes', A.config, A.checklist.filter(i => i.item.trim()), ch || A.chave)).then(r => { A = prepararAjustes(r); H = null; D = null; R = null; calc = null; desenhar(); aviso('Ajustes salvos'); }).catch(() => {});
  }
});
document.addEventListener('input', e => {
  const d = e.target.dataset || {};
  if (e.target.id === 'corLivre') { PREF.cor = e.target.value; salvarPref(); aplicarTema(); desenharNav(); return; }
  if (e.target.id === 'prVel') { PREF.velocidade = Number(e.target.value); salvarPref(); $('#lbVel').textContent = fmtF(PREF.velocidade, 2) + '×'; return; }
  if (d.cfg && A) { A.config[d.cfg] = e.target.value; return; }
  if (d.lista !== undefined && A && d.campo !== 'ativo' && d.campo !== 'tipo') A.checklist[+d.lista][d.campo] = e.target.value;
});
document.addEventListener('change', e => {
  const d = e.target.dataset || {};
  if (e.target.id === 'corLivre') { desenhar(); return; }
  if (e.target.id === 'prFalar') { PREF.falar = e.target.value; salvarPref(); return; }
  if (e.target.id === 'prVoz') { PREF.voz = e.target.value; salvarPref(); return; }
  if (d.cfg && A) { A.config[d.cfg] = e.target.value; return; }
  if (d.lista !== undefined && A) {
    if (d.campo === 'ativo') A.checklist[+d.lista].ativo = e.target.checked;
    if (d.campo === 'tipo') { A.checklist[+d.lista].tipo = e.target.value; desenhar(); }
  }
});

/* ---------- início ---------- */
$('#btMic').innerHTML = IC.mic;
$('#btEnviar').innerHTML = IC.enviar;
aplicarTema();
irAba('hoje');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

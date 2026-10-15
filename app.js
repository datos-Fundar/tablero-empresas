'use strict';
/* =============================================================================
   Tablero del Monitor de Empresas (Fundar)
   Datos: datos/datos.js (generado por preparar_datos_tablero.R)
   Mapa:  datos/provincias_geo.js (IGN, simplificado)
   Sin dependencias externas: los gráficos se dibujan en SVG a mano.
============================================================================= */

const D = window.DATOS_EMPRESAS;
const GEO = (window.GEO_PROVINCIAS && window.GEO_PROVINCIAS.features) || [];

// ---------------------------------------------------------------------------
// Fechas: índice mensual desde jul-1996
// ---------------------------------------------------------------------------
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const Y0 = 1996, M0 = 7;
const ymIdx = ym => { const [y, m] = ym.split('-').map(Number); return (y - Y0) * 12 + (m - M0); };
const idxYM = i => { const t = i + M0 - 1; return [Y0 + Math.floor(t / 12), (t % 12) + 1]; };
const mesCorto = i => { const [y, m] = idxYM(i); return MESES[m - 1] + '-' + String(y).slice(2); };
const mesLargo = i => { const [y, m] = idxYM(i); return MESES_L[m - 1] + ' ' + y; };
const N = ymIdx(D.grupos.total.fin) + 1;
const ULT = N - 1;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------
const G = {};
for (const [key, g] of Object.entries(D.grupos)) {
  const i0 = ymIdx(g.inicio), i1 = ymIdx(g.fin);
  const series = new Map();
  g.nombres.forEach(n => {
    const arr = new Array(N).fill(null);
    g.valores[n].forEach((v, j) => { arr[i0 + j] = v; });
    series.set(n, arr);
  });
  G[key] = {
    key, i0, i1, nombres: g.nombres, nota: g.nota, series,
    corto: n => g.cortos[g.nombres.indexOf(n)] || n,
    detalle: n => (g.detalle || [])[g.nombres.indexOf(n)] || ''
  };
}
const TOTAL = G.total.series.get('Total');

const GOB_CORTO = { menem: 'Menem II*', delarua: 'De la Rúa', duhalde: 'Duhalde', nk: 'N. Kirchner', cfk1: 'CFK I', cfk2: 'CFK II', macri: 'Macri', af: 'Fernández', milei: 'Milei' };
const GOB = D.gobiernos.map((g, k, a) => ({
  ...g, corto: GOB_CORTO[g.id] || g.nombre,
  b: ymIdx(g.base), f: k < a.length - 1 ? ymIdx(a[k + 1].base) : ULT, actual: k === a.length - 1
}));
const GOB_ACTUAL = GOB[GOB.length - 1];
const gobiernoVigente = i => { let r = GOB[0]; GOB.forEach(g => { if (g.b < i) r = g; }); return r; };

// Paleta categórica en orden fijo (tonos de la presentación)
const CAT = ['#3B9E78', '#ED8688', '#466874', '#C6BF93', '#9695B3', '#87B2C1', '#B08968', '#7A7A76'];

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
const SEL_DEFECTO = {
  sector_rev4: ['Industria manufacturera', 'Comercio al por mayor y al por menor; reparacion de vehiculos automotores y motocicletas', 'Construccion', 'Agricultura, ganaderia, caza, silvicultura y pesca'],
  sector_empalme: ['Manufacturas', 'Comercio', 'Construcción', 'Agricultura'],
  prov_trabajo: ['Buenos Aires', 'C.A.B.A.', 'Córdoba', 'Santa Fe'],
  tamano: ['Más de 2 trabajadores', 'Más de 5 trabajadores', 'Más de 10 trabajadores', 'Más de 25 trabajadores', 'Más de 50 trabajadores', 'Más de 100 trabajadores', 'Más de 500 trabajadores'],
  prov_fiscal: ['Buenos Aires', 'C.A.B.A.', 'Córdoba', 'Santa Fe']
};

const S = {
  vista: 'resumen',
  provFuente: 'prov_trabajo',
  secClas: 'sector_rev4',
  simple: { dim: 'sec', periodo: 'm12', serie: 'total:', gobs: new Set(['cfk1', 'cfk2', 'macri', 'af', 'milei']) },
  ramaSec: 'Industria manufacturera',
  ramaUmbral: 0,
  res: { modo: 'nivel', periodo: 'm12' },
  var: { dim: 'prov', fin: ULT, periodos: ['m1', 'm12', 'gob'], n: 6, fecha: ymIdx('2023-11'), metrica: 'pct', orden: 'primero', escala: 'panel', total: true },
  gob: { dim: 'total', sel: {}, conTotal: true, gobs: new Set(['cfk1', 'cfk2', 'macri', 'af', 'milei']), horizonte: 'mandato', hN: 24, vista: 'entidad', metrica: 'idx', escala: 'comun' },
  lp: { dim: 'sec', sel: {}, trans: 'idx', base: null, suav: false, vista: 'multiples', escala: 'libre', desde: null, hasta: null, refTotal: true, bandas: true },
  casc: { dim: 'sec', vista: 'cascada', fin: ULT, periodo: 'gob', n: 12, fecha: ymIdx('2023-11'), gob: 'milei', metrica: 'abs', orden: 'asc', top: 0 },
  tam: { dim: 'tam', sel: {}, conTotal: true, gobs: new Set(['cfk1', 'cfk2', 'macri', 'af', 'milei']), horizonte: 'mandato', hN: 24, vista: 'entidad', metrica: 'idx', escala: 'libre' },
  ramas: {
    mirada: 'var',
    var: { dim: 'rama', fin: ULT, periodos: ['m12', 'gob'], n: 6, fecha: ymIdx('2023-11'), metrica: 'pct', orden: 'primero', escala: 'comun', total: true },
    lp: { dim: 'rama', sel: {}, trans: 'idx', base: null, suav: false, vista: 'multiples', escala: 'comun', desde: null, hasta: null, refTotal: true, bandas: true },
    gob: { dim: 'rama', sel: {}, conTotal: true, gobs: new Set(['af', 'milei']), horizonte: 'actual', hN: 24, vista: 'barras', metrica: 'pct', escala: 'comun' }
  },
  mapa: { vista: 'mapa', metrica: 'pct', periodo: 'gob', n: 12, fecha: ymIdx('2023-11'), fin: ULT, sel: null, detalle: 'idx' }
};

// Modo simple (el que se ve al abrir) y modo avanzado
const avz = () => document.body.classList.contains('avanzado');
const VISTAS_AVANZADAS = ['cascada', 'tamano', 'largo', 'ramas'];
const PERIODOS_SIMPLE = [['m1', 'El mes anterior'], ['m12', 'Un año atrás'], ['gob', 'El inicio del gobierno']];
// Celulares y tablets: menú hamburguesa y hoja de filtros. Las descargas se dibujan con FORZAR_ESCRITORIO.
const MQ_MOVIL = matchMedia('(max-width: 860px)');
let FORZAR_ESCRITORIO = false;
const esMovil = () => !FORZAR_ESCRITORIO && MQ_MOVIL.matches;
function ayuda(root, texto) {
  if (avz()) return;
  if (esMovil()) texto = texto.replace('Pasá el mouse por los gráficos', 'Tocá los gráficos').replace('A la derecha, el ranking', 'Debajo, el ranking').replace('Hacé clic', 'Tocá');
  h('div', { class: 'ayuda' }, root, texto);
}

function grupoDim(dim) { return dim === 'prov' ? G[avz() ? S.provFuente : 'prov_trabajo'] : dim === 'sec' ? G[avz() ? S.secClas : 'sector_rev4'] : dim === 'rama' ? grupoRamas() : dim === 'tam' ? G.tamano : G.total; }
// Ramas a 2 dígitos filtradas por sección y por mínimo de empresas en el último mes
function grupoRamas() {
  const base = G.rama2, sec = S.ramaSec, u = S.ramaUmbral;
  const nombres = base.nombres.filter(n => (sec === 'todas' || base.detalle(n) === sec) && (base.series.get(n)[base.i1] || 0) >= u);
  return { ...base, key: `rama2_${sec}_${u}`, nombres };
}
// Serie de referencia: el total país, o el total de la sección cuando se miran las ramas de una sola sección
function referencia(dim) {
  if (dim === 'tam') return { arr: TOTAL, label: 'Total de empresas' };
  if (dim === 'rama' && S.ramaSec !== 'todas') {
    const n = G.sector_rev4.nombres.find(x => G.sector_rev4.corto(x) === S.ramaSec);
    if (n) return { arr: G.sector_rev4.series.get(n), label: 'Total ' + S.ramaSec.toLowerCase() };
  }
  return { arr: TOTAL, label: 'Total país' };
}
function selDe(obj, g, todos) {
  if (!obj[g.key]) obj[g.key] = new Set(todos ? g.nombres : (SEL_DEFECTO[g.key] || g.nombres.slice(0, 4)));
  return obj[g.key];
}

// ---------------------------------------------------------------------------
// Cálculos
// ---------------------------------------------------------------------------
const pct = (a, b) => (a == null || b == null || b === 0) ? null : (a / b - 1) * 100;
function prom(arr, a, b) {
  if (a < 0) return null;
  let s = 0;
  for (let i = a; i <= b; i++) { if (arr[i] == null) return null; s += arr[i]; }
  return s / (b - a + 1);
}
const mm12 = arr => arr.map((_, i) => i < 11 ? null : prom(arr, i - 11, i));

function refIdx(sp, fin) {
  switch (sp.tipo) {
    case 'm1': return fin - 1;
    case 'm12': return fin - 12;
    case 'n': return fin - sp.n;
    case 'fecha': return sp.fecha;
    case 'gob': return gobiernoVigente(fin).b;
  }
  return null;
}
function valorPeriodo(arr, sp, fin, metrica) {
  let a, b;
  if (sp.tipo === 'prom12') { a = prom(arr, fin - 11, fin); b = prom(arr, fin - 23, fin - 12); }
  else { const r = refIdx(sp, fin); a = arr[fin]; b = r >= 0 ? arr[r] : null; }
  if (a == null) return null;
  if (metrica === 'nivel') return a;
  if (b == null) return null;
  return metrica === 'pct' ? pct(a, b) : metrica === 'abs' ? a - b : a / b * 100;
}
function etiquetaPeriodo(sp, fin) {
  switch (sp.tipo) {
    case 'm1': return 'Intermensual';
    case 'm12': return 'Interanual';
    case 'n': return `Últimos ${sp.n} meses`;
    case 'prom12': return 'Prom. 12 meses vs. 12 previos';
    case 'fecha': return `Desde ${mesCorto(sp.fecha)}`;
    case 'gob': return `Desde el inicio de ${gobiernoVigente(fin).corto}`;
  }
}
function rangoPeriodo(sp, fin) {
  if (sp.tipo === 'prom12') return `${mesCorto(fin - 11)} a ${mesCorto(fin)} vs. ${mesCorto(fin - 23)} a ${mesCorto(fin - 12)}`;
  return `${mesCorto(refIdx(sp, fin))} → ${mesCorto(fin)}`;
}

// ---------------------------------------------------------------------------
// Formatos (es-AR)
// ---------------------------------------------------------------------------
const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signo = (v, cero) => Math.abs(v) < cero ? '' : v > 0 ? '+' : '−';
const fNum = v => v == null ? '—' : nf0.format(Math.round(v));
const fSigno = v => v == null ? '—' : signo(v, 0.5) + nf0.format(Math.abs(Math.round(v)));
const fPct = v => v == null ? '—' : signo(v, 0.05) + nf1.format(Math.abs(v)) + '%';
const fIdx = v => v == null ? '—' : nf1.format(v);
const fPart = v => v == null ? '—' : nf1.format(v) + '%';
const nf2 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fPP = v => v == null ? '—' : signo(v, 0.005) + nf2.format(Math.abs(v)) + ' pp';
const FMT = { pct: fPct, abs: fSigno, idx: fIdx, nivel: fNum, part: fPart, ia: fPct };
const REF = { pct: 0, abs: 0, idx: 100, nivel: null, part: null, ia: 0 };
function fmtEje(metrica, step) {
  return t => {
    if (metrica === 'idx') return step < 1 ? nf1.format(t) : nf0.format(t);
    if (metrica === 'pct' || metrica === 'ia' || metrica === 'part') return (step < 1 ? nf1.format(t) : nf0.format(t)) + '%';
    if (Math.abs(t) >= 1e6) return nf1.format(t / 1e6) + ' M';
    if (Math.abs(t) >= 1e4) return nf0.format(t / 1e3) + ' mil';
    return nf0.format(t);
  };
}

// ---------------------------------------------------------------------------
// DOM y SVG
// ---------------------------------------------------------------------------
const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, str, attrs) { const t = s('text', { x, y, ...attrs }, parent); t.textContent = str; return t; }
function h(tag, attrs, parent, html) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
const css = v => getComputedStyle(document.body).getPropertyValue(v).trim();
const FUENTE_SVG = 'Helvetica Neue, Helvetica, Arial, sans-serif';
function nuevoSVG(root, w, hh) {
  return s('svg', { width: w, height: hh, viewBox: `0 0 ${w} ${hh}`, 'font-family': FUENTE_SVG, xmlns: NS }, root);
}
function ajustarAlto(svg, hh) { const w = svg.getAttribute('width'); svg.setAttribute('height', hh); svg.setAttribute('viewBox', `0 0 ${w} ${hh}`); }
function anchoTexto(str, px = 12) { return String(str).length * px * 0.56; }

function escala(d0, d1, r0, r1) {
  const f = v => r0 + (v - d0) / ((d1 - d0) || 1) * (r1 - r0);
  f.inv = p => d0 + (p - r0) / ((r1 - r0) || 1) * (d1 - d0);
  return f;
}
function pasoLindo(rango, n) {
  const raw = rango / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const e = raw / p;
  return (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * p;
}
function marcas(min, max, n) {
  const st = pasoLindo(max - min, n), out = [];
  for (let v = Math.ceil(min / st - 1e-9) * st; v <= max + st * 1e-9; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : v);
  return { ticks: out, step: st };
}
function dominioLindo(min, max, n = 4, incluir) {
  if (incluir != null) { min = Math.min(min, incluir); max = Math.max(max, incluir); }
  if (!isFinite(min) || !isFinite(max)) return [0, 1];
  if (min === max) { const d = Math.abs(min) * 0.05 || 1; min -= d; max += d; }
  const pad = (max - min) * 0.04;
  const st = pasoLindo(max - min + 2 * pad, n);
  return [Math.floor((min - pad) / st) * st, Math.ceil((max + pad) / st) * st];
}

// Colores
const hexRgb = x => { x = x.replace('#', ''); if (x.length === 3) x = x.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(x.substr(i, 2), 16)); };
const rgbHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mezclar = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };
const luminancia = x => { const [r, g, b] = hexRgb(x); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
function escalaDiv(maxAbs, centro = 0) {
  const n2 = css('--neg-2'), n1 = css('--neg'), m = css('--neutro'), p1 = css('--pos'), p2 = css('--pos-2'), nd = css('--sin-dato');
  const f = v => {
    if (v == null || !isFinite(v)) return nd;
    const t = clamp((v - centro) / (maxAbs || 1), -1, 1);
    if (t < 0) return t < -0.5 ? mezclar(n1, n2, (-t - 0.5) / 0.5) : mezclar(m, n1, -t / 0.5);
    return t > 0.5 ? mezclar(p1, p2, (t - 0.5) / 0.5) : mezclar(m, p1, t / 0.5);
  };
  f.dom = [centro - maxAbs, centro + maxAbs];
  return f;
}
function escalaSeq(min, max, log) {
  const c0 = css('--seq-0'), c1 = css('--seq-1'), c2 = css('--seq-2'), nd = css('--sin-dato');
  const tr = v => log ? Math.log(Math.max(v, 1e-9)) : v;
  const f = v => {
    if (v == null || !isFinite(v)) return nd;
    const t = clamp((tr(v) - tr(min)) / ((tr(max) - tr(min)) || 1), 0, 1);
    return t < 0.5 ? mezclar(c0, c1, t / 0.5) : mezclar(c1, c2, (t - 0.5) / 0.5);
  };
  f.dom = [min, max]; f.log = log;
  return f;
}
const colorGob = g => document.body.classList.contains('oscuro') && g.id === 'cfk2' ? '#7FA6B5' : g.color;

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------
const TT = document.getElementById('tooltip');
function tipMostrar(ev, html) {
  TT.innerHTML = html; TT.hidden = false;
  const r = TT.getBoundingClientRect(), pad = 14;
  let x = ev.clientX + pad, y = ev.clientY + pad;
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
  if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - pad;
  TT.style.left = Math.max(4, x) + 'px'; TT.style.top = Math.max(4, y) + 'px';
}
function tipOcultar() { TT.hidden = true; }
// En pantallas táctiles el tooltip aparece al tocar y se va al tocar fuera del gráfico o al desplazarse
function tocar(el, fn) { el.addEventListener('mousemove', fn); el.addEventListener('click', fn); }
document.addEventListener('click', ev => { if (!ev.target.closest('svg')) tipOcultar(); });
addEventListener('scroll', () => { if (esMovil()) tipOcultar(); }, { passive: true });
const ttFila = (color, label, valor, extra) =>
  `<div class="tt-row"><span>${color ? `<i class="sw" style="background:${color}"></i>` : ''}${label}</span><b>${valor}</b></div>${extra ? `<div class="tt-muted">${extra}</div>` : ''}`;

// ---------------------------------------------------------------------------
// Descargas
// ---------------------------------------------------------------------------
function bajar(blob, archivo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = archivo;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function descargarCSV(filas, nombre) {
  const esc = v => {
    if (v == null) return '';
    if (typeof v === 'number') return String(Math.round(v * 1e4) / 1e4).replace('.', ',');
    return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  bajar(new Blob(['﻿' + filas.map(r => r.map(esc).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), nombre + '.csv');
}
function svgParaExportar(svg, titulo, subtitulo) {
  const w = +svg.getAttribute('width'), hh = +svg.getAttribute('height'), pad = 20;
  const top = titulo ? (subtitulo ? 70 : 46) : 16, bot = 36;
  const W = w + 2 * pad, H = hh + top + bot;
  const out = s('svg', { xmlns: NS, width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'font-family': FUENTE_SVG });
  s('rect', { x: 0, y: 0, width: W, height: H, fill: css('--bg') }, out);
  if (titulo) txt(out, pad, 32, titulo, { 'font-size': 19, 'font-weight': 700, fill: css('--ink') });
  if (subtitulo) txt(out, pad, 55, subtitulo.replace(/<[^>]+>/g, ''), { 'font-size': 13, fill: css('--ink2') });
  const g = s('g', { transform: `translate(${pad},${top})` }, out);
  g.innerHTML = svg.innerHTML;
  txt(out, pad, H - 14, 'Fuente: ' + D.fuente, { 'font-size': 11.5, fill: css('--ink2'), 'font-weight': 700 });
  txt(out, W - pad, H - 12, 'fundar', { 'font-size': 18, 'font-weight': 700, fill: css('--ink'), 'text-anchor': 'end', 'letter-spacing': '-0.5' });
  return out;
}
function exportarSVG(svg, nombre, t, st) {
  const str = new XMLSerializer().serializeToString(svgParaExportar(svg, t, st));
  bajar(new Blob([str], { type: 'image/svg+xml' }), nombre + '.svg');
}
function exportarPNG(svg, nombre, t, st) {
  const o = svgParaExportar(svg, t, st);
  const W = +o.getAttribute('width'), H = +o.getAttribute('height');
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
    const ctx = c.getContext('2d'); ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
    c.toBlob(b => bajar(b, nombre + '.png'));
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(o));
}

// ---------------------------------------------------------------------------
// Componentes de página
// ---------------------------------------------------------------------------
const LOGO_SVG = '<svg class="logo-barras" viewBox="0 0 200 34"><rect x="0" y="0" width="200" height="8"/><rect x="0" y="12" width="200" height="8"/><circle cx="4.5" cy="28" r="4.5"/></svg>';
function encabezado(root, titulo, bajada, seccion) {
  const hd = h('header', { class: 'vista-hd' }, root);
  const t = h('div', {}, hd);
  h('span', { class: 'seccion' }, t, seccion);
  h('h1', {}, t, titulo);
  if (bajada) h('p', { class: 'bajada' }, t, bajada);
  // El logo va acá solo cuando la barra lateral está cerrada (con la barra abierta se ve en ella)
  h('div', { class: 'marca-fundar', 'aria-hidden': 'true' }, hd, LOGO_SVG + '<span>fundar</span>');
}
// En el celular las descargas salen en formato escritorio: se vuelve a dibujar la vista en un contenedor
// oculto de 1180 px y se toma el gráfico de la misma tarjeta
let nTarjeta = 0;
function conSvgExportable(idx, body, fn) {
  if (!esMovil()) { const svg = body.querySelector('svg'); if (svg) fn(svg); return; }
  const cont = h('div', { class: 'render-export', 'aria-hidden': 'true' }, document.body);
  const guardado = [nPanel, nDD, nTarjeta, DD_ABIERTO];
  FORZAR_ESCRITORIO = true; nPanel = 0; nDD = {}; nTarjeta = 0; DD_ABIERTO = null;
  try {
    (VISTAS[S.vista] || vistaResumen)(cont);
    const svg = cont.querySelector(`[data-tarjeta="${idx}"] .card-body svg`);
    if (svg) fn(svg);
  } finally {
    FORZAR_ESCRITORIO = false;
    [nPanel, nDD, nTarjeta, DD_ABIERTO] = guardado;
    cont.remove();
  }
}
function tarjeta(parent, o) {
  const idx = nTarjeta++;
  const c = h('div', { class: 'card', 'data-tarjeta': idx }, parent);
  const hd = h('div', { class: 'card-hd' }, c);
  const tt = h('div', {}, hd);
  if (o.titulo) h('h3', {}, tt, o.titulo);
  if (o.subtitulo) h('p', { class: 'card-sub' }, tt, o.subtitulo);
  const acts = h('div', { class: 'card-acts' }, hd);
  const body = h('div', { class: 'card-body' }, c);
  h('div', { class: 'card-foot' }, c, (o.nota ? o.nota + ' ' : '') + '<b>Fuente:</b> ' + D.fuente);
  const boton = (lbl, fn, title) => { const b = h('button', { class: 'btn-mini', type: 'button', title }, acts, lbl); b.onclick = fn; };
  const nombre = o.nombre || 'monitor_empresas';
  boton('PNG', () => conSvgExportable(idx, body, svg => exportarPNG(svg, nombre, o.titulo, o.subtitulo)), 'Descargar imagen');
  if (avz()) boton('SVG', () => conSvgExportable(idx, body, svg => exportarSVG(svg, nombre, o.titulo, o.subtitulo)), 'Descargar gráfico editable');
  if (o.csv) boton('CSV', () => descargarCSV(o.csv(), nombre), 'Descargar los datos del gráfico');
  return body;
}
function vacio(root, msg) { h('div', { class: 'card vacio' }, root, msg); }

// Controles
// Panel plegable que agrupa los filtros de cada vista. Arranca cerrado y recuerda si se abrió.
const PANELES_ABIERTOS = new Set();
let nPanel = 0;
const HOJA = document.getElementById('hoja'), HOJA_CUERPO = document.getElementById('hoja-cuerpo');
function panelCtls(root, titulo = 'Filtros y opciones del gráfico') {
  const clave = S.vista + '|' + (nPanel++);
  // En el celular los controles van a la hoja a pantalla completa (una sección por panel)
  if (esMovil()) {
    const sec = h('section', { class: 'hoja-sec' }, HOJA_CUERPO);
    h('h4', {}, sec, titulo);
    return h('div', { class: 'ctls' }, sec);
  }
  const det = h('details', { class: 'ctls-panel' }, root);
  if (PANELES_ABIERTOS.has(clave)) det.open = true;
  const sum = h('summary', {}, det, `<span class="ctls-tit">${titulo}</span><span class="ctls-res"></span>`);
  det.addEventListener('toggle', () => { det.open ? PANELES_ABIERTOS.add(clave) : PANELES_ABIERTOS.delete(clave); });
  const c = h('div', { class: 'ctls' }, det);
  c._resumen = [];
  // Con el panel cerrado se ve un resumen de lo elegido (los controles se agregan después de crear el panel)
  queueMicrotask(() => { sum.querySelector('.ctls-res').textContent = c._resumen.join(' · '); });
  return c;
}
function ctl(parent, label) {
  const g = h('div', { class: 'ctl' }, parent);
  h('span', { class: 'ctl-lbl' }, g, label);
  return g;
}

// Desplegables: como render() rehace la página, se guarda cuál quedó abierto para reabrirlo
let DD_ABIERTO = null, DD_SCROLL = 0, nDD = {};
function cerrarDesplegables() {
  document.querySelectorAll('.dd.abierto').forEach(dd => { dd.classList.remove('abierto'); dd.querySelector('.dd-menu').hidden = true; dd.querySelector('.dd-btn').setAttribute('aria-expanded', 'false'); });
  DD_ABIERTO = null;
}
function desplegable(parent, label, texto, armar) {
  texto = String(texto);
  const g = ctl(parent, label);
  const dd = h('div', { class: 'dd' }, g);
  const btn = h('button', { type: 'button', class: 'dd-btn', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', title: texto.replace(/<[^>]+>/g, '') }, dd, `<span class="dd-val">${texto}</span>`);
  const menu = h('div', { class: 'dd-menu' }, dd);
  menu.hidden = true;
  nDD[label] = (nDD[label] || 0) + 1;
  const clave = S.vista + '|' + label + '|' + nDD[label];
  const abrir = (scroll) => {
    cerrarDesplegables();
    dd.classList.add('abierto'); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    DD_ABIERTO = clave;
    if (scroll != null) menu.scrollTop = scroll;
    else { const on = menu.querySelector('.on'); if (on) menu.scrollTop = on.offsetTop - menu.clientHeight / 2; }
  };
  btn.onclick = () => { if (dd.classList.contains('abierto')) cerrarDesplegables(); else abrir(); };
  menu.addEventListener('scroll', () => { DD_SCROLL = menu.scrollTop; });
  armar(menu);
  if (DD_ABIERTO === clave) abrir(DD_SCROLL);
  if (parent._resumen) parent._resumen.push(texto.replace(/<[^>]+>/g, ''));
}
document.addEventListener('click', ev => { if (DD_ABIERTO && !ev.target.closest('.dd')) cerrarDesplegables(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && DD_ABIERTO) cerrarDesplegables(); });

// Selección única: desplegable que se cierra al elegir
function seg(parent, label, opciones, valor, onChange) {
  const actual = opciones.find(o => String(o[0]) === String(valor));
  desplegable(parent, label, actual ? actual[1] : '—', menu => {
    opciones.forEach(([v, l, deshab]) => {
      const on = String(v) === String(valor);
      const b = h('button', { type: 'button', class: 'dd-opt unica' + (on ? ' on' : ''), role: 'option', 'aria-selected': on }, menu, `<span class="dd-marca"></span><span>${l}</span>`);
      if (deshab) { b.disabled = true; b.title = deshab; }
      b.onclick = () => { DD_ABIERTO = null; onChange(v); render(); };
    });
  });
}
const selector = seg;
function selMes(parent, label, a, b, valor, onChange) {
  const ops = [];
  for (let i = b; i >= a; i--) ops.push([i, mesLargo(i)]);
  seg(parent, label, ops, valor, v => onChange(+v));
}
function numero(parent, label, valor, min, max, onChange) {
  const w = ctl(parent, label);
  const el = h('input', { type: 'number', min, max, value: valor }, w);
  el.onchange = () => { onChange(clamp(+el.value || min, min, max)); render(); };
  if (parent._resumen) parent._resumen.push(`${label}: ${valor}`);
}
// Selección múltiple: desplegable con casilleros que queda abierto mientras se marca
function chips(parent, label, items, sel, onChange, o = {}) {
  const hab = items.filter(it => !it.deshab), elegidos = hab.filter(it => sel.has(it.id));
  const texto = !elegidos.length ? 'Ninguno'
    : elegidos.length === hab.length && hab.length > 2 ? `Todos (${hab.length})`
      : elegidos.length <= 2 ? elegidos.map(it => it.label).join(', ')
        : `${elegidos.length} de ${hab.length} elegidos`;
  desplegable(parent, label, texto, menu => {
    if (o.acciones !== false) {
      const acc = h('div', { class: 'dd-acciones' }, menu);
      const todos = h('button', { type: 'button', class: 'btn-mini' }, acc, 'Todos');
      todos.onclick = () => { items.forEach(it => { if (!it.deshab) sel.add(it.id); }); onChange(sel); render(); };
      const ninguno = h('button', { type: 'button', class: 'btn-mini' }, acc, 'Ninguno');
      ninguno.onclick = () => { sel.clear(); onChange(sel); render(); };
    }
    items.forEach(it => {
      const on = sel.has(it.id) && !it.deshab;
      const fila = h('label', { class: 'dd-opt multi' + (on ? ' on' : '') + (it.deshab ? ' deshab' : ''), title: it.deshab || it.title || null }, menu);
      const cb = h('input', { type: 'checkbox' }, fila);
      cb.checked = on; cb.disabled = !!it.deshab;
      h('span', {}, fila, (it.color ? `<i class="sw" style="background:${it.color}"></i>` : '') + it.label);
      cb.onchange = () => { cb.checked ? sel.add(it.id) : sel.delete(it.id); onChange(sel); render(); };
    });
  });
}
function ctlFuente(parent, dim) {
  if (dim === 'prov') {
    seg(parent, 'Ubicación de la empresa', [['prov_trabajo', 'Donde tiene trabajadores (2015–)'], ['prov_fiscal', 'Domicilio fiscal (1996–)']], S.provFuente, v => { S.provFuente = v; });
  } else if (dim === 'sec') {
    seg(parent, 'Clasificación sectorial', [['sector_rev4', '20 secciones CIIU Rev.4 (2019–)'], ['sector_empalme', '9 grandes sectores empalmados (1996–)']], S.secClas, v => { S.secClas = v; });
  }
}

// ---------------------------------------------------------------------------
// Gráfico: leyenda dentro del SVG (así sale en la exportación)
// ---------------------------------------------------------------------------
function leyenda(svg, items, W, y0 = 0) {
  let x = 0, y = y0 + 12;
  items.forEach(it => {
    const w = 18 + anchoTexto(it.label, 12.5) + 22;
    if (x + w > W && x > 0) { x = 0; y += 22; }
    s('circle', { cx: x + 6, cy: y - 4, r: 6, fill: it.color }, svg);
    txt(svg, x + 18, y, it.label, { 'font-size': 12.5, fill: css('--ink') });
    x += w;
  });
  return items.length ? y - y0 + 16 : 0;
}
function leyendaColor(svg, x, y, w, esc, fmt, titulo) {
  const g = s('g', { transform: `translate(${x},${y})` }, svg);
  if (titulo) txt(g, 0, 10, titulo, { 'font-size': 11, fill: css('--ink2') });
  const oy = titulo ? 16 : 0, n = 48, [a, b] = esc.dom;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const v = esc.log ? Math.exp(Math.log(a) + t * (Math.log(b) - Math.log(a))) : a + t * (b - a);
    s('rect', { x: k * w / n, y: oy, width: w / n + 0.5, height: 9, fill: esc(v) }, g);
  }
  const lab = [[0, a, 'start'], [w, b, 'end']];
  if (!esc.log && a < 0 && b > 0) lab.push([w * (-a) / (b - a), 0, 'middle']);
  lab.forEach(([px, v, an]) => txt(g, px, oy + 23, fmt(v), { 'font-size': 11, fill: css('--muted'), 'text-anchor': an }));
  return oy + 30;
}

// ---------------------------------------------------------------------------
// Gráfico: panel de líneas
//   o = {x, y, w, h, titulo, series:[{id,label,color,valores,ancho,dash,tip}], xDom:[a,b],
//        xTipo:'mes'|'n', yDom, ref, metrica, bandas, etiquetasFinales, etiquetaX, marcasBase}
// ---------------------------------------------------------------------------
function rangoY(series, xa, xb) {
  let mn = Infinity, mx = -Infinity;
  series.forEach(se => { for (let i = xa; i <= xb; i++) { const v = se.valores[i]; if (v != null && isFinite(v)) { if (v < mn) mn = v; if (v > mx) mx = v; } } });
  return [mn, mx];
}
function pathSerie(vals, xs, ys, xa, xb) {
  let d = '', pen = false;
  for (let i = xa; i <= xb; i++) {
    const v = vals[i];
    if (v == null || !isFinite(v)) { pen = false; continue; }
    d += (pen ? 'L' : 'M') + xs(i).toFixed(1) + ',' + ys(v).toFixed(1);
    pen = true;
  }
  return d;
}
function panelLineas(svg, o) {
  const g = s('g', { transform: `translate(${o.x},${o.y})` }, svg);
  const tinta = css('--ink'), muted = css('--muted');
  let top = 0;
  if (o.titulo) { txt(g, 0, 15, o.titulo, { 'font-size': 13.5, 'font-weight': 700, fill: tinta }); top = 26; }
  const mL = 50, mR = o.mR != null ? o.mR : 12, mB = 22;
  const pw = o.w - mL - mR;
  const [xa, xb] = o.xDom;
  const xs = escala(xa, xb, mL, mL + pw);
  // Nombres de los gobiernos: si alguno no entra en su banda (gráficos angostos), van en filas escalonadas
  // arriba del gráfico, centrados en su banda
  const bandas = !(o.bandas && o.xTipo === 'mes') ? [] : GOB.map((gb, k) => ({ gb, k, a: Math.max(gb.b, xa), b: Math.min(gb.f, xb) })).filter(bd => bd.b > bd.a);
  const escalonar = bandas.some(bd => xs(bd.b) - xs(bd.a) <= anchoTexto(bd.gb.corto, 10) + 6);
  const top0 = top;
  if (escalonar) {
    const finFila = [];
    bandas.forEach(bd => {
      const w = anchoTexto(bd.gb.corto, 10) + 6;
      bd.cx = clamp((xs(bd.a) + xs(bd.b)) / 2, mL + w / 2, mL + pw - w / 2);
      let r = finFila.findIndex(fin => fin <= bd.cx - w / 2);
      if (r < 0 && finFila.length < 4) { r = finFila.length; finFila.push(0); }
      if (r >= 0) { finFila[r] = bd.cx + w / 2; bd.fila = r; }
    });
    top += finFila.length * 12 + 4;
  }
  const ph = o.h - top - mB;
  if (pw < 40 || ph < 30) return;
  let yDom = o.yDom;
  if (!yDom) { const [mn, mx] = rangoY(o.series, xa, xb); yDom = dominioLindo(mn, mx, 4, o.ref); }
  const ys = escala(yDom[0], yDom[1], top + ph, top);
  const tk = marcas(yDom[0], yDom[1], Math.max(2, Math.round(ph / 48)));
  const fEje = fmtEje(o.metrica, tk.step);

  // Bandas de gobierno
  bandas.forEach(({ gb, k, a, b, cx, fila }) => {
    if (k % 2 === 1) s('rect', { x: xs(a), y: top, width: xs(b) - xs(a), height: ph, fill: css('--banda') }, g);
    if (!escalonar) txt(g, (xs(a) + xs(b)) / 2, top + 11, gb.corto, { 'font-size': 10, fill: muted, 'text-anchor': 'middle' });
    else if (fila != null) txt(g, cx, top0 + 10 + fila * 12, gb.corto, { 'font-size': 10, fill: muted, 'text-anchor': 'middle' });
  });
  // Grilla y eje Y
  tk.ticks.forEach(t => {
    s('line', { x1: mL, x2: mL + pw, y1: ys(t), y2: ys(t), stroke: css('--grid'), 'stroke-width': 1 }, g);
    txt(g, mL - 7, ys(t) + 4, fEje(t), { 'font-size': 11, fill: muted, 'text-anchor': 'end' });
  });
  if (o.ref != null && o.ref >= yDom[0] && o.ref <= yDom[1]) s('line', { x1: mL, x2: mL + pw, y1: ys(o.ref), y2: ys(o.ref), stroke: css('--eje'), 'stroke-width': 1.2 }, g);

  // Eje X
  if (o.xTipo === 'mes') {
    const span = (xb - xa) / 12, cab = Math.max(1, pw / 58);
    const paso = [1, 2, 5, 10, 20].find(p => span / p <= cab) || 20;
    if (span < 2) {
      for (let i = xa; i <= xb; i++) { const m = idxYM(i)[1]; if ((m - 1) % 3 === 0) txt(g, xs(i), top + ph + 16, mesCorto(i), { 'font-size': 11, fill: muted, 'text-anchor': 'middle' }); }
    } else {
      for (let i = xa; i <= xb; i++) { const [y, m] = idxYM(i); if (m === 1 && y % paso === 0) txt(g, xs(i), top + ph + 16, y, { 'font-size': 11, fill: muted, 'text-anchor': 'middle' }); }
    }
  } else {
    const paso = [1, 3, 6, 12, 24, 48].find(p => (xb - xa) / p <= Math.max(1, pw / 70)) || 48;
    for (let k = Math.ceil(xa / paso) * paso; k <= xb; k += paso) txt(g, xs(k), top + ph + 16, k, { 'font-size': 11, fill: muted, 'text-anchor': 'middle' });
  }

  // Series (grises debajo)
  const orden = [...o.series].sort((a, b) => (a.gris ? 0 : 1) - (b.gris ? 0 : 1));
  orden.forEach(se => {
    const d = pathSerie(se.valores, xs, ys, xa, xb);
    if (d) s('path', { d, fill: 'none', stroke: se.color, 'stroke-width': se.ancho || 2, 'stroke-dasharray': se.dash || null, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  });
  (o.marcasBase || []).forEach(mb => {
    if (mb.i < xa || mb.i > xb || o.series[0].valores[mb.i] == null) return;
    s('circle', { cx: xs(mb.i), cy: ys(o.series[0].valores[mb.i]), r: 4, fill: mb.color, stroke: css('--bg-card'), 'stroke-width': 2 }, g);
  });

  // Etiquetas al final de cada serie
  if (o.etiquetasFinales) {
    const labs = [];
    o.series.filter(se => !se.gris && !se.sinEtiqueta).forEach(se => {
      let i = xb; while (i >= xa && (se.valores[i] == null || !isFinite(se.valores[i]))) i--;
      if (i < xa) return;
      labs.push({ se, i, y: ys(se.valores[i]) });
    });
    labs.sort((a, b) => a.y - b.y);
    for (let k = 1; k < labs.length; k++) if (labs[k].y - labs[k - 1].y < 13) labs[k].y = labs[k - 1].y + 13;
    labs.forEach(l => {
      s('circle', { cx: xs(l.i), cy: ys(l.se.valores[l.i]), r: 3.5, fill: l.se.color, stroke: css('--bg-card'), 'stroke-width': 1.5 }, g);
      txt(g, xs(l.i) + 7, l.y + 4, `${l.se.label} ${FMT[o.metrica](l.se.valores[l.i])}`, { 'font-size': 11, fill: css('--ink2') });
    });
  }

  // Capa de hover: línea vertical + tooltip
  const guia = s('line', { y1: top, y2: top + ph, stroke: css('--eje'), 'stroke-width': 1, 'stroke-dasharray': '3 3', visibility: 'hidden' }, g);
  const puntos = s('g', {}, g);
  const capa = s('rect', { x: mL, y: top, width: pw, height: ph, fill: 'transparent' }, g);
  tocar(capa, ev => {
    const r = capa.getBoundingClientRect();
    const i = clamp(Math.round(xs.inv(mL + (ev.clientX - r.left))), xa, xb);
    guia.setAttribute('x1', xs(i)); guia.setAttribute('x2', xs(i)); guia.setAttribute('visibility', 'visible');
    puntos.innerHTML = '';
    const filas = o.series.map(se => ({ se, v: se.valores[i] })).filter(f => f.v != null && isFinite(f.v)).sort((a, b) => b.v - a.v);
    filas.forEach(f => { if (!f.se.gris) s('circle', { cx: xs(i), cy: ys(f.v), r: 3.5, fill: f.se.color, stroke: css('--bg-card'), 'stroke-width': 1.5 }, puntos); });
    const hd = o.etiquetaX ? o.etiquetaX(i) : (o.xTipo === 'mes' ? mesLargo(i) : `Mes ${i}`);
    const lista = filas.slice(0, 16).map(f => ttFila(f.se.color, f.se.tip ? f.se.tip(i) : f.se.label, FMT[o.metrica](f.v))).join('');
    tipMostrar(ev, `<div class="tt-hd">${hd}</div>${lista || '<span class="tt-muted">Sin datos</span>'}${filas.length > 16 ? `<div class="tt-muted">y ${filas.length - 16} más</div>` : ''}`);
  });
  capa.addEventListener('mouseleave', () => { guia.setAttribute('visibility', 'hidden'); puntos.innerHTML = ''; tipOcultar(); });
}

// ---------------------------------------------------------------------------
// Gráfico: barras horizontales en paneles (como el gráfico de variaciones de la PPT)
//   o = {filas:[{id,label}], paneles:[{titulo, sub, valores:Map, marcas?:Map, ref?:{v,label}}],
//        fmt, base, escalaComun, color?(v,id), tip?(k,id)}
// ---------------------------------------------------------------------------
function barra(g, x0, x1, y, alto, fill) {
  const largo = Math.abs(x1 - x0);
  if (largo < 1) return s('rect', { x: Math.min(x0, x1) - 0.5, y, width: 1, height: alto, fill }, g);
  const r = Math.min(3, largo / 2, alto / 2), d = x1 > x0 ? 1 : -1;
  return s('path', { d: `M${x0},${y}H${x1 - d * r}Q${x1},${y} ${x1},${y + r}V${y + alto - r}Q${x1},${y + alto} ${x1 - d * r},${y + alto}H${x0}Z`, fill }, g);
}
// Gráficos angostos (celular): el nombre va arriba de cada barra y la barra usa todo el ancho
const angosto = W => esMovil() && W < 560;
// Las marcas del eje pegadas a los bordes se alinean hacia adentro para que no se corten
const anclaEje = (x, et, W) => { const m = anchoTexto(et, 11) / 2; return x - m < 0 ? 'start' : x + m > W ? 'end' : 'middle'; };
const HALO = () => ({ stroke: css('--bg-card'), 'stroke-width': 4, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
function dibujarBarrasMovil(svg, ox, oy, W, o) {
  const tinta = css('--ink'), muted = css('--muted'), halo = HALO();
  const filaH = 40, barH = 15, footH = 24;
  const maxCar = Math.floor(W / (13 * 0.56));
  const corta = l => l.length > maxCar ? l.slice(0, maxCar - 1) + '…' : l;
  const valoresPanel = p => {
    const vs = [o.base];
    o.filas.forEach(f => { const v = p.valores.get(f.id); if (v != null) vs.push(v); if (p.marcas && p.marcas.get(f.id) != null) vs.push(p.marcas.get(f.id)); });
    if (p.ref) vs.push(p.ref.v);
    return vs;
  };
  const domComun = o.escalaComun ? (t => [Math.min(...t), Math.max(...t)])((o.panelesEscala || o.paneles).flatMap(valoresPanel)) : null;
  let y0 = oy;
  o.paneles.forEach((p, k) => {
    const g = s('g', { transform: `translate(${ox},${y0})` }, svg);
    let headH = 0;
    if (!o.sinTitulo) { txt(g, 0, 15, p.titulo, { 'font-size': 13.5, 'font-weight': 700, fill: tinta }); headH = 22; }
    if (p.sub) { txt(g, 0, headH + 12, p.sub, { 'font-size': 11.5, fill: muted }); headH += 20; }
    // La línea de referencia (total país) se explica en una leyenda arriba del gráfico
    if (p.ref) {
      s('line', { x1: 0, x2: 22, y1: headH + 7, y2: headH + 7, stroke: tinta, 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, g);
      txt(g, 28, headH + 11, `${p.ref.label}: ${o.fmt(p.ref.v)}`, { 'font-size': 12, fill: tinta, 'font-weight': 700 });
      headH += 22;
    }
    headH += 6;
    const plotH = o.filas.length * filaH;

    let [mn, mx] = domComun || (t => [Math.min(...t), Math.max(...t)])(valoresPanel(p));
    const span = (mx - mn) || Math.abs(mx) || 1;
    if (mn < o.base) mn -= span * 0.22;
    if (mx > o.base) mx += span * 0.22;
    if (mn === mx) mx = mn + 1;
    const xs = escala(mn, mx, 1, W - 1);
    const tk = marcas(mn, mx, Math.max(2, Math.floor(W / 85)));
    const fEje = o.fmtEje ? o.fmtEje(tk.step) : (v => o.fmt(v));
    tk.ticks.forEach(t => {
      if (t < mn || t > mx) return;
      s('line', { x1: xs(t), x2: xs(t), y1: headH, y2: headH + plotH, stroke: css('--grid') }, g);
      txt(g, xs(t), headH + plotH + 16, fEje(t), { 'font-size': 11, fill: muted, 'text-anchor': anclaEje(xs(t), fEje(t), W) });
    });
    s('line', { x1: xs(o.base), x2: xs(o.base), y1: headH, y2: headH + plotH, stroke: css('--eje'), 'stroke-width': 1.2 }, g);
    // Primero barras y líneas; después los textos con halo, para que se lean encima de la grilla
    o.filas.forEach((f, r) => {
      const v = p.valores.get(f.id), y = headH + r * filaH + 20;
      if (v != null) barra(g, xs(o.base), xs(v), y, barH, o.color ? o.color(v, f.id) : (v >= o.base ? css('--pos') : css('--neg')));
      const m = p.marcas && p.marcas.get(f.id);
      if (m != null) s('line', { x1: xs(m), x2: xs(m), y1: y - 2, y2: y + barH + 2, stroke: tinta, 'stroke-width': 2 }, g);
    });
    if (p.ref) s('line', { x1: xs(p.ref.v), x2: xs(p.ref.v), y1: headH, y2: headH + plotH, stroke: tinta, 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, g);
    o.filas.forEach((f, r) => {
      const v = p.valores.get(f.id), yr = headH + r * filaH, y = yr + 20;
      txt(g, 0, yr + 14, corta(f.label), { 'font-size': 13, fill: tinta, ...halo });
      if (v == null) txt(g, xs(o.base) + 5, y + barH / 2 + 4, 's/d', { 'font-size': 11, fill: muted, ...halo });
      else {
        const et = o.fmt(v), anc = anchoTexto(et, 11.5), der = v >= o.base;
        let lx = xs(v) + (der ? 5 : -5), an = der ? 'start' : 'end', adentro = false;
        // Si la cifra no entra afuera de la barra, va adentro
        if (der && lx + anc > W) { lx = xs(v) - 5; an = 'end'; adentro = true; }
        if (!der && lx - anc < 0) { lx = xs(v) + 5; an = 'start'; adentro = true; }
        txt(g, lx, y + barH / 2 + 4, et, adentro ? { 'font-size': 11.5, 'font-weight': 600, fill: '#161615', 'text-anchor': an } : { 'font-size': 11.5, fill: css('--ink2'), 'text-anchor': an, ...halo });
      }
      const hit = s('rect', { x: 0, y: yr, width: W, height: filaH, fill: 'transparent' }, g);
      tocar(hit, ev => tipMostrar(ev, `<div class="tt-hd">${f.label}</div>${ttFila(null, p.titulo, o.fmt(v))}${o.tip ? o.tip(p._k ?? k, f.id) : ''}`));
      hit.addEventListener('mouseleave', tipOcultar);
    });
    y0 += headH + plotH + footH + (k < o.paneles.length - 1 ? 18 : 0);
  });
  return y0 - oy;
}
function dibujarBarras(svg, ox, oy, W, o) {
  if (angosto(W)) return dibujarBarrasMovil(svg, ox, oy, W, o);
  const tinta = css('--ink'), muted = css('--muted');
  const nP = o.paneles.length;
  const labelW = Math.min(W < 600 ? 170 : 260, 14 + Math.max(...o.filas.map(f => anchoTexto(f.label, 12.5))));
  const maxCar = Math.floor((labelW - 14) / (12.5 * 0.56));
  o.filas.forEach(f => { if (f.label.length > maxCar) f.label = f.label.slice(0, maxCar - 1) + '…'; });
  // Con línea de referencia, su etiqueta va en un renglón propio debajo del período (si no, se pisan)
  const filaH = o.filaH || 22, barH = filaH - 4, headH = o.paneles.some(p => p.ref) ? 56 : 42, footH = 24;
  const apilado = nP > 1 && (W - labelW) / nP < 210;
  const panelW = apilado ? W - labelW : (W - labelW) / nP;
  const plotH = o.filas.length * filaH;
  const bloque = headH + plotH + footH;

  const valoresPanel = p => {
    const vs = [o.base];
    o.filas.forEach(f => { const v = p.valores.get(f.id); if (v != null) vs.push(v); if (p.marcas && p.marcas.get(f.id) != null) vs.push(p.marcas.get(f.id)); });
    if (p.ref) vs.push(p.ref.v);
    return vs;
  };
  let domComun = null;
  if (o.escalaComun) { const t = o.paneles.flatMap(valoresPanel); domComun = [Math.min(...t), Math.max(...t)]; }

  o.paneles.forEach((p, k) => {
    const px = ox + labelW + (apilado ? 0 : k * panelW), py = oy + (apilado ? k * (bloque + 12) : 0);
    if (apilado || k === 0) {
      o.filas.forEach((f, r) => txt(svg, px - 10, py + headH + r * filaH + filaH / 2 + 4, f.label, { 'font-size': 12.5, fill: tinta, 'text-anchor': 'end' }));
    }
    const g = s('g', { transform: `translate(${px},${py})` }, svg);
    if (!apilado && k > 0) s('line', { x1: 0, x2: 0, y1: 6, y2: bloque - 4, stroke: css('--grid') }, g);
    txt(g, 14, 16, p.titulo, { 'font-size': 13.5, 'font-weight': 700, fill: tinta });
    if (p.sub) txt(g, 14, 32, p.sub, { 'font-size': 11, fill: muted });

    let [mn, mx] = domComun || (() => { const t = valoresPanel(p); return [Math.min(...t), Math.max(...t)]; })();
    const span = (mx - mn) || Math.abs(mx) || 1;
    if (mn < o.base) mn -= span * 0.2;
    if (mx > o.base) mx += span * 0.2;
    if (mn === mx) mx = mn + 1;
    const inner = 14, pw = panelW - inner * 2 - 6;
    const xs = escala(mn, mx, inner, inner + pw);
    const tk = marcas(mn, mx, Math.max(2, Math.floor(pw / 75)));
    const fEje = o.fmtEje ? o.fmtEje(tk.step) : (v => o.fmt(v));
    tk.ticks.forEach(t => {
      if (t < mn || t > mx) return;
      s('line', { x1: xs(t), x2: xs(t), y1: headH - 4, y2: headH + plotH, stroke: css('--grid') }, g);
      txt(g, xs(t), headH + plotH + 16, fEje(t), { 'font-size': 11, fill: muted, 'text-anchor': 'middle' });
    });
    s('line', { x1: xs(o.base), x2: xs(o.base), y1: headH - 4, y2: headH + plotH, stroke: css('--eje'), 'stroke-width': 1.2 }, g);

    o.filas.forEach((f, r) => {
      const v = p.valores.get(f.id), y = headH + r * filaH + 2;
      if (v == null) { txt(g, xs(o.base) + 5, y + barH / 2 + 4, 's/d', { 'font-size': 10.5, fill: muted }); }
      else {
        const col = o.color ? o.color(v, f.id) : (v >= o.base ? css('--pos') : css('--neg'));
        barra(g, xs(o.base), xs(v), y, barH, col);
        const etiqueta = o.fmt(v), anchoEt = anchoTexto(etiqueta, 11);
        const der = v >= o.base;
        // Si la etiqueta no entra a la izquierda de una barra negativa, va adentro de la barra
        const adentro = !der && xs(v) - 5 - anchoEt < 0;
        txt(g, xs(v) + (der || adentro ? 5 : -5), y + barH / 2 + 4, etiqueta, { 'font-size': 11, fill: adentro ? '#161615' : css('--ink2'), 'text-anchor': der || adentro ? 'start' : 'end' });
      }
      const m = p.marcas && p.marcas.get(f.id);
      if (m != null) s('line', { x1: xs(m), x2: xs(m), y1: y - 2, y2: y + barH + 2, stroke: tinta, 'stroke-width': 2 }, g);
      const hit = s('rect', { x: 0, y: y - 2, width: panelW - 6, height: filaH, fill: 'transparent' }, g);
      tocar(hit, ev => tipMostrar(ev, `<div class="tt-hd">${f.label}</div>${ttFila(null, p.titulo, o.fmt(v))}${o.tip ? o.tip(k, f.id) : ''}`));
      hit.addEventListener('mouseleave', tipOcultar);
    });
    if (p.ref) {
      const xr = xs(p.ref.v);
      s('line', { x1: xr, x2: xr, y1: headH - 4, y2: headH + plotH, stroke: tinta, 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, g);
      const lbl = `${p.ref.label} ${o.fmt(p.ref.v)}`;
      const anchoRef = anchoTexto(lbl, 10.5);
      const anc = xr > panelW * 0.6 && xr - 4 - anchoRef >= 0 ? 'end' : 'start';
      txt(g, xr + (anc === 'end' ? -4 : 4), headH - 7, lbl, { 'font-size': 10.5, fill: tinta, 'text-anchor': anc, 'font-weight': 700 });
    }
  });
  return apilado ? nP * (bloque + 12) : bloque;
}
// Pestaña elegida en cada gráfico de barras con varias comparaciones (celular)
const PESTANA_BARRAS = {};
function graficoBarras(root, o) {
  let W = Math.max(260, root.clientWidth);
  if (angosto(root.clientWidth)) {
    W = Math.max(260, root.clientWidth);
    // Con varias comparaciones se ve una por vez y se cambia con pestañas arriba del gráfico
    if (o.paneles.length > 1) {
      const clave = S.vista + '|' + o.paneles.map(p => p.titulo).join('|');
      const k = Math.min(PESTANA_BARRAS[clave] || 0, o.paneles.length - 1);
      const tabs = h('div', { class: 'pestanas', role: 'tablist' });
      root.parentNode.insertBefore(tabs, root);
      o.paneles.forEach((p, j) => {
        const b = h('button', { type: 'button', class: 'pestana' + (j === k ? ' on' : ''), role: 'tab', 'aria-selected': j === k }, tabs, p.titulo);
        b.onclick = () => { PESTANA_BARRAS[clave] = j; render(); };
      });
      o = { ...o, paneles: [{ ...o.paneles[k], _k: k }], panelesEscala: o.paneles, sinTitulo: true };
    }
  }
  const svg = nuevoSVG(root, W, 10);
  ajustarAlto(svg, dibujarBarras(svg, 0, 0, W, o));
  return svg;
}

// ---------------------------------------------------------------------------
// Gráfico: tabla de calor
//   o = {filas:[{id,label}], cols:[{id,label,sub}], valor(fila,col), fmt, centro, tip?}
// ---------------------------------------------------------------------------
function graficoCalor(root, o) {
  const Wc = Math.max(esMovil() ? 260 : 320, root.clientWidth);
  let labelW = Math.min(220, 16 + Math.max(...o.filas.map(f => anchoTexto(f.label, 12.5))));
  const colW = Math.max(o.colMin || 52, Math.min(120, (Wc - labelW) / o.cols.length));
  const W = Math.max(Wc, labelW + colW * o.cols.length);
  // En el celular, si la tabla no entra, la columna de nombres queda fija y las celdas se desplazan de costado
  const partida = esMovil() && W > Wc;
  if (partida) labelW = Math.min(labelW, Math.round(Wc * 0.38));
  const maxCar = Math.floor((labelW - 14) / (12.5 * 0.56));
  const corta = l => partida && l.length > maxCar ? l.slice(0, maxCar - 1) + '…' : l;
  const filaH = 26, headH = o.cols.some(c => c.sub) ? 40 : 26;
  const vals = [];
  o.filas.forEach(f => o.cols.forEach(c => { const v = o.valor(f, c); if (v != null && isFinite(v)) vals.push(Math.abs(v - (o.centro || 0))); }));
  vals.sort((a, b) => a - b);
  const maxAbs = vals.length ? vals[Math.floor(vals.length * 0.95)] || vals[vals.length - 1] : 1;
  const esc = escalaDiv(maxAbs || 1, o.centro || 0);
  const H = headH + o.filas.length * filaH + 50;
  let svg, svgL, ox;
  if (partida) {
    const hT = headH + o.filas.length * filaH + 4;
    const wrap = h('div', { class: 'calor-partido' }, root);
    svgL = nuevoSVG(wrap, labelW, hT);
    svg = nuevoSVG(h('div', { class: 'calor-scroll' }, wrap), colW * o.cols.length, hT);
    ox = 0;
  } else { svg = svgL = nuevoSVG(root, W, H); ox = labelW; }
  const tinta = css('--ink'), muted = css('--muted');
  const salto = colW < 34 ? 2 : 1;
  o.cols.forEach((c, j) => {
    if (j % salto) return;
    const cx = ox + j * colW + colW / 2;
    txt(svg, cx, 14, c.label, { 'font-size': 11.5, fill: tinta, 'text-anchor': 'middle', 'font-weight': 700 });
    if (c.sub) txt(svg, cx, 29, c.sub, { 'font-size': 10, fill: muted, 'text-anchor': 'middle' });
  });
  o.filas.forEach((f, r) => {
    const y = headH + r * filaH;
    txt(svgL, labelW - 10, y + filaH / 2 + 4, corta(f.label), { 'font-size': 12.5, fill: tinta, 'text-anchor': 'end' });
    o.cols.forEach((c, j) => {
      const v = o.valor(f, c), fill = esc(v);
      const rect = s('rect', { x: ox + j * colW + 1, y: y + 1, width: colW - 2, height: filaH - 2, rx: 3, fill }, svg);
      if (v != null && colW >= 46) txt(svg, ox + j * colW + colW / 2, y + filaH / 2 + 4, o.fmt(v), { 'font-size': 10.5, fill: luminancia(fill) < 0.5 ? '#FFFFFF' : '#161615', 'text-anchor': 'middle', 'pointer-events': 'none' });
      tocar(rect, ev => tipMostrar(ev, `<div class="tt-hd">${f.label}</div>${ttFila(null, c.label + (c.sub ? ' · ' + c.sub : ''), o.fmt(v))}${o.tip ? o.tip(f, c) : ''}`));
      rect.addEventListener('mouseleave', tipOcultar);
    });
  });
  if (partida) {
    const ley = nuevoSVG(root, Math.min(260, Wc), 40);
    leyendaColor(ley, 0, 8, Math.min(260, Wc), esc, o.fmt);
    h('div', { class: 'card-foot' }, root, 'Deslizá la tabla hacia el costado para ver todas las columnas.');
  } else leyendaColor(svg, labelW, headH + o.filas.length * filaH + 12, Math.min(260, W - labelW - 10), esc, o.fmt);
  return svg;
}

// ---------------------------------------------------------------------------
// Gráfico: mapa de provincias
// ---------------------------------------------------------------------------
const MAP_K = Math.cos(38 * Math.PI / 180), LON0 = -73.6, LAT0 = -21.7;
const MAP_UW = (73.6 - 53.6) * MAP_K, MAP_UH = 55.1 - 21.7;
function panelMapa(svg, o) {
  const g = s('g', { transform: `translate(${o.x},${o.y})` }, svg);
  let top = 0;
  if (o.titulo) { txt(g, o.w / 2, 15, o.titulo, { 'font-size': 13, 'font-weight': 700, fill: css('--ink'), 'text-anchor': 'middle' }); top = 22; }
  if (o.sub) { txt(g, o.w / 2, top + 12, o.sub, { 'font-size': 11, fill: css('--muted'), 'text-anchor': 'middle' }); top += 18; }
  const sc = Math.min(o.w / MAP_UW, (o.h - top) / MAP_UH);
  const ox = (o.w - MAP_UW * sc) / 2, oy = top;
  const P = (lon, lat) => (ox + (lon - LON0) * MAP_K * sc).toFixed(1) + ',' + (oy + (LAT0 - lat) * sc).toFixed(1);
  let selPath = null;
  const hover = (el, n) => {
    el.style.cursor = o.onClick ? 'pointer' : 'default';
    // Con clic la provincia se elige (y se redibuja la vista), así que el tooltip solo sigue al mouse
    const mostrar = ev => tipMostrar(ev, `<div class="tt-hd">${n}</div>${ttFila(null, o.etiqueta || '', o.fmt(o.valores.get(n)))}${o.tip ? o.tip(n) : ''}`);
    if (o.onClick) el.addEventListener('mousemove', mostrar); else tocar(el, mostrar);
    el.addEventListener('mouseleave', tipOcultar);
    if (o.onClick) el.addEventListener('click', () => o.onClick(n));
  };
  GEO.forEach(f => {
    const n = f.properties.nombre;
    const poligonos = geo => geo.type === 'Polygon' ? [geo.coordinates] : geo.type === 'MultiPolygon' ? geo.coordinates
      : geo.type === 'GeometryCollection' ? geo.geometries.flatMap(poligonos) : [];
    const polys = poligonos(f.geometry);
    if (!polys.length) return;
    let d = '';
    polys.forEach(poly => poly.forEach(ring => { d += 'M' + ring.map(c => P(c[0], c[1])).join('L') + 'Z'; }));
    const el = s('path', { d, fill: o.color(o.valores.get(n)), stroke: css('--bg-card'), 'stroke-width': 0.8, 'fill-rule': 'evenodd', 'stroke-linejoin': 'round' }, g);
    hover(el, n);
    if (n === o.sel) selPath = el;
    if (n === 'C.A.B.A.') {
      const ring = polys[0][0];
      const cx = ring.reduce((a, c) => a + c[0], 0) / ring.length, cy = ring.reduce((a, c) => a + c[1], 0) / ring.length;
      const [px, py] = P(cx, cy).split(',').map(Number);
      const c = s('circle', { cx: px, cy: py, r: Math.max(3.5, sc * 0.28), fill: o.color(o.valores.get(n)), stroke: n === o.sel ? css('--ink') : css('--ink2'), 'stroke-width': n === o.sel ? 2 : 1 }, g);
      hover(c, n);
      if (sc > 18) txt(g, px + 8, py + 3, 'CABA', { 'font-size': 10, fill: css('--ink2') });
    }
  });
  if (selPath) { selPath.setAttribute('stroke', css('--ink')); selPath.setAttribute('stroke-width', 2); g.appendChild(selPath); }
  return MAP_UH * sc + top;
}

// ---------------------------------------------------------------------------
// Vista 1: Último dato
// ---------------------------------------------------------------------------
function racha(fn, desde) {
  const s0 = Math.sign(fn(desde)); let k = 0;
  for (let i = desde; fn(i) != null && Math.sign(fn(i)) === s0; i--) k++;
  return { k, signo: s0 };
}
function vistaResumen(root) {
  const R = S.res, t = TOTAL;
  encabezado(root, '¿Qué nos dice el último dato?', `Empresas empleadoras registradas (SRT), ${mesLargo(ULT)}: <b>${fNum(t[ULT])}</b>.`, 'Último dato');

  const dm = t[ULT] - t[ULT - 1], da = t[ULT] - t[ULT - 12], dg = t[ULT] - t[GOB_ACTUAL.b];
  const rm = racha(i => i > 0 && t[i] != null && t[i - 1] != null ? t[i] - t[i - 1] : null, ULT);
  const ra = racha(i => i >= 12 && t[i - 12] != null ? t[i] - t[i - 12] : null, ULT);
  const nMeses = ULT - GOB_ACTUAL.b;
  const comparables = GOB.filter(gb => gb.id !== 'menem' && !gb.actual && gb.f - gb.b >= nMeses)
    .map(gb => ({ gb, v: pct(t[gb.b + nMeses], t[gb.b]) }));
  const vAct = pct(t[ULT], t[GOB_ACTUAL.b]);
  const puesto = 1 + comparables.filter(c => vAct < 0 ? c.v < vAct : c.v > vAct).length;
  const cls = v => v < 0 ? 'neg' : 'pos';
  const verbo = (v, sing) => v < 0 ? (sing ? 'cerraron' : 'se perdieron') : (sing ? 'se sumaron' : 'se sumaron');
  const ordinal = p => p === 1 ? '' : p + 'ª ';
  const hero = h('div', { class: 'hero' }, root);
  hero.innerHTML = `
    <div><div class="hero-num ${cls(dm)}">${fSigno(dm)}</div><div class="hero-u ${cls(dm)}">empresas en el último mes</div>
      <p>En ${MESES_L[idxYM(ULT)[1] - 1]} ${verbo(dm, 1)} ${fNum(Math.abs(dm))} empresas, una variación de ${fPct(pct(t[ULT], t[ULT - 1]))} respecto de ${MESES_L[idxYM(ULT - 1)[1] - 1]}.</p>
      <p class="racha ${cls(dm)}">${rm.k > 1 ? `Hace ${rm.k} meses consecutivos que este número ${rm.signo < 0 ? 'cae' : 'sube'}.` : `Cambio de tendencia respecto del mes anterior.`}</p></div>
    <div><div class="hero-num ${cls(da)}">${fSigno(da)}</div><div class="hero-u ${cls(da)}">empresas en el último año</div>
      <p>Respecto de ${mesLargo(ULT - 12)} ${verbo(da)} ${fNum(Math.abs(da))} empresas, una variación de ${fPct(pct(t[ULT], t[ULT - 12]))}.</p>
      <p class="racha ${cls(da)}">${ra.k > 1 ? `Se acumulan ${ra.k} ${ra.signo < 0 ? 'caídas' : 'subas'} interanuales consecutivas.` : ''}</p></div>
    <div><div class="hero-num ${cls(dg)}">${fSigno(dg)}</div><div class="hero-u ${cls(dg)}">respecto de ${mesLargo(GOB_ACTUAL.b)}</div>
      <p>Desde que asumió ${GOB_ACTUAL.nombre} ${verbo(dg)} ${fNum(Math.abs(dg))} empresas, un ${fPct(vAct)} del total.</p>
      <p class="racha ${cls(dg)}">Es la ${ordinal(puesto)}${vAct < 0 ? 'peor caída' : 'mejor suba'} en los primeros ${nMeses} meses de un gobierno (entre ${comparables.length + 1} comparables desde 1999).</p></div>`;

  const c = panelCtls(root);
  if (avz()) seg(c, 'Serie total', [['nivel', 'Nivel'], ['mm12', 'Promedio móvil 12 meses'], ['ia', 'Variación interanual']], R.modo, v => { R.modo = v; });
  seg(c, avz() ? 'Rankings' : 'Comparado con', avz() ? [['m1', 'Intermensual'], ['m12', 'Interanual'], ['gob', `Desde ${mesCorto(GOB_ACTUAL.b)}`]] : PERIODOS_SIMPLE, R.periodo, v => { R.periodo = v; });
  ayuda(root, 'Las tres tarjetas comparan el último dato con un mes anterior: el mes pasado, el mismo mes del año pasado y el mes en que asumió el gobierno actual. Debajo está la serie completa desde 1996 y el detalle por sector y por provincia. Pasá el mouse por los gráficos para ver los números.');

  const modo = avz() ? R.modo : 'nivel';
  const metr = modo === 'ia' ? 'ia' : 'nivel';
  const valores = modo === 'ia' ? t.map((v, i) => i >= 12 ? pct(v, t[i - 12]) : null) : modo === 'mm12' ? mm12(t) : t;
  const body = tarjeta(root, {
    titulo: 'Evolución de la cantidad de empresas, 1996–' + idxYM(ULT)[0],
    subtitulo: modo === 'ia' ? 'Variación interanual (%)' : modo === 'mm12' ? 'Promedio móvil de 12 meses' : 'Cantidad de empresas empleadoras',
    nota: 'Las bandas marcan los períodos de gobierno. *Menem II: la serie comienza en jul-96.',
    nombre: 'serie_total', csv: () => [['fecha', 'valor'], ...valores.map((v, i) => [mesCorto(i), v])]
  });
  const W = Math.max(260, body.clientWidth);
  const svg = nuevoSVG(body, W, 330);
  panelLineas(svg, { x: 0, y: 0, w: W, h: 330, series: [{ id: 't', label: 'Total', color: css('--verde'), valores, ancho: 2 }], xDom: [0, ULT], xTipo: 'mes', metrica: metr, ref: REF[metr], bandas: true });

  const grid = h('div', { class: 'grid2' }, root);
  const sp = { tipo: R.periodo };
  // Primero se crean las dos tarjetas (para que la grilla ya tenga su ancho final) y después se dibuja
  const pendientes = [];
  [['sec', G.sector_rev4, 'sectores'], ['prov', G.prov_trabajo, 'provincias']].forEach(([dim, g, nom]) => {
    const valoresP = new Map(g.nombres.map(n => [n, valorPeriodo(g.series.get(n), sp, ULT, 'pct')]));
    const filas = g.nombres.map(n => ({ id: n, label: g.corto(n) })).sort((a, b) => valoresP.get(b.id) - valoresP.get(a.id));
    const b = tarjeta(grid, {
      titulo: `Variación ${etiquetaPeriodo(sp, ULT).toLowerCase()} por ${nom}`, subtitulo: rangoPeriodo(sp, ULT),
      nota: g.nota, nombre: 'ranking_' + nom, csv: () => [[nom, 'variacion_pct'], ...filas.map(f => [f.label, valoresP.get(f.id)])]
    });
    pendientes.push(() => graficoBarras(b, {
      filas, fmt: fPct, base: 0,
      paneles: [{ titulo: etiquetaPeriodo(sp, ULT), valores: valoresP, ref: { v: valorPeriodo(TOTAL, sp, ULT, 'pct'), label: 'Total país' } }],
      tip: (k, id) => { const arr = g.series.get(id), r = refIdx(sp, ULT); return `<div class="tt-muted">${fNum(arr[r])} → ${fNum(arr[ULT])} empresas</div>`; }
    }));
  });
  pendientes.forEach(f => f());
}

// ---------------------------------------------------------------------------
// Vista 2: Variaciones (barras horizontales, períodos de referencia móviles)
// ---------------------------------------------------------------------------
const PERIODOS = [['m1', 'Intermensual'], ['m12', 'Interanual'], ['n', 'Últimos N meses'], ['prom12', 'Prom. 12 m vs. 12 m previos'], ['gob', 'Desde el inicio del gobierno'], ['fecha', 'Desde un mes fijo']];
const METRICAS_BARRA = [['pct', 'Variación %'], ['abs', 'Variación absoluta'], ['idx', 'Base 100'], ['nivel', 'Nivel']];
function vistaVariaciones(root, V = S.var, fijo = false) {
  const simple = !avz() && !fijo;
  if (simple) V = { dim: S.simple.dim, fin: ULT, periodos: [S.simple.periodo], n: 12, fecha: ymIdx('2023-11'), metrica: 'pct', orden: 'primero', escala: 'panel', total: true };
  const g = grupoDim(V.dim), REFS = referencia(V.dim);
  const fin = clamp(V.fin, g.i0 + 1, g.i1); // sin guardar: si se vuelve a una serie más larga se recupera el mes elegido
  const fecha = clamp(V.fecha, g.i0, fin - 1);
  if (!fijo) encabezado(root, V.dim === 'prov' ? '¿Cómo cambió la cantidad de empresas en cada provincia?' : '¿Cómo cambió la cantidad de empresas en cada sector?',
    simple ? `Cuánto cambió la cantidad de empresas en cada ${V.dim === 'prov' ? 'provincia' : 'sector'} entre ${mesLargo(refIdx({ tipo: S.simple.periodo }, fin))} y ${mesLargo(fin)}.`
      : `Variaciones respecto de períodos de referencia <b>móviles</b>: todo se calcula contra el mes final elegido (${mesLargo(fin)}). Si cambiás el mes final, las referencias se desplazan con él.`, 'Variaciones');

  const c = panelCtls(root);
if (simple) {
    seg(c, 'Ver por', [['sec', 'Sectores'], ['prov', 'Provincias']], V.dim, v => { S.simple.dim = v; });
    seg(c, 'Comparado con', PERIODOS_SIMPLE, S.simple.periodo, v => { S.simple.periodo = v; });
  } else {
    if (!fijo) seg(c, 'Apertura', [['sec', 'Sectores'], ['prov', 'Provincias']], V.dim, v => { V.dim = v; });
    ctlFuente(c, V.dim);
    selMes(c, 'Mes final', g.i0 + 1, g.i1, fin, v => { V.fin = v; });
    const selP = new Set(V.periodos);
    chips(c, 'Comparaciones (un panel cada una)', PERIODOS.map(([id, label]) => ({ id, label })), selP, st => { V.periodos = PERIODOS.map(p => p[0]).filter(id => st.has(id)); }, { acciones: false });
    if (V.periodos.includes('n')) numero(c, 'N meses', V.n, 1, 120, v => { V.n = v; });
    if (V.periodos.includes('fecha')) selMes(c, 'Mes fijo', g.i0, fin - 1, fecha, v => { V.fecha = v; });
    seg(c, 'Métrica', METRICAS_BARRA, V.metrica, v => { V.metrica = v; });
    seg(c, 'Orden', [['primero', 'Por valor (1er panel)'], ['tamano', 'Por cantidad'], ['alfa', 'Alfabético']], V.orden, v => { V.orden = v; });
    seg(c, 'Escala', [['panel', 'Propia por panel'], ['comun', 'Común']], V.escala, v => { V.escala = v; });
    seg(c, REFS.label, [[true, 'Mostrar'], [false, 'Ocultar']], V.total, v => { V.total = v; });
  }


  ayuda(root, 'Cada barra es un sector o una provincia. Verde y hacia la derecha si ganó empresas, rosa y hacia la izquierda si perdió. La línea punteada marca el total del país, para ver quiénes están mejor y peor que el promedio.');
  const specs = V.periodos.map(tipo => ({ tipo, n: V.n, fecha }));
  if (!specs.length) return vacio(root, 'Elegí al menos una comparación.');
  const paneles = specs.map(sp => {
    const valores = new Map(), marcasN = V.metrica === 'nivel' ? new Map() : null;
    g.nombres.forEach(n => {
      const arr = g.series.get(n);
      valores.set(n, valorPeriodo(arr, sp, fin, V.metrica));
      if (marcasN) marcasN.set(n, sp.tipo === 'prom12' ? prom(arr, fin - 23, fin - 12) : arr[refIdx(sp, fin)]);
    });
    const tv = V.total && V.metrica !== 'nivel' && V.metrica !== 'abs' ? valorPeriodo(REFS.arr, sp, fin, V.metrica) : null;
    return { titulo: etiquetaPeriodo(sp, fin), sub: rangoPeriodo(sp, fin), valores, marcas: marcasN, ref: tv != null ? { v: tv, label: REFS.label } : null };
  });
  const filas = g.nombres.map(n => ({ id: n, label: g.corto(n) }));
  if (V.orden === 'primero') filas.sort((a, b) => (paneles[0].valores.get(b.id) ?? -Infinity) - (paneles[0].valores.get(a.id) ?? -Infinity));
  else if (V.orden === 'tamano') filas.sort((a, b) => (g.series.get(b.id)[fin] || 0) - (g.series.get(a.id)[fin] || 0));
  else filas.sort((a, b) => a.label.localeCompare(b.label, 'es'));

  const nomMetrica = METRICAS_BARRA.find(m => m[0] === V.metrica)[1];
  const body = tarjeta(root, {
    titulo: `${nomMetrica} de la cantidad de empresas por ${V.dim === 'prov' ? 'provincia' : V.dim === 'rama' ? 'rama' : 'sector'}`,
    subtitulo: `Mes final: ${mesLargo(fin)}` + (V.metrica === 'idx' ? ' · Base 100 = mes de referencia de cada panel' : ''),
    nota: g.nota + (V.metrica === 'nivel' ? ' La marca vertical indica el nivel en el mes de referencia.' : '') + (V.dim === 'prov' && S.provFuente === 'prov_trabajo' ? ' La línea de total país es el total nacional (no la suma de provincias).' : ''),
    nombre: `variaciones_${g.key}_${mesCorto(fin)}`,
    csv: () => [[V.dim === 'prov' ? 'provincia' : V.dim === 'rama' ? 'rama' : 'sector', ...paneles.map(p => `${p.titulo} (${p.sub})`)], ...filas.map(f => [f.label, ...paneles.map(p => p.valores.get(f.id))]), ...(V.total ? [[REFS.label, ...specs.map(sp => valorPeriodo(REFS.arr, sp, fin, V.metrica))]] : [])]
  });
  graficoBarras(body, {
    filas, paneles, fmt: FMT[V.metrica], base: V.metrica === 'idx' ? 100 : 0, escalaComun: V.escala === 'comun',
    fmtEje: step => fmtEje(V.metrica === 'abs' ? 'nivel' : V.metrica, step),
    color: V.metrica === 'nivel' ? () => css('--verde') : null,
    tip: (k, id) => {
      const arr = g.series.get(id), sp = specs[k];
      if (sp.tipo === 'prom12') return `<div class="tt-muted">Prom.: ${fNum(prom(arr, fin - 23, fin - 12))} → ${fNum(prom(arr, fin - 11, fin))}</div>`;
      const r = refIdx(sp, fin);
      return `<div class="tt-muted">${mesCorto(r)}: ${fNum(arr[r])} · ${mesCorto(fin)}: ${fNum(arr[fin])}</div>`;
    }
  });
}

// ---------------------------------------------------------------------------
// Vista 3: Por gobierno (base 100 = mes anterior a la asunción)
// ---------------------------------------------------------------------------
const METRICAS_GOB = [['idx', 'Base 100'], ['pct', 'Var. % acumulada'], ['abs', 'Var. absoluta'], ['nivel', 'Nivel']];
function vistaGobiernos(root, V = S.gob, fijo = false, opc = {}) {
  const simple = !avz() && !fijo;
  if (simple) {
    const [tipo, nom] = S.simple.serie.split(':');
    V = { dim: tipo, sel: {}, conTotal: tipo === 'total', gobs: S.simple.gobs, horizonte: 'mandato', hN: 24, vista: 'entidad', metrica: 'idx', escala: 'libre' };
    if (tipo !== 'total') V.sel[grupoDim(tipo).key] = new Set([nom]);
  }
  const g = V.dim === 'total' ? G.total : grupoDim(V.dim), REFS = referencia(V.dim);
  if (!fijo) encabezado(root, '¿Cómo evolucionaron las empresas en cada gobierno?',
    'Base 100 = mes anterior a la asunción de cada gobierno. Las curvas se alinean por meses transcurridos desde el inicio del mandato.', 'Por gobierno');

  const mesesAct = ULT - GOB_ACTUAL.b;
  const c = panelCtls(root);
if (simple) {
    selector(c, 'Qué mirar', [['total:', 'Total del país'],
      ...G.sector_rev4.nombres.map(n => ['sec:' + n, 'Sector · ' + G.sector_rev4.corto(n)]),
      ...G.prov_trabajo.nombres.map(n => ['prov:' + n, 'Provincia · ' + n])], S.simple.serie, v => { S.simple.serie = v; });
    chips(c, 'Gobiernos', GOB.filter(gb => gb.b >= g.i0).map(gb => ({ id: gb.id, label: gb.nombre, color: colorGob(gb) })), S.simple.gobs, () => { }, { acciones: false });
  } else {
    if (!fijo) seg(c, 'Apertura', [['total', 'Total'], ['sec', 'Sectores'], ['prov', 'Provincias']], V.dim, v => { V.dim = v; });
    ctlFuente(c, V.dim);
    if (V.dim !== 'total') {
      const sel = selDe(V.sel, g, V.dim === 'rama');
      chips(c, V.dim === 'prov' ? 'Provincias' : V.dim === 'rama' ? 'Ramas' : V.dim === 'tam' ? 'Umbrales de tamaño' : 'Sectores', g.nombres.map(n => ({ id: n, label: g.corto(n), title: n })), sel, () => { }, { ancho: true });
      seg(c, 'Panel: ' + REFS.label, [[true, 'Incluir'], [false, 'No']], V.conTotal, v => { V.conTotal = v; });
    }
    chips(c, 'Gobiernos', GOB.map(gb => ({ id: gb.id, label: gb.nombre, color: colorGob(gb), deshab: gb.b < g.i0 ? `Sin datos para esta apertura antes de ${mesCorto(g.i0)}` : null })), V.gobs, () => { });
    seg(c, 'Horizonte', [['mandato', 'Mandato completo (48 meses)'], ['actual', `Igual al gobierno actual (${mesesAct} meses)`], ['custom', 'Otro']], V.horizonte, v => { V.horizonte = v; });
    if (V.horizonte === 'custom') numero(c, 'Meses', V.hN, 1, 60, v => { V.hN = v; });
    const vistasGob = [['entidad', opc.etiquetaEntidad || 'Un panel por serie'], ['gobierno', 'Un panel por gobierno'], ['barras', 'Barras al mes N'], ['calor', 'Tabla de calor'], ['nivel', 'Nivel en el tiempo']].filter(o => !opc.vistas || opc.vistas.includes(o[0]));
    if (!vistasGob.some(o => o[0] === V.vista)) V.vista = vistasGob[0][0];
    seg(c, 'Vista', vistasGob, V.vista, v => { V.vista = v; });
    if (V.vista !== 'nivel') seg(c, 'Métrica', METRICAS_GOB.map(m => [m[0], m[1], (V.vista === 'calor' && m[0] === 'nivel') ? 'No aplica en la tabla' : null]), V.metrica, v => { V.metrica = v; });
    seg(c, 'Escala', [['comun', 'Común'], ['libre', 'Libre']], V.escala, v => { V.escala = v; });
  }


  ayuda(root, 'Cada línea es un gobierno y arranca en 100 el mes anterior a que asumiera, así se comparan gobiernos con distinta cantidad de empresas. Si la línea sube, se crearon empresas; si baja, se perdieron. El eje de abajo cuenta los meses desde que asumió cada uno.');
  const H = V.horizonte === 'mandato' ? 48 : V.horizonte === 'actual' ? mesesAct : V.hN;
  const ents = [];
  if (V.dim === 'total' || V.conTotal) ents.push({ id: '__total', label: V.dim === 'total' ? 'Total de empresas' : REFS.label, arr: REFS.arr });
  if (V.dim !== 'total') { const sel = selDe(V.sel, g, V.dim === 'rama'); g.nombres.filter(n => sel.has(n)).forEach(n => ents.push({ id: n, label: g.corto(n), arr: g.series.get(n) })); }
  const gobs = GOB.filter(gb => V.gobs.has(gb.id) && gb.b >= g.i0);
  if (!ents.length || !gobs.length) return vacio(root, 'Elegí al menos una serie y un gobierno con datos disponibles.' + (V.dim === 'sec' && S.secClas === 'sector_rev4' ? ' La clasificación Rev.4 empieza en 2019: para gobiernos anteriores usá los 9 grandes sectores empalmados.' : ''));
  if (V.dim === 'sec' && S.secClas === 'sector_rev4') h('div', { class: 'aviso' }, root, simple
    ? 'El dato por sector existe desde 2019, así que este gráfico solo puede comparar a los dos últimos gobiernos.'
    : 'La clasificación CIIU Rev.4 empieza en enero de 2019, por lo que solo permite comparar a Fernández y Milei. Para comparar con gobiernos anteriores elegí “9 grandes sectores empalmados”.');
  if (V.dim === 'prov' && S.provFuente === 'prov_trabajo') h('div', { class: 'aviso' }, root, simple
    ? 'El dato por provincia existe desde 2015, así que este gráfico arranca en el gobierno de Macri.'
    : 'La serie por ubicación de los trabajadores empieza en 2015 (desde Macri). Para gobiernos anteriores elegí “Domicilio fiscal”.');
  if (V.dim === 'rama') h('div', { class: 'aviso' }, root, 'Las ramas a 2 dígitos empiezan en enero de 2019: solo permiten comparar a Fernández y Milei.');

  const metrica = (V.vista === 'calor' && V.metrica === 'nivel') ? 'pct' : V.metrica;
  const kEf = gb => Math.min(H, gb.f - gb.b);
  const curva = (arr, gb) => {
    const out = new Array(H + 1).fill(null), base = arr[gb.b];
    if (base == null) return out;
    for (let k = 0; k <= kEf(gb); k++) {
      const v = arr[gb.b + k];
      if (v == null) continue;
      out[k] = metrica === 'idx' ? v / base * 100 : metrica === 'pct' ? (v / base - 1) * 100 : metrica === 'abs' ? v - base : v;
    }
    return out;
  };
  const fmt = FMT[metrica];
  const nomM = METRICAS_GOB.find(m => m[0] === metrica)[1];
  const csvCurvas = () => {
    const filas = [['serie', 'gobierno', 'mes_desde_inicio', 'fecha', nomM]];
    ents.forEach(e => gobs.forEach(gb => curva(e.arr, gb).forEach((v, k) => { if (v != null) filas.push([e.label, gb.nombre, k, mesCorto(gb.b + k), v]); })));
    return filas;
  };
  const notaCorto = gobs.some(gb => kEf(gb) < H) ? ` Los gobiernos con menos de ${H} meses se muestran hasta su último mes disponible.` : '';
  const nota = (V.dim === 'total' ? '' : g.nota + ' ') + '*Menem II: la serie comienza en jul-96, no en la asunción.' + notaCorto;

  if (V.vista === 'entidad' || V.vista === 'gobierno') {
    const porEnt = V.vista === 'entidad';
    const body = tarjeta(root, {
      titulo: porEnt ? 'Evolución de la cantidad de empresas por gobierno' : 'Evolución de cada serie dentro de cada gobierno',
      subtitulo: `${nomM}${metrica === 'idx' ? ' = mes anterior a la asunción' : ''} · Meses desde el inicio del gobierno`,
      nota, nombre: 'gobiernos_' + V.vista, csv: csvCurvas
    });
    const W = Math.max(260, body.clientWidth);
    const svg = nuevoSVG(body, W, 10);
    const paneles = porEnt ? ents : gobs;
    const items = porEnt
      ? gobs.map(gb => ({ label: gb.nombre, color: colorGob(gb) }))
      : ents.map((e, k) => ({ label: e.label, color: k < CAT.length ? CAT[k] : css('--serie-gris') }));
    const lh = leyenda(svg, items, W);
    const n = paneles.length;
    const cols = n === 1 ? 1 : Math.max(1, Math.min(4, n, Math.floor(W / 270)));
    const cw = W / cols, alto = n === 1 ? 400 : 250;
    const seriesDe = p => porEnt
      ? gobs.map(gb => ({ id: gb.id, label: gb.corto, color: colorGob(gb), valores: curva(p.arr, gb), ancho: gb.actual ? 3.2 : 2, tip: k => `${gb.nombre} (${mesCorto(gb.b + k)})` }))
      : ents.map((e, k) => ({ id: e.id, label: e.label, color: k < CAT.length ? CAT[k] : css('--serie-gris'), gris: k >= CAT.length, valores: curva(e.arr, p), ancho: e.id === '__total' ? 2.6 : 2, tip: i => `${e.label} (${mesCorto(p.b + i)})` }));
    let yDom = null;
    if (V.escala === 'comun') {
      let mn = Infinity, mx = -Infinity;
      paneles.forEach(p => { const [a, b] = rangoY(seriesDe(p), 0, H); mn = Math.min(mn, a); mx = Math.max(mx, b); });
      yDom = dominioLindo(mn, mx, 4, REF[metrica]);
    }
    paneles.forEach((p, k) => panelLineas(svg, {
      x: (k % cols) * cw, y: lh + Math.floor(k / cols) * alto, w: cw - 16, h: alto - 14,
      titulo: porEnt ? p.label : `${p.nombre} (${mesCorto(p.b)} → ${mesCorto(p.b + kEf(p))})`,
      series: seriesDe(p), xDom: [0, H], xTipo: 'n', metrica, ref: REF[metrica], yDom,
      etiquetaX: i => `Mes ${i} desde el inicio del gobierno`, etiquetasFinales: n === 1 && W > 640, mR: n === 1 && W > 640 ? 150 : 12
    }));
    ajustarAlto(svg, lh + Math.ceil(n / cols) * alto);
  } else if (V.vista === 'barras') {
    const body = tarjeta(root, {
      titulo: `${nomM} a los ${H} meses de cada gobierno`, subtitulo: metrica === 'idx' ? 'Base 100 = mes anterior a la asunción' : 'Respecto del mes anterior a la asunción',
      nota, nombre: 'gobiernos_barras_' + H,
      csv: () => [['gobierno', 'meses', ...ents.map(e => e.label)], ...gobs.map(gb => [gb.nombre, kEf(gb), ...ents.map(e => curva(e.arr, gb)[kEf(gb)])])]
    });
    graficoBarras(body, {
      filas: gobs.map(gb => ({ id: gb.id, label: gb.nombre + (kEf(gb) < H ? ` (${kEf(gb)} m)` : '') })),
      paneles: ents.map(e => ({ titulo: e.label, valores: new Map(gobs.map(gb => [gb.id, curva(e.arr, gb)[kEf(gb)]])) })),
      fmt, base: metrica === 'idx' ? 100 : 0, escalaComun: V.escala === 'comun',
      fmtEje: step => fmtEje(metrica === 'abs' ? 'nivel' : metrica, step),
      color: metrica === 'nivel' ? () => css('--verde') : null,
      tip: (k, id) => { const gb = GOB.find(x => x.id === id), arr = ents[k].arr; return `<div class="tt-muted">${mesCorto(gb.b)}: ${fNum(arr[gb.b])} · ${mesCorto(gb.b + kEf(gb))}: ${fNum(arr[gb.b + kEf(gb)])}</div>`; }
    });
  } else if (V.vista === 'calor') {
    const body = tarjeta(root, {
      titulo: `${nomM} a los ${H} meses de cada gobierno`, subtitulo: 'Filas: series · Columnas: gobiernos',
      nota, nombre: 'gobiernos_calor_' + H,
      csv: () => [['serie', ...gobs.map(gb => gb.nombre)], ...ents.map(e => [e.label, ...gobs.map(gb => curva(e.arr, gb)[kEf(gb)])])]
    });
    graficoCalor(body, {
      filas: ents, cols: gobs.map(gb => ({ id: gb.id, label: gb.corto, sub: kEf(gb) < H ? `${kEf(gb)} meses` : `desde ${mesCorto(gb.b)}`, gb })),
      valor: (e, col) => curva(e.arr, col.gb)[kEf(col.gb)], fmt, centro: REF[metrica] || 0, colMin: 70
    });
  } else {
    const xa = Math.max(g.i0, Math.min(...gobs.map(gb => gb.b)));
    const body = tarjeta(root, {
      titulo: 'Cantidad de empresas a lo largo de los gobiernos', subtitulo: 'Nivel · Los puntos marcan el mes base de cada gobierno elegido',
      nota, nombre: 'gobiernos_nivel',
      csv: () => [['fecha', ...ents.map(e => e.label)], ...Array.from({ length: ULT - xa + 1 }, (_, j) => [mesCorto(xa + j), ...ents.map(e => e.arr[xa + j])])]
    });
    const W = Math.max(260, body.clientWidth), n = ents.length;
    const cols = n === 1 ? 1 : Math.max(1, Math.min(3, Math.floor(W / 340)));
    const cw = W / cols, alto = n === 1 ? 380 : 250;
    const svg = nuevoSVG(body, W, Math.ceil(n / cols) * alto);
    let yDom = null;
    if (V.escala === 'comun') { const [a, b] = rangoY(ents.map(e => ({ valores: e.arr })), xa, ULT); yDom = dominioLindo(a, b, 4); }
    ents.forEach((e, k) => panelLineas(svg, {
      x: (k % cols) * cw, y: Math.floor(k / cols) * alto, w: cw - 16, h: alto - 14, titulo: e.label,
      series: [{ id: e.id, label: e.label, color: css('--verde'), valores: e.arr }], xDom: [xa, ULT], xTipo: 'mes', metrica: 'nivel', yDom,
      bandas: true, marcasBase: gobs.map(gb => ({ i: gb.b, color: colorGob(gb) }))
    }));
  }
}

// ---------------------------------------------------------------------------
// Vista 4: Largo plazo
// ---------------------------------------------------------------------------
const TRANS = [['nivel', 'Nivel'], ['idx', 'Base 100'], ['ia', 'Var. interanual %'], ['part', 'Participación %']];
function vistaLargo(root, V = S.lp, fijo = false) {
  const g = grupoDim(V.dim), REFS = referencia(V.dim);
  const sel = selDe(V.sel, g, true);
  const a0 = idxYM(g.i0)[0], a1 = idxYM(g.i1)[0];
  const desde = V.desde == null ? a0 : clamp(V.desde, a0, a1), hasta = V.hasta == null ? a1 : clamp(V.hasta, desde, a1);
  const xa = Math.max(g.i0, ymIdx(`${desde}-01`)), xb = Math.min(g.i1, ymIdx(`${hasta}-12`));
  const base = V.base == null || V.base < xa || V.base > xb ? xa + (V.suav ? 11 : 0) : V.base;
  if (!fijo) encabezado(root, V.dim === 'prov' ? '¿Cómo evolucionó cada provincia en el largo plazo?' : '¿Cómo evolucionó cada sector en el largo plazo?',
    `Toda la serie disponible: ${mesLargo(g.i0)} a ${mesLargo(g.i1)}. Elegí la transformación, el período y la forma de comparar.`, 'Largo plazo');

  const c = panelCtls(root);
  if (!fijo) seg(c, 'Apertura', [['sec', 'Sectores'], ['prov', 'Provincias']], V.dim, v => { V.dim = v; V.desde = V.hasta = V.base = null; });
  ctlFuente(c, V.dim);
  chips(c, V.dim === 'prov' ? 'Provincias' : V.dim === 'rama' ? 'Ramas' : V.dim === 'tam' ? 'Umbrales de tamaño' : 'Sectores', g.nombres.map(n => ({ id: n, label: g.corto(n), title: n + (g.detalle(n) ? ' · ' + g.detalle(n) : '') })), sel, () => { }, { ancho: true });
  seg(c, 'Transformación', TRANS, V.trans, v => { V.trans = v; });
  if (V.trans === 'idx') selMes(c, 'Base 100', xa, xb, base, v => { V.base = v; });
  seg(c, 'Suavizado', [[false, 'Dato mensual'], [true, 'Promedio móvil 12 meses']], V.suav, v => { V.suav = v; });
  seg(c, 'Vista', [['multiples', 'Small multiples'], ['superpuestas', 'Superpuestas'], ['calor', 'Tabla de calor anual']], V.vista, v => { V.vista = v; });
  if (V.vista === 'multiples') seg(c, 'Escala', [['libre', 'Libre'], ['comun', 'Común']], V.escala, v => { V.escala = v; });
  const anios = []; for (let y = a1; y >= a0; y--) anios.push([y, y]);
  selector(c, 'Desde', anios, desde, v => { V.desde = +v; });
  selector(c, 'Hasta', anios, hasta, v => { V.hasta = +v; });
  if (V.vista !== 'calor') {
    if (V.trans !== 'part') seg(c, REFS.label, [[true, 'Como referencia'], [false, 'No']], V.refTotal, v => { V.refTotal = v; });
    seg(c, 'Gobiernos', [[true, 'Bandas'], [false, 'Sin bandas']], V.bandas, v => { V.bandas = v; });
  }

  const ents = g.nombres.filter(n => sel.has(n)).map(n => ({ id: n, label: g.corto(n), arr: g.series.get(n) }));
  if (!ents.length) return vacio(root, 'Elegí al menos una serie.');
  const prep = arr => V.suav ? mm12(arr) : arr;
  const suma = (() => { const out = new Array(N).fill(null); for (let i = 0; i < N; i++) { let t = 0, ok = true; g.nombres.forEach(n => { const v = g.series.get(n)[i]; if (v == null) ok = false; else t += v; }); out[i] = ok ? t : null; } return prep(out); })();
  const transformar = arr => {
    const a = prep(arr);
    switch (V.trans) {
      case 'nivel': return a;
      case 'idx': return a.map(v => v == null || a[base] == null ? null : v / a[base] * 100);
      case 'ia': return a.map((v, i) => i >= 12 ? pct(v, a[i - 12]) : null);
      case 'part': return a.map((v, i) => v == null || !suma[i] ? null : v / suma[i] * 100);
    }
  };
  const nomT = TRANS.find(t => t[0] === V.trans)[1] + (V.trans === 'idx' ? ` (${mesCorto(base)} = 100)` : '') + (V.suav ? ' · promedio móvil 12 meses' : '');
  const nota = g.nota + (V.trans === 'part' ? ' Participación sobre la suma de las series de la apertura.' : '') + (V.bandas && V.vista !== 'calor' ? ' Bandas: períodos de gobierno.' : '');
  const totalT = V.refTotal && V.trans !== 'part' ? transformar(REFS.arr) : null;
  const csvLargo = () => {
    const filas = [['fecha', ...ents.map(e => e.label), ...(totalT ? [REFS.label] : [])]];
    const tr = ents.map(e => transformar(e.arr));
    for (let i = xa; i <= xb; i++) filas.push([mesCorto(i), ...tr.map(t => t[i]), ...(totalT ? [totalT[i]] : [])]);
    return filas;
  };

  if (V.vista === 'calor') {
    const cols = [];
    for (let y = Math.max(desde, a0 + 1); y <= hasta; y++) {
      const ms = []; for (let m = 1; m <= 12; m++) { const i = ymIdx(`${y}-${String(m).padStart(2, '0')}`); if (i <= g.i1 && i - 12 >= g.i0) ms.push(i); }
      if (ms.length) cols.push({ id: y, label: String(y) + (ms.length < 12 ? '*' : ''), ms });
    }
    const valorAnual = (arr, col) => { let a = 0, b = 0; for (const i of col.ms) { if (arr[i] == null || arr[i - 12] == null) return null; a += arr[i]; b += arr[i - 12]; } return pct(a, b); };
    const filas = [...ents, { id: '__total', label: REFS.label, arr: REFS.arr }];
    const body = tarjeta(root, {
      titulo: 'Variación anual de la cantidad de empresas', subtitulo: 'Promedio del año vs. promedio del año anterior (%) · *año incompleto: mismos meses del año anterior',
      nota: g.nota, nombre: 'calor_anual_' + g.key,
      csv: () => [['serie', ...cols.map(c2 => c2.label)], ...filas.map(e => [e.label, ...cols.map(c2 => valorAnual(e.arr, c2))])]
    });
    graficoCalor(body, { filas, cols, valor: (e, col) => valorAnual(e.arr, col), fmt: fPct, centro: 0, colMin: cols.length > 18 ? 44 : 52 });
    return;
  }

  const body = tarjeta(root, { titulo: `Evolución de la cantidad de empresas por ${V.dim === 'prov' ? 'provincia' : V.dim === 'rama' ? 'rama' : 'sector'}`, subtitulo: nomT, nota, nombre: 'largo_plazo_' + g.key, csv: csvLargo });
  const W = Math.max(260, body.clientWidth);
  const colorTotal = css('--ink2');
  if (V.vista === 'superpuestas') {
    const svg = nuevoSVG(body, W, 10);
    const pocas = ents.length <= CAT.length;
    const series = ents.map((e, k) => ({ id: e.id, label: e.label, color: pocas ? CAT[k] : css('--serie-gris'), gris: !pocas, ancho: pocas ? 2 : 1.3, valores: transformar(e.arr) }));
    if (totalT) series.push({ id: '__total', label: REFS.label, color: colorTotal, valores: totalT, ancho: 2.4, dash: '5 4' });
    const lh = leyenda(svg, pocas ? series.map(se => ({ label: se.label, color: se.color })) : (totalT ? [{ label: REFS.label, color: colorTotal }] : []), W);
    const alto = 460;
    panelLineas(svg, { x: 0, y: lh, w: W, h: alto, series, xDom: [xa, xb], xTipo: 'mes', metrica: V.trans, ref: V.trans === 'idx' ? 100 : REF[V.trans], bandas: V.bandas, etiquetasFinales: pocas && W > 640, mR: pocas && W > 640 ? 170 : 12 });
    ajustarAlto(svg, lh + alto);
    if (!pocas) h('div', { class: 'card-foot' }, body, 'Con más de 8 series las líneas van en gris: pasá el mouse para ver los valores ordenados, o elegí menos series para verlas en color.');
    return;
  }
  const n = ents.length;
  const cols = Math.max(1, Math.min(4, n, Math.floor(W / 250)));
  const cw = W / cols, alto = n === 1 ? 380 : 210;
  const svg = nuevoSVG(body, W, 10);
  const lh = totalT ? leyenda(svg, [{ label: ents.length === 1 ? ents[0].label : 'Serie', color: css('--verde') }, { label: REFS.label, color: colorTotal }], W) : 0;
  const trs = ents.map(e => transformar(e.arr));
  let yDom = null;
  if (V.escala === 'comun') {
    const [a, b] = rangoY([...trs, ...(totalT ? [totalT] : [])].map(v => ({ valores: v })), xa, xb);
    yDom = dominioLindo(a, b, 4, V.trans === 'idx' ? 100 : REF[V.trans]);
  }
  ents.forEach((e, k) => {
    const series = [];
    if (totalT) series.push({ id: '__total', label: REFS.label, color: colorTotal, valores: totalT, ancho: 1.4, dash: '4 3' });
    series.push({ id: e.id, label: e.label, color: css('--verde'), valores: trs[k], ancho: 2 });
    panelLineas(svg, { x: (k % cols) * cw, y: lh + Math.floor(k / cols) * alto, w: cw - 16, h: alto - 12, titulo: e.label, series, xDom: [xa, xb], xTipo: 'mes', metrica: V.trans, ref: V.trans === 'idx' ? 100 : REF[V.trans], yDom, bandas: V.bandas && cw > 300 });
  });
  ajustarAlto(svg, lh + Math.ceil(n / cols) * alto);
}

// ---------------------------------------------------------------------------
// Vista: Por tamaño (umbrales acumulados, comparados entre gobiernos)
// ---------------------------------------------------------------------------
function vistaTamano(root) {
  if (!G.tamano) return vacio(root, 'Faltan los datos por tamaño: corré tablero/preparar_datos_tablero.R.');
  encabezado(root, '¿Cómo evolucionaron las empresas de cada tamaño en cada gobierno?',
    'Los tramos de tamaño no son compartimentos estancos: una empresa que contrata o despide cambia de tramo. Por eso se usan umbrales acumulados (“más de X trabajadores”) y, para cada umbral, se compara su evolución entre gobiernos. Base 100 = mes anterior a la asunción.', 'Por tamaño');
  vistaGobiernos(root, S.tam, true, { vistas: ['entidad', 'barras', 'calor'], etiquetaEntidad: 'Un panel por umbral' });
}

// ---------------------------------------------------------------------------
// Gráfico: cascada horizontal (los aportes se acumulan hasta el total)
//   o = {filas:[{id,label,valor,tip,tono}], total:{label,valor}, fmt, fmtEje}
//   tono: 'resto' (agrupado) | 'gris' (residuo) | undefined
// ---------------------------------------------------------------------------
function graficoCascada(root, o) {
  if (angosto(root.clientWidth)) return graficoCascadaMovil(root, o);
  const W = Math.max(260, root.clientWidth);
  const tinta = css('--ink'), muted = css('--muted');
  const filas = [...o.filas.map(f => ({ ...f })), { ...o.total, id: '__total', tono: 'total' }];
  const labelW = Math.min(W < 600 ? 150 : 250, 16 + Math.max(...filas.map(f => anchoTexto(f.label, 12.5))));
  const maxCar = Math.floor((labelW - 16) / (12.5 * 0.56));
  filas.forEach(f => { if (f.label.length > maxCar) f.label = f.label.slice(0, maxCar - 1) + '…'; });
  const filaH = 24, barH = 17, top = 6, bot = 30;
  let acum = 0;
  filas.forEach(f => {
    if (f.tono === 'total') { f.a = 0; f.b = f.valor; }
    else { f.a = acum; f.b = acum + f.valor; acum = f.b; }
  });
  const extremos = filas.flatMap(f => [f.a, f.b]);
  let mn = Math.min(0, ...extremos), mx = Math.max(0, ...extremos);
  const span = (mx - mn) || 1;
  mn -= span * 0.15; mx += span * 0.15;
  const x0 = labelW + 6, pw = W - x0 - 10;
  const xs = escala(mn, mx, x0, x0 + pw);
  const yFin = top + filas.length * filaH;
  const svg = nuevoSVG(root, W, yFin + bot);
  const tk = marcas(mn, mx, Math.max(2, Math.floor(pw / 90)));
  const fEje = o.fmtEje(tk.step);
  tk.ticks.forEach(t => {
    if (t < mn || t > mx) return;
    s('line', { x1: xs(t), x2: xs(t), y1: top, y2: yFin, stroke: css('--grid') }, svg);
    txt(svg, xs(t), yFin + 16, fEje(t), { 'font-size': 11, fill: muted, 'text-anchor': 'middle' });
  });
  s('line', { x1: xs(0), x2: xs(0), y1: top, y2: yFin, stroke: css('--eje'), 'stroke-width': 1.2 }, svg);

  filas.forEach((f, r) => {
    const y = top + r * filaH, yb = y + (filaH - barH) / 2, esTotal = f.tono === 'total';
    if (esTotal) s('line', { x1: 0, x2: W, y1: y + 0.5, y2: y + 0.5, stroke: css('--eje'), 'stroke-width': 0.8 }, svg);
    txt(svg, labelW - 8, y + filaH / 2 + 4, f.label, { 'font-size': 12.5, fill: tinta, 'text-anchor': 'end', 'font-weight': esTotal ? 700 : null });
    let color = f.valor >= 0 ? css('--pos') : css('--neg');
    if (f.tono === 'resto') color = mezclar(color, css('--neutro'), 0.45);
    if (f.tono === 'gris') color = css('--serie-gris');
    if (esTotal) color = f.valor >= 0 ? css('--pos-2') : css('--neg-2');
    const xa = xs(Math.min(f.a, f.b)), xb = xs(Math.max(f.a, f.b));
    s('rect', { x: xa, y: yb, width: Math.max(1, xb - xa), height: barH, rx: 2, fill: color }, svg);
    // Conector con la barra siguiente
    if (r < filas.length - 1) s('line', { x1: xs(f.b), x2: xs(f.b), y1: yb + barH, y2: yb + filaH, stroke: css('--eje'), 'stroke-width': 1, 'stroke-dasharray': '2 2' }, svg);
    const et = o.fmt(f.valor), anc = anchoTexto(et, 11);
    let lx, an;
    if (f.valor >= 0) { lx = xb + 5; an = 'start'; if (lx + anc > W) { lx = xa - 5; an = 'end'; } }
    else { lx = xa - 5; an = 'end'; if (lx - anc < x0) { lx = xb + 5; an = 'start'; } }
    txt(svg, lx, y + filaH / 2 + 4, et, { 'font-size': 11, fill: esTotal ? tinta : css('--ink2'), 'text-anchor': an, 'font-weight': esTotal ? 700 : null });
    const hit = s('rect', { x: 0, y, width: W, height: filaH, fill: 'transparent' }, svg);
    tocar(hit, ev => tipMostrar(ev, `<div class="tt-hd">${f.label}</div>${ttFila(null, esTotal ? 'Variación total' : 'Aporte', et)}${esTotal ? '' : ttFila(null, 'Acumulado', o.fmt(f.b))}${f.tip || ''}`));
    hit.addEventListener('mouseleave', tipOcultar);
  });
  return svg;
}
// Cascada angosta (celular): el nombre va arriba de cada barra y la barra usa todo el ancho
function graficoCascadaMovil(root, o) {
  const W = Math.max(260, root.clientWidth);
  const tinta = css('--ink'), muted = css('--muted'), halo = HALO();
  const filas = [...o.filas.map(f => ({ ...f })), { ...o.total, id: '__total', tono: 'total' }];
  const maxCar = Math.floor(W / (13 * 0.56));
  const filaH = 40, barH = 15, top = 4, bot = 30;
  let acum = 0;
  filas.forEach(f => {
    if (f.tono === 'total') { f.a = 0; f.b = f.valor; }
    else { f.a = acum; f.b = acum + f.valor; acum = f.b; }
  });
  const extremos = filas.flatMap(f => [f.a, f.b]);
  let mn = Math.min(0, ...extremos), mx = Math.max(0, ...extremos);
  const span = (mx - mn) || 1;
  mn -= span * 0.2; mx += span * 0.2;
  const xs = escala(mn, mx, 1, W - 1);
  const yFin = top + filas.length * filaH;
  const svg = nuevoSVG(root, W, yFin + bot);
  const tk = marcas(mn, mx, Math.max(2, Math.floor(W / 90)));
  const fEje = o.fmtEje(tk.step);
  tk.ticks.forEach(t => {
    if (t < mn || t > mx) return;
    s('line', { x1: xs(t), x2: xs(t), y1: top, y2: yFin, stroke: css('--grid') }, svg);
    txt(svg, xs(t), yFin + 16, fEje(t), { 'font-size': 11, fill: muted, 'text-anchor': anclaEje(xs(t), fEje(t), W) });
  });
  s('line', { x1: xs(0), x2: xs(0), y1: top, y2: yFin, stroke: css('--eje'), 'stroke-width': 1.2 }, svg);
  // Primero barras y conectores; después los textos con halo
  filas.forEach((f, r) => {
    const yb = top + r * filaH + 20, esTotal = f.tono === 'total';
    if (esTotal) s('line', { x1: 0, x2: W, y1: yb - 21.5, y2: yb - 21.5, stroke: css('--eje'), 'stroke-width': 0.8 }, svg);
    let color = f.valor >= 0 ? css('--pos') : css('--neg');
    if (f.tono === 'resto') color = mezclar(color, css('--neutro'), 0.45);
    if (f.tono === 'gris') color = css('--serie-gris');
    if (esTotal) color = f.valor >= 0 ? css('--pos-2') : css('--neg-2');
    const xa = xs(Math.min(f.a, f.b)), xb = xs(Math.max(f.a, f.b));
    s('rect', { x: xa, y: yb, width: Math.max(1, xb - xa), height: barH, rx: 2, fill: color }, svg);
    if (r < filas.length - 1) s('line', { x1: xs(f.b), x2: xs(f.b), y1: yb + barH, y2: yb + filaH, stroke: css('--eje'), 'stroke-width': 1, 'stroke-dasharray': '2 2' }, svg);
  });
  filas.forEach((f, r) => {
    const y = top + r * filaH, yb = y + 20, esTotal = f.tono === 'total';
    const label = f.label.length > maxCar ? f.label.slice(0, maxCar - 1) + '…' : f.label;
    txt(svg, 0, y + 14, label, { 'font-size': 13, fill: tinta, 'font-weight': esTotal ? 700 : null, ...halo });
    const xa = xs(Math.min(f.a, f.b)), xb = xs(Math.max(f.a, f.b));
    const et = o.fmt(f.valor), anc = anchoTexto(et, 11.5);
    let lx, an;
    if (f.valor >= 0) { lx = xb + 5; an = 'start'; if (lx + anc > W) { lx = xa - 5; an = 'end'; } }
    else { lx = xa - 5; an = 'end'; if (lx - anc < 0) { lx = xb + 5; an = 'start'; } }
    txt(svg, lx, yb + barH / 2 + 4, et, { 'font-size': 11.5, fill: esTotal ? tinta : css('--ink2'), 'text-anchor': an, 'font-weight': esTotal ? 700 : null, ...halo });
    const hit = s('rect', { x: 0, y, width: W, height: filaH, fill: 'transparent' }, svg);
    tocar(hit, ev => tipMostrar(ev, `<div class="tt-hd">${f.label}</div>${ttFila(null, esTotal ? 'Variación total' : 'Aporte', et)}${esTotal ? '' : ttFila(null, 'Acumulado', o.fmt(f.b))}${f.tip || ''}`));
    hit.addEventListener('mouseleave', tipOcultar);
  });
  return svg;
}

// ---------------------------------------------------------------------------
// Vista: Aportes (cascada por sector o provincia)
// ---------------------------------------------------------------------------
const ORDEN_CASC = [['asc', 'Mayores caídas primero'], ['desc', 'Mayores subas primero'], ['tamano', 'Por cantidad de empresas'], ['alfa', 'Alfabético']];
const RESIDUO = { sector_rev4: 'Sin datos de sector', sector_empalme: 'Sin clasificar y ajuste de empalme', prov_fiscal: 'Sin datos de jurisdicción' };
function vistaCascada(root) {
  const V = S.casc, g = grupoDim(V.dim);
  const fin = clamp(V.fin, g.i0 + 1, g.i1); // sin guardar: si se vuelve a una serie más larga se recupera el mes elegido
  const fecha = clamp(V.fecha, g.i0, fin - 1);
  const nomDim = V.dim === 'prov' ? 'provincia' : 'sector', nomDimP = V.dim === 'prov' ? 'provincias' : 'sectores';
  encabezado(root, V.dim === 'prov' ? '¿Qué provincias explican la variación de empresas?' : '¿Qué sectores explican la variación de empresas?',
    `Aporte de cada ${nomDim} a la creación o destrucción neta de empresas. Las barras se acumulan una a continuación de la otra hasta llegar a la variación total.`, 'Aportes');

  const c = panelCtls(root);
  seg(c, 'Apertura', [['sec', 'Sectores'], ['prov', 'Provincias']], V.dim, v => { V.dim = v; });
  ctlFuente(c, V.dim);
  seg(c, 'Vista', [['cascada', 'Cascada'], ['tabla', 'Aportes en cada gobierno (tabla)']], V.vista, v => { V.vista = v; });
  seg(c, 'Métrica', [['abs', 'Empresas'], ['pp', 'Puntos porcentuales de la variación total']], V.metrica, v => { V.metrica = v; });
  const gobsDisp = GOB.filter(gb => gb.b >= g.i0);
  const sp = { tipo: V.periodo, n: V.n, fecha };
  if (V.vista === 'cascada') {
    seg(c, 'Período', [...PERIODOS.map(([id, l]) => [id, l]), ['gobcompleto', 'Un gobierno completo']], V.periodo, v => { V.periodo = v; });
    if (V.periodo === 'gobcompleto') selector(c, 'Gobierno', gobsDisp.map(gb => [gb.id, `${gb.nombre} (${mesCorto(gb.b)} → ${mesCorto(gb.f)})`]), V.gob, v => { V.gob = v; });
    else selMes(c, 'Mes final', g.i0 + 1, g.i1, fin, v => { V.fin = v; });
    if (V.periodo === 'n') numero(c, 'N meses', V.n, 1, 120, v => { V.n = v; });
    if (V.periodo === 'fecha') selMes(c, 'Mes fijo', g.i0, fin - 1, fecha, v => { V.fecha = v; });
    seg(c, 'Orden', ORDEN_CASC, V.orden, v => { V.orden = v; });
    seg(c, 'Agrupar', [[0, 'Todos'], [5, 'Los 5 mayores + resto'], [10, 'Los 10 mayores + resto']], V.top, v => { V.top = v; });
  }

  // Con la ubicación de los trabajadores la suma de provincias no es el total país
  const sumaApertura = V.dim === 'prov' && S.provFuente === 'prov_trabajo';
  if (sumaApertura) h('div', { class: 'aviso' }, root, 'Con la ubicación de los trabajadores, una empresa con empleo en varias provincias cuenta en cada una: los aportes suman la variación de la <b>suma de provincias</b>, que no coincide con la del total país. Para que cierren con el total país elegí “Domicilio fiscal”.');
  const totalLabel = sumaApertura ? 'Suma de provincias' : 'Total país';

  // par(arr) -> [valor de referencia, valor final]
  const calcular = par => {
    const filas = g.nombres.map(n => { const [b, a] = par(g.series.get(n)); return { id: n, label: g.corto(n), base: b, final: a, valor: a != null && b != null ? a - b : null }; });
    if (filas.some(f => f.valor == null)) return null;
    const [tb, ta] = par(TOTAL);
    if (tb == null || ta == null) return null;
    const baseAp = filas.reduce((t, f) => t + f.base, 0), varAp = filas.reduce((t, f) => t + f.valor, 0);
    const baseTot = sumaApertura ? baseAp : tb, varTot = sumaApertura ? varAp : ta - tb;
    return { filas, baseTot, varTot, residuo: sumaApertura ? 0 : varTot - varAp, varPais: ta - tb, varPaisPct: pct(ta, tb) };
  };
  const conv = (v, r) => V.metrica === 'pp' ? v / r.baseTot * 100 : v;
  const fmt = V.metrica === 'pp' ? fPP : fSigno;
  const fmtEjeC = step => V.metrica === 'pp' ? (t => (step < 0.1 ? nf2 : step < 1 ? nf1 : nf0).format(t) + ' pp') : fmtEje('nivel', step);
  const notaPP = V.metrica === 'pp' ? ` Puntos porcentuales: variación de cada ${nomDim} sobre el total del mes de referencia; sumados dan la variación % total.` : '';

  if (V.vista === 'tabla') {
    const cols = gobsDisp.map(gb => ({ id: gb.id, label: gb.corto, sub: `${mesCorto(gb.b)} → ${mesCorto(gb.f)}`, r: calcular(arr => [arr[gb.b], arr[gb.f]]) })).filter(col => col.r);
    if (!cols.length) return vacio(root, 'No hay gobiernos con datos completos para esta apertura.');
    const hayResiduo = cols.some(col => Math.abs(col.r.residuo) >= 1);
    const filas = [...g.nombres.map(n => ({ id: n, label: g.corto(n) })), ...(hayResiduo ? [{ id: '__res', label: RESIDUO[g.key] || 'Sin datos' }] : []), { id: '__tot', label: totalLabel }];
    const bruto = (f, col) => f.id === '__tot' ? col.r.varTot : f.id === '__res' ? col.r.residuo : col.r.filas.find(x => x.id === f.id).valor;
    const body = tarjeta(root, {
      titulo: `Aporte de cada ${nomDim} a la variación de empresas en cada gobierno`,
      subtitulo: 'Del mes anterior a la asunción al último mes del mandato (o al último dato)',
      nota: g.nota + notaPP + ' *Menem II: desde jul-96.', nombre: `aportes_gobiernos_${g.key}_${V.metrica}`,
      csv: () => [[nomDim, ...cols.map(col => `${col.label} (${col.sub})`)], ...filas.map(f => [f.label, ...cols.map(col => conv(bruto(f, col), col.r))])]
    });
    graficoCalor(body, {
      filas, cols, valor: (f, col) => conv(bruto(f, col), col.r), fmt, centro: 0, colMin: 92,
      tip: (f, col) => f.id.startsWith('__') ? '' : `<div class="tt-muted">${fNum(col.r.filas.find(x => x.id === f.id).base)} → ${fNum(col.r.filas.find(x => x.id === f.id).final)} empresas</div>`
    });
    return;
  }

  let par, desc;
  if (V.periodo === 'gobcompleto') {
    const gb = gobsDisp.find(x => x.id === V.gob) || gobsDisp[gobsDisp.length - 1];
    V.gob = gb.id;
    par = arr => [arr[gb.b], arr[gb.f]];
    desc = `${gb.nombre}: ${mesCorto(gb.b)} → ${mesCorto(gb.f)}`;
  } else if (V.periodo === 'prom12') {
    par = arr => [prom(arr, fin - 23, fin - 12), prom(arr, fin - 11, fin)];
    desc = `${etiquetaPeriodo(sp, fin)} · ${rangoPeriodo(sp, fin)}`;
  } else {
    const ri = refIdx(sp, fin);
    par = arr => [ri >= 0 ? arr[ri] : null, arr[fin]];
    desc = `${etiquetaPeriodo(sp, fin)} · ${rangoPeriodo(sp, fin)}`;
  }
  const r = calcular(par);
  if (!r) return vacio(root, 'No hay datos para ese período en esta apertura: elegí un período más corto u otra clasificación.');

  const tipDe = f => `<div class="tt-muted">${fNum(f.base)} → ${fNum(f.final)} empresas (${fPct(pct(f.final, f.base))})</div>` +
    ttFila(null, 'Peso en la variación total', r.varTot ? nf1.format(f.bruto / r.varTot * 100) + '%' : '—');
  let filas = r.filas.map(f => ({ ...f, bruto: f.valor, valor: conv(f.valor, r) }));
  let resto = null;
  if (V.top > 0 && filas.length > V.top + 1) {
    const quedan = new Set([...filas].sort((a, b) => Math.abs(b.bruto) - Math.abs(a.bruto)).slice(0, V.top).map(f => f.id));
    const otros = filas.filter(f => !quedan.has(f.id));
    const suma = k => otros.reduce((t, f) => t + f[k], 0);
    resto = { id: '__resto', label: `Resto (${otros.length})`, tono: 'resto', bruto: suma('bruto'), base: suma('base'), final: suma('final') };
    resto.valor = conv(resto.bruto, r);
    resto.tip = tipDe(resto) + `<div class="tt-muted">${otros.map(f => f.label).join(', ')}</div>`;
    filas = filas.filter(f => quedan.has(f.id));
  }
  const ordenes = { asc: (a, b) => a.bruto - b.bruto, desc: (a, b) => b.bruto - a.bruto, tamano: (a, b) => b.final - a.final, alfa: (a, b) => a.label.localeCompare(b.label, 'es') };
  filas.sort(ordenes[V.orden]);
  filas.forEach(f => { f.tip = tipDe(f); });
  const extra = [];
  if (resto) extra.push(resto);
  if (Math.abs(r.residuo) >= 1) extra.push({ id: '__res', label: RESIDUO[g.key] || 'Sin datos', tono: 'gris', bruto: r.residuo, valor: conv(r.residuo, r), tip: '<div class="tt-muted">Diferencia entre el total país y la suma de la apertura</div>' });

  const body = tarjeta(root, {
    titulo: `Aporte de cada ${nomDim} a la variación de la cantidad de empresas`,
    subtitulo: `${desc} · ${totalLabel}: ${fSigno(r.varTot)} empresas (${fPct(r.varTot / r.baseTot * 100)})`,
    nota: g.nota + notaPP + (sumaApertura ? ` En el mismo período, el total país varió ${fSigno(r.varPais)} empresas (${fPct(r.varPaisPct)}).` : ''),
    nombre: `cascada_${g.key}_${V.metrica}`,
    csv: () => [[nomDim, 'empresas_referencia', 'empresas_final', 'variacion', 'aporte_pp'],
      ...r.filas.map(f => [f.label, f.base, f.final, f.valor, f.valor / r.baseTot * 100]),
      ...(Math.abs(r.residuo) >= 1 ? [[RESIDUO[g.key] || 'Sin datos', null, null, r.residuo, r.residuo / r.baseTot * 100]] : []),
      [totalLabel, r.baseTot, r.baseTot + r.varTot, r.varTot, r.varTot / r.baseTot * 100]]
  });
  graficoCascada(body, { filas: [...filas, ...extra], total: { label: totalLabel, valor: conv(r.varTot, r) }, fmt, fmtEje: fmtEjeC });
}

// ---------------------------------------------------------------------------
// Vista: Ramas a 2 dígitos (reutiliza Variaciones, Largo plazo y Por gobierno)
// ---------------------------------------------------------------------------
function vistaRamas(root) {
  const R = S.ramas, base = G.rama2;
  if (!base) return vacio(root, 'Faltan los datos de ramas: corré tablero/preparar_datos_tablero.R.');
  const secciones = [...new Set(base.nombres.map(n => base.detalle(n)))];
  if (S.ramaSec !== 'todas' && !secciones.includes(S.ramaSec)) S.ramaSec = 'Industria manufacturera';
  const g = grupoRamas();
  encabezado(root, S.ramaSec === 'Industria manufacturera' ? '¿Cómo evolucionó cada rama de la industria?' : '¿Cómo evolucionó cada rama de actividad?',
    `Divisiones de la CIIU Rev.4 a 2 dígitos, que coinciden con los 2 dígitos del CLAE. Surgen de sumar las ramas a 6 dígitos que publica la SRT; la serie va de ${mesLargo(base.i0)} a ${mesLargo(base.i1)}.`, 'Ramas a 2 dígitos');
  const c = panelCtls(root, 'Ramas a mostrar y tipo de mirada');
  const cuenta = sec => base.nombres.filter(n => base.detalle(n) === sec).length;
  selector(c, 'Sección CIIU', [['todas', `Todas las secciones (${base.nombres.length} ramas)`], ...secciones.map(sec => [sec, `${sec} (${cuenta(sec)} ramas)`])], S.ramaSec, v => { S.ramaSec = v; });
  numero(c, 'Mínimo de empresas (último mes)', S.ramaUmbral, 0, 100000, v => { S.ramaUmbral = v; });
  seg(c, 'Mirada', [['var', 'Variaciones'], ['lp', 'Evolución en el tiempo'], ['gob', 'Por gobierno']], R.mirada, v => { R.mirada = v; });
  if (!g.nombres.length) return vacio(root, 'Ninguna rama supera el mínimo de empresas elegido.');
  if (R.mirada === 'var') vistaVariaciones(root, R.var, true);
  else if (R.mirada === 'lp') vistaLargo(root, R.lp, true);
  else vistaGobiernos(root, R.gob, true);
}

// ---------------------------------------------------------------------------
// Vista 5: Mapa
// ---------------------------------------------------------------------------
function vistaMapa(root) {
  const simple = !avz();
  const V = simple ? { vista: 'mapa', metrica: 'pct', periodo: S.simple.periodo, n: 12, fecha: ymIdx('2023-11'), fin: ULT, sel: S.mapa.sel, detalle: 'idx' } : S.mapa;
  const g = grupoDim('prov');
  const fin = clamp(V.fin, g.i0 + 1, g.i1); // sin guardar: si se vuelve a una serie más larga se recupera el mes elegido
  const fecha = clamp(V.fecha, g.i0, fin - 1);
  encabezado(root, '¿Dónde se ganaron y dónde se perdieron empresas?', 'Mapa de las 24 jurisdicciones. Hacé clic en una provincia para ver su evolución.', 'Mapa');

  const c = panelCtls(root);
  if (simple) seg(c, 'Comparado con', PERIODOS_SIMPLE, S.simple.periodo, v => { S.simple.periodo = v; });
  if (!simple) ctlFuente(c, 'prov');
  if (!simple) seg(c, 'Vista', [['mapa', 'Mapa y ranking'], ['gobiernos', 'Un mapa por gobierno']], V.vista, v => { V.vista = v; });
  if (!simple && V.vista === 'mapa') {
    seg(c, 'Métrica', [['pct', 'Variación %'], ['abs', 'Variación absoluta'], ['nivel', 'Cantidad'], ['part', 'Participación %']], V.metrica, v => { V.metrica = v; });
    selMes(c, 'Mes final', g.i0 + 1, g.i1, fin, v => { V.fin = v; });
    if (V.metrica === 'pct' || V.metrica === 'abs') {
      seg(c, 'Referencia', PERIODOS.map(([id, l]) => [id, l]), V.periodo, v => { V.periodo = v; });
      if (V.periodo === 'n') numero(c, 'N meses', V.n, 1, 120, v => { V.n = v; });
      if (V.periodo === 'fecha') selMes(c, 'Mes fijo', g.i0, fin - 1, fecha, v => { V.fecha = v; });
    }
  }

  ayuda(root, 'Cuanto más intenso el color, mayor el cambio: verde donde se ganaron empresas y rosa donde se perdieron. A la derecha, el ranking de provincias. Hacé clic en una provincia para ver su evolución.');
  const tipNiveles = (n, r, f) => { const arr = g.series.get(n); return `<div class="tt-muted">${mesCorto(r)}: ${fNum(arr[r])} · ${mesCorto(f)}: ${fNum(arr[f])}</div>`; };
  const alClic = n => { S.mapa.sel = S.mapa.sel === n ? null : n; render(); };

  if (V.vista === 'gobiernos') {
    const gobs = GOB.filter(gb => gb.b >= g.i0);
    const vals = gobs.map(gb => new Map(g.nombres.map(n => [n, pct(g.series.get(n)[gb.f], g.series.get(n)[gb.b])])));
    const todos = vals.flatMap(m => [...m.values()]).filter(v => v != null).map(Math.abs).sort((a, b) => a - b);
    const esc = escalaDiv(todos[Math.floor(todos.length * 0.95)] || 1);
    const body = tarjeta(root, {
      titulo: 'Variación de la cantidad de empresas durante cada gobierno', subtitulo: 'Del mes anterior a la asunción al último mes del mandato (o al último dato)',
      nota: g.nota + ' Escala de color común (recorta en el percentil 95). *Menem II: desde jul-96.', nombre: 'mapas_gobiernos_' + g.key,
      csv: () => [['provincia', ...gobs.map(gb => `${gb.nombre} (${mesCorto(gb.b)}-${mesCorto(gb.f)})`)], ...g.nombres.map(n => [n, ...vals.map(m => m.get(n))]), ['Total país', ...gobs.map(gb => pct(TOTAL[gb.f], TOTAL[gb.b]))]]
    });
    const W = Math.max(260, body.clientWidth);
    const cols = Math.max(2, Math.min(gobs.length, Math.floor(W / 190)));
    const cw = W / cols, mapH = Math.min(520, cw * 1.95);
    const svg = nuevoSVG(body, W, 10);
    const lh = leyendaColor(svg, 0, 0, Math.min(280, W), esc, fPct, 'Variación % durante el gobierno') + 12;
    gobs.forEach((gb, k) => panelMapa(svg, {
      x: (k % cols) * cw, y: lh + Math.floor(k / cols) * (mapH + 10), w: cw - 10, h: mapH,
      titulo: gb.nombre, sub: `${mesCorto(gb.b)} → ${mesCorto(gb.f)} · Total ${fPct(pct(TOTAL[gb.f], TOTAL[gb.b]))}`,
      valores: vals[k], color: esc, fmt: fPct, etiqueta: 'Variación', tip: n => tipNiveles(n, gb.b, gb.f), onClick: alClic, sel: V.sel
    }));
    ajustarAlto(svg, lh + Math.ceil(gobs.length / cols) * (mapH + 10));
  } else {
    const sp = { tipo: V.periodo, n: V.n, fecha };
    const variacion = V.metrica === 'pct' || V.metrica === 'abs';
    const sumaFin = g.nombres.reduce((a, n) => a + (g.series.get(n)[fin] || 0), 0);
    const valores = new Map(g.nombres.map(n => {
      const arr = g.series.get(n);
      return [n, variacion ? valorPeriodo(arr, sp, fin, V.metrica) : V.metrica === 'nivel' ? arr[fin] : arr[fin] / sumaFin * 100];
    }));
    const vs = [...valores.values()].filter(v => v != null);
    let esc;
    if (variacion) { const ab = vs.map(Math.abs).sort((a, b) => a - b); esc = escalaDiv(ab[Math.floor(ab.length * 0.95)] || 1); }
    else esc = escalaSeq(Math.min(...vs), Math.max(...vs), true);
    const fmt = { pct: fPct, abs: fSigno, nivel: fNum, part: fPart }[V.metrica];
    const nomM = { pct: 'Variación %', abs: 'Variación absoluta', nivel: 'Cantidad de empresas', part: 'Participación en el total' }[V.metrica];
    const sub = variacion ? `${etiquetaPeriodo(sp, fin)} · ${rangoPeriodo(sp, fin)}` : mesLargo(fin);
    const filas = g.nombres.map(n => ({ id: n, label: n })).sort((a, b) => (valores.get(b.id) ?? -Infinity) - (valores.get(a.id) ?? -Infinity));
    const body = tarjeta(root, {
      titulo: `${nomM} por provincia`, subtitulo: sub, nota: g.nota + (variacion ? ' Escala de color simétrica, recortada en el percentil 95.' : ' Escala de color logarítmica.'),
      nombre: `mapa_${V.metrica}_${g.key}_${mesCorto(fin)}`, csv: () => [['provincia', nomM], ...filas.map(f => [f.label, valores.get(f.id)])]
    });
    const W = Math.max(260, body.clientWidth);
    const lado = W >= 760;
    const mapW = lado ? Math.min(380, W * 0.42) : W, mapH = Math.min(lado ? 760 : 620, mapW * MAP_UH / MAP_UW);
    const svg = nuevoSVG(body, W, 10);
    const hMapa = panelMapa(svg, {
      x: 0, y: 0, w: mapW, h: mapH, valores, color: esc, fmt, etiqueta: nomM, onClick: alClic, sel: V.sel,
      tip: n => variacion && V.periodo !== 'prom12' ? tipNiveles(n, refIdx(sp, fin), fin) : ''
    });
    const hLey = leyendaColor(svg, lado ? 10 : 0, hMapa + 8, Math.min(260, mapW - 20), esc, fmt, nomM);
    const bx = lado ? mapW + 24 : 0, by = lado ? 0 : hMapa + hLey + 24;
    const hBar = dibujarBarras(svg, bx, by, W - bx, {
      filas, filaH: 21, fmt, base: 0,
      paneles: [{ titulo: 'Ranking', sub, valores, ref: variacion && V.metrica === 'pct' ? { v: valorPeriodo(TOTAL, sp, fin, 'pct'), label: 'Total país' } : null }],
      color: variacion ? null : v => esc(v), fmtEje: step => fmtEje(V.metrica === 'pct' ? 'pct' : V.metrica === 'part' ? 'part' : 'nivel', step)
    });
    ajustarAlto(svg, lado ? Math.max(hMapa + hLey + 14, hBar) : by + hBar);
  }

  if (V.sel && g.series.has(V.sel)) detalleProvincia(root, g, V.sel);
}
function detalleProvincia(root, g, n) {
  const V = S.mapa, arr = g.series.get(n), det = avz() ? V.detalle : 'idx';
  const c = h('div', { class: 'ctls' }, root);
  if (avz()) seg(c, `Detalle: ${n}`, [['idx', `Base 100 = ${mesCorto(GOB_ACTUAL.b)}`], ['idx0', `Base 100 = ${mesCorto(g.i0)}`], ['ia', 'Var. interanual'], ['nivel', 'Nivel']], V.detalle, v => { V.detalle = v; });
  else h('span', { class: 'ctl-lbl' }, c, `${n} comparada con el total del país · base 100 = ${mesLargo(GOB_ACTUAL.b)}`);
  const cerrar = h('button', { type: 'button', class: 'ctl-toggle' }, c, 'Cerrar detalle');
  cerrar.onclick = () => { S.mapa.sel = null; render(); };
  const tr = a => {
    switch (det) {
      case 'idx': return a.map(v => v == null || a[GOB_ACTUAL.b] == null ? null : v / a[GOB_ACTUAL.b] * 100);
      case 'idx0': return a.map(v => v == null || a[g.i0] == null ? null : v / a[g.i0] * 100);
      case 'ia': return a.map((v, i) => i >= 12 ? pct(v, a[i - 12]) : null);
      default: return a;
    }
  };
  const metr = det.startsWith('idx') ? 'idx' : det;
  const series = [{ id: n, label: n, color: css('--verde'), valores: tr(arr), ancho: 2.4 }];
  if (det !== 'nivel') series.push({ id: 't', label: 'Total país', color: css('--ink2'), valores: tr(TOTAL), ancho: 1.5, dash: '4 3' });
  const body = tarjeta(root, {
    titulo: `${n}: evolución de la cantidad de empresas`, subtitulo: series.length > 1 ? `Comparada con el total país` : 'Nivel', nota: g.nota, nombre: 'detalle_' + n,
    csv: () => [['fecha', n, 'Total país'], ...Array.from({ length: g.i1 - g.i0 + 1 }, (_, j) => [mesCorto(g.i0 + j), series[0].valores[g.i0 + j], series[1] ? series[1].valores[g.i0 + j] : null])]
  });
  const W = Math.max(260, body.clientWidth);
  const svg = nuevoSVG(body, W, 10);
  const lh = leyenda(svg, series.map(se => ({ label: se.label, color: se.color })), W);
  panelLineas(svg, { x: 0, y: lh, w: W, h: 320, series, xDom: [g.i0, g.i1], xTipo: 'mes', metrica: metr, ref: REF[metr], bandas: true });
  ajustarAlto(svg, lh + 320);
}

// ---------------------------------------------------------------------------
// Vista 6: Metodología y datos
// ---------------------------------------------------------------------------
function vistaNotas(root) {
  encabezado(root, '¿Qué mide el Monitor?', 'De dónde salen los datos, qué se cuenta y cómo se calcula cada gráfico.', 'Metodología');
  const d = h('div', { class: 'card notas' }, root);
  const filasGob = GOB.map(gb => `<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colorGob(gb)};margin-right:6px"></i>${gb.nombre}</td><td>${mesCorto(gb.b)}</td><td>${gb.actual ? 'último dato (' + mesCorto(ULT) + ')' : mesCorto(gb.f)}</td></tr>`).join('');
  d.innerHTML = `
    <h3>Fuente</h3>
    <p>Series históricas de empleadores de la Superintendencia de Riesgos del Trabajo (SRT), elaboradas por Fundar. El último dato disponible corresponde a ${mesLargo(ULT)}.</p>
    <h3>Qué se cuenta</h3>
    <p>Las empresas con personas trabajadoras registradas: cada una se identifica por su CUIT y se cuenta en un mes si tiene contrato vigente con una aseguradora de riesgos del trabajo (ART) y al menos una persona declarada. Incluye a los empleadores del sector público, que representan alrededor del 0,9% del total.</p>
    <div class="cuenta-grid">
      <div><span class="cuenta-tit">Se cuenta</span><ul class="cuenta si">
        <li>Sociedades anónimas, SRL, cooperativas o consorcios con personal en relación de dependencia</li>
        <li>Monotributistas o autónomos con empleados</li>
        <li>Organismos públicos con personal declarado</li>
      </ul></div>
      <div><span class="cuenta-tit">No se cuenta</span><ul class="cuenta no">
        <li>Monotributistas o autónomos sin empleados</li>
        <li>Empresas registradas que no declaran personal en el mes</li>
        <li>Hogares que emplean personal de casas particulares</li>
        <li>Empleo no registrado</li>
      </ul></div>
    </div>
    <p><b>Sucursales.</b> La unidad es el CUIT: una firma con tres locales es una sola empresa, mientras que un grupo que opera con tres CUIT distintos cuenta como tres.</p>
    <h3>Cómo se mide</h3>
    <p>Los valores son la cantidad de empresas en cada mes (stock mensual), tal como los publica la fuente, con su estacionalidad. Por eso pueden aparecer meses de recomposición seguidos de caídas marcadas. Esto se nota principalmente en los meses de verano. Para comparar meses de distintos años, la variación interanual es la referencia más directa.</p>
    <h3>Modo simple y modo avanzado</h3>
    <p>El tablero abre en <b>modo simple</b>, con las pestañas principales y las opciones básicas. El interruptor “Modo avanzado”, abajo a la izquierda, suma las pestañas de aportes, tamaño, largo plazo y ramas de actividad, junto con más opciones de comparación, escalas y formas de ver cada gráfico.</p>
    <h3>Aperturas</h3>
    <p><b>Provincias, según dónde tiene trabajadores</b> (desde 2015): una empresa con personal en varias provincias se cuenta en cada una de ellas, por eso la suma de las provincias es mayor que el total del país. En el resto de las aperturas (sector, tamaño y total) esa misma empresa se cuenta una sola vez. Esta apertura refleja mejor la presencia territorial de las empresas que su domicilio legal, que suele concentrarse en la Ciudad de Buenos Aires.</p>
    <p><b>Provincias, según domicilio fiscal</b> (desde 1996): cada empresa se cuenta una sola vez, en la jurisdicción de su domicilio fiscal.</p>
    <p><b>20 secciones de actividad</b> (desde 2019): clasificación CIIU Revisión 4, según la actividad principal declarada.</p>
    <p>En todas las aperturas por actividad, cada empresa se ubica en el sector de la actividad que declara. Algunas empresas cambian su actividad declarada a lo largo del tiempo; esos cambios no siguen un patrón sistemático, por lo que el paso de empresas de un sector a otro tiende a compensarse con movimientos en sentido contrario.</p>
    <p><b>9 grandes sectores</b> (desde 1996): serie larga que une dos clasificaciones de actividad. Desde 2019 se agrupan las secciones de la CIIU Revisión 4 en las grandes divisiones de la Revisión 2 (Electricidad = D+E; Comercio = G+I; Transporte = H+J; Servicios financieros = K+L+M+N; Servicios sociales = O a U). Para los años anteriores, la serie en Revisión 2 se ajusta según la relación entre ambas clasificaciones durante 2019, el año en que se publicaron las dos. Está pensada para seguir tendencias de largo plazo.</p>
    <p><b>Ramas a 2 dígitos</b> (desde 2019): divisiones de la CIIU Revisión 4, equivalentes a los 2 primeros dígitos del Clasificador de Actividades Económicas (CLAE). La suma de todas las ramas es igual al total del país. En la pestaña de ramas, la referencia es el total de la sección elegida.</p>
    <p><b>Total del país</b>: hasta diciembre de 2018 corresponde a la clasificación CIIU Revisión 2 y desde enero de 2019 a la Revisión 4.</p>
    <h3>Aportes</h3>
    <p>El aporte de cada sector o provincia es la cantidad de empresas que ganó o perdió entre el mes de referencia y el mes final. Expresado en puntos porcentuales, es esa diferencia dividida por el total del mes de referencia. Con sectores y con provincias según domicilio fiscal, la suma de los aportes es igual a la variación del total del país; una barra aparte reúne a las empresas cuya actividad o jurisdicción no está informada. Con provincias según dónde tienen trabajadores, los aportes suman la variación de la suma de provincias, porque una empresa con personal en varias provincias se cuenta en cada una.</p>
    <h3>Tamaño</h3>
    <p>Las empresas se agrupan según la cantidad de personas trabajadoras en su nómina de cada mes. Como una empresa cambia de tramo cuando contrata o despide, se usan umbrales acumulados: “más de X trabajadores” incluye a todas las empresas que superan ese número. Así se puede comparar cómo evolucionó cada umbral en los distintos gobiernos. Una caída en la cantidad de empresas por encima de un umbral no implica necesariamente que esas empresas hayan cerrado: puede reflejar que redujeron su nómina y pasaron a un tramo menor.</p>
    <h3>Períodos de gobierno</h3>
    <p>La base de cada gobierno (igual a 100) es el mes anterior a su asunción. Para el segundo gobierno de Carlos Menem, la base es julio de 1996, primer mes de la serie.</p>
    <div style="overflow-x:auto"><table class="tabla-simple"><tr><th>Gobierno</th><th>Base (= 100)</th><th>Último mes</th></tr>${filasGob}</table></div>
    <h3>Períodos de comparación</h3>
    <p>En “Variaciones” y “Mapa” cada comparación se calcula contra el mes final elegido: el mes anterior, el mismo mes del año anterior, los últimos N meses, el promedio de los últimos 12 meses frente a los 12 previos, el inicio del gobierno de ese momento o un mes fijo.</p>
    <h3>Descarga de datos</h3>
    <p>Cada gráfico puede descargarse como imagen y con sus datos en CSV. Con el botón de abajo se descargan todas las series del tablero.</p>`;
  const b = h('div', { class: 'seg', style: 'margin-top:14px' }, d);
  const btn = h('button', { type: 'button', class: 'seg-btn on' }, b, 'Descargar todas las series (CSV)');
  btn.onclick = () => {
    const filas = [['apertura', 'serie', 'fecha', 'empresas']];
    Object.values(G).filter(gr => gr.key !== 'sector_rev2').forEach(gr => gr.nombres.forEach(n => { const arr = gr.series.get(n); for (let i = gr.i0; i <= gr.i1; i++) if (arr[i] != null) filas.push([gr.key, n, idxYM(i).join('-').replace(/-(\d)$/, '-0$1'), arr[i]]); }));
    descargarCSV(filas, 'monitor_empresas_series');
  };
}

// ---------------------------------------------------------------------------
// Navegación y render
// ---------------------------------------------------------------------------
const VISTAS = { resumen: vistaResumen, variaciones: vistaVariaciones, cascada: vistaCascada, gobiernos: vistaGobiernos, tamano: vistaTamano, largo: vistaLargo, ramas: vistaRamas, mapa: vistaMapa, notas: vistaNotas };
const CONT = document.getElementById('contenido');
let avisoAvanzadoVisto = false;
function render() {
  if (!avz() && VISTAS_AVANZADAS.includes(S.vista)) S.vista = 'resumen';
  const scroll = window.scrollY, scrollHoja = HOJA_CUERPO.scrollTop;
  tipOcultar();
  nPanel = 0; nDD = {}; nTarjeta = 0;
  CONT.innerHTML = ''; HOJA_CUERPO.innerHTML = '';
  if (!esMovil()) { abrirHoja(false); abrirMenu(false); }
  document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('on', b.dataset.vista === S.vista));
  if (esMovil() && avz() && !avisoAvanzadoVisto) {
    const av = h('div', { class: 'aviso aviso-movil' }, CONT, '<span>El modo avanzado suma gráficos y opciones pensados para pantallas grandes: en el celular algunos pueden verse apretados.</span>');
    const ok = h('button', { type: 'button' }, av, 'Entendido');
    ok.onclick = () => { avisoAvanzadoVisto = true; av.remove(); };
  }
  (VISTAS[S.vista] || vistaResumen)(CONT);
  // Sin controles (Metodología) no se muestra el botón de filtros
  document.body.classList.toggle('sin-filtros', !HOJA_CUERPO.childElementCount);
  window.scrollTo(0, scroll);
  HOJA_CUERPO.scrollTop = scrollHoja;
}
// Menú a pantalla completa y hoja de filtros (solo celulares y tablets)
function abrirMenu(abierto) { document.body.classList.toggle('menu-abierto', abierto); }
function abrirHoja(abierta) {
  HOJA.hidden = !abierta;
  document.body.classList.toggle('hoja-abierta', abierta);
  if (!abierta) cerrarDesplegables();
}
document.getElementById('btn-filtros').addEventListener('click', () => { HOJA_CUERPO.scrollTop = 0; abrirHoja(true); });
document.getElementById('hoja-cerrar').addEventListener('click', () => abrirHoja(false));
document.getElementById('hoja-ver').addEventListener('click', () => abrirHoja(false));
// En fase de captura, para ver si había un desplegable abierto antes de que Escape lo cierre
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !DD_ABIERTO) { abrirHoja(false); abrirMenu(false); } }, true);
document.querySelectorAll('.navbtn').forEach(b => b.addEventListener('click', () => {
  S.vista = b.dataset.vista;
  history.replaceState(null, '', '#' + S.vista);
  abrirMenu(false);
  render(); window.scrollTo(0, 0);
}));
const swModo = document.getElementById('sw-modo');
function aplicarModo(avanzado) {
  document.body.classList.toggle('avanzado', avanzado);
  swModo.classList.toggle('on', avanzado);
  document.querySelectorAll('.navbtn').forEach(b => {
    const t = b.querySelector('.navtxt');
    if (!b.dataset.completo) b.dataset.completo = t.textContent;
    t.textContent = avanzado ? b.dataset.completo : (b.dataset.simple || b.dataset.completo);
  });
  try { localStorage.setItem('monitor-empresas-modo', avanzado ? 'avanzado' : 'simple'); } catch (e) { }
}
swModo.addEventListener('click', ev => { ev.preventDefault(); aplicarModo(!avz()); render(); window.scrollTo(0, 0); });

const swTema = document.getElementById('sw-tema');
function aplicarTema(oscuro) {
  document.body.classList.toggle('oscuro', oscuro);
  swTema.classList.toggle('on', oscuro);
  try { localStorage.setItem('monitor-empresas-tema', oscuro ? 'oscuro' : 'claro'); } catch (e) { }
}
swTema.addEventListener('click', ev => { ev.preventDefault(); aplicarTema(!document.body.classList.contains('oscuro')); render(); });
// Barra lateral plegable
function aplicarNav(cerrada) {
  document.body.classList.toggle('nav-cerrado', cerrada);
  try { localStorage.setItem('monitor-empresas-nav', cerrada ? 'cerrada' : 'abierta'); } catch (e) { }
}
// En el celular estos botones abren y cierran el menú a pantalla completa, sin tocar la preferencia de escritorio
document.getElementById('btn-cerrar-nav').addEventListener('click', () => { if (esMovil()) return abrirMenu(false); aplicarNav(true); render(); });
document.getElementById('btn-abrir-nav').addEventListener('click', () => { if (esMovil()) return abrirMenu(true); aplicarNav(false); render(); });
let anchoPrevio = innerWidth, tResize;
addEventListener('resize', () => { clearTimeout(tResize); tResize = setTimeout(() => { if (innerWidth !== anchoPrevio) { anchoPrevio = innerWidth; render(); } }, 150); });

document.getElementById('ultimo-dato').textContent = 'Último dato: ' + mesLargo(ULT);
try { aplicarTema(localStorage.getItem('monitor-empresas-tema') === 'oscuro'); } catch (e) { }
try { aplicarNav(localStorage.getItem('monitor-empresas-nav') === 'cerrada'); } catch (e) { }
let modoGuardado = 'simple';
try { modoGuardado = localStorage.getItem('monitor-empresas-modo') || 'simple'; } catch (e) { }
aplicarModo(modoGuardado === 'avanzado');
const hash = location.hash.replace('#', '');
if (VISTAS[hash]) S.vista = hash;
render();

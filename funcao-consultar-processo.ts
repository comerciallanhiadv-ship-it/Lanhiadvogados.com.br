// Lanhi Advogados — função consultar-processo (v2)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const URL_SB = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DATAJUD_KEY = (Deno.env.get('DATAJUD_API_KEY') ||
  'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==').replace(/^APIKey\s+/i, '').trim();
const OABS = [/\b30\.?297\b/, /\b37\.?550\b/];
const LIMITE_HORA = 20;          // consultas novas por cliente por hora
const ATUALIZA_HORAS = 6;        // intervalo mínimo entre atualizações de um processo

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-region',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const resp = (o: unknown) => new Response(JSON.stringify(o), { headers: { ...CORS, 'Content-Type': 'application/json' } });

const UF: Record<number, string> = { 1:'ac',2:'al',3:'ap',4:'am',5:'ba',6:'ce',7:'dft',8:'es',9:'go',10:'ma',11:'mt',12:'ms',13:'mg',14:'pa',15:'pb',16:'pr',17:'pe',18:'pi',19:'rj',20:'rn',21:'rs',22:'ro',23:'rr',24:'sc',25:'se',26:'sp',27:'to' };
function aliasTribunal(cnj: string): string | null {
  const j = Number(cnj[13]), tr = Number(cnj.slice(14, 16));
  if (j === 8 && UF[tr]) return 'tj' + UF[tr];
  if (j === 4 && tr >= 1 && tr <= 6) return 'trf' + tr;
  if (j === 5 && tr >= 1 && tr <= 24) return 'trt' + tr;
  return null;
}
function cnjValido(cnj: string) {
  if (!/^\d{20}$/.test(cnj)) return false;
  const r = BigInt(cnj.slice(0, 7) + cnj.slice(9) + '00') % 97n;
  return String(98n - r).padStart(2, '0') === cnj.slice(7, 9);
}
const mascara = (d: string) => `${d.slice(0,7)}-${d.slice(7,9)}.${d.slice(9,13)}.${d[13]}.${d.slice(14,16)}.${d.slice(16)}`;
const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const LIGA = new Set(['DA', 'DE', 'DO', 'DAS', 'DOS', 'E']);

async function comTempo(url: string, init: RequestInit = {}, ms = 15000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...init, signal: c.signal }); } finally { clearTimeout(t); }
}

async function djen(numero: string): Promise<any[]> {
  const itens: any[] = [];
  for (const formato of [numero, mascara(numero)]) {
    const u = new URL('https://comunicaapi.pje.jus.br/api/v1/comunicacao');
    u.searchParams.set('numeroProcesso', formato);
    u.searchParams.set('itensPorPagina', '100');
    u.searchParams.set('pagina', '1');
    const r = await comTempo(u.toString(), { headers: { Accept: 'application/json' } });
    if (r.status === 429) throw new Error('djen-limite');
    if (!r.ok) throw new Error('djen-' + r.status);
    const j = await r.json();
    const lista = j?.items || j?.itens || j?.data || [];
    if (Array.isArray(lista) && lista.length) { itens.push(...lista); break; }
  }
  return itens;
}
async function djenPorNome(nome: string): Promise<any[]> {
  const itens: any[] = [];
  const hoje = new Date(); const ini = new Date(Date.now() - 3 * 365 * 864e5);
  const d = (x: Date) => x.toISOString().slice(0, 10);
  let falhas = 0;
  for (const oab of ['30297', '37550']) {
    for (const comData of [true, false]) {
      const u = new URL('https://comunicaapi.pje.jus.br/api/v1/comunicacao');
      u.searchParams.set('nomeParte', nome);
      u.searchParams.set('numeroOab', oab);
      u.searchParams.set('ufOab', 'SC');
      u.searchParams.set('itensPorPagina', '100');
      u.searchParams.set('pagina', '1');
      if (comData) { u.searchParams.set('dataDisponibilizacaoInicio', d(ini)); u.searchParams.set('dataDisponibilizacaoFim', d(hoje)); }
      const r = await comTempo(u.toString(), { headers: { Accept: 'application/json' } }).catch(() => null);
      if (!r || !r.ok) { if (!comData) falhas++; continue; }
      const j = await r.json().catch(() => ({}));
      const lista = j?.items || j?.itens || j?.data || [];
      if (Array.isArray(lista)) itens.push(...lista);
      break;
    }
  }
  if (falhas === 2) throw new Error('djen');
  return itens;
}
const numeroDoItem = (p: any) => String(p?.numero_processo || p?.numeroProcesso || p?.numeroprocessocommascara || '').replace(/\D/g, '');

function temNossaOab(item: any) {
  const t = JSON.stringify(item?.destinatarioadvogados ?? item?.advogados ?? item);
  return OABS.some((re) => re.test(t));
}
function nomeConfere(nomeCliente: string, item: any) {
  const alvo = norm(nomeCliente);
  const partes: string[] = [];
  for (const d of item?.destinatarios || item?.partes || []) partes.push(norm(d?.nome ?? d));
  const texto = norm(item?.texto);
  if (partes.some((p) => p === alvo) || (alvo.length > 8 && (partes.some((p) => p.includes(alvo)) || texto.includes(alvo)))) return true;
  const tk = alvo.split(' ').filter((x) => !LIGA.has(x));
  if (tk.length < 2) return false;
  const [pri, ult] = [tk[0], tk[tk.length - 1]];
  return partes.some((p) => { const q = p.split(' ').filter((x) => !LIGA.has(x)); return q[0] === pri && q[q.length - 1] === ult; });
}

async function sha1(s: string) {
  const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function complementos(m: any) {
  const c = m.complementosTabelados || m.complementos || [];
  if (!Array.isArray(c)) return null;
  const t = c.map((x: any) => [x.nome, x.descricao, x.valor].filter(Boolean).join(': ')).filter(Boolean).join(' · ');
  return t || null;
}
async function datajud(numero: string): Promise<any[] | null> {
  const alias = aliasTribunal(numero);
  if (!alias) return null;
  const r = await comTempo(`https://api-publica.datajud.cnj.jus.br/api_publica_${alias}/_search`, {
    method: 'POST',
    headers: { Authorization: `APIKey ${DATAJUD_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ size: 10, query: { match: { numeroProcesso: numero } } }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.hits?.hits || [];
}

async function atualizar(adm: any, procId: string, numero: string, pubs: any[] | null) {
  const hits = await datajud(numero).catch(() => null);
  const linhas = new Map<string, any>();
  const capa: Record<string, string | null> = {};
  if (hits && hits.length) {
    const src = (hits.find((h: any) => h._source?.grau === 'G1') || hits[0])._source || {};
    capa.classe = src.classe?.nome || null; capa.orgao_julgador = src.orgaoJulgador?.nome || null; capa.tribunal = src.tribunal || null;
    for (const h of hits) {
      const s = h._source || {}; const grau = s.grau || null;
      for (const m of s.movimentos || []) {
        if (!m?.dataHora || !m?.nome) continue;
        const dt = new Date(m.dataHora); if (isNaN(dt.getTime())) continue;
        const comp = complementos(m);
        const hash = await sha1([grau, m.dataHora, m.codigo, m.nome, comp].join('|'));
        linhas.set(hash, { processo_id: procId, data_hora: dt.toISOString(), codigo: Number.isInteger(m.codigo) ? m.codigo : null,
          nome: String(m.nome).slice(0, 500), complemento: comp ? comp.slice(0, 1000) : null, grau, hash });
      }
    }
  } else if (pubs && pubs.length) {
    for (const p of pubs) {
      const data = p.data_disponibilizacao || p.dataDisponibilizacao || p.datadisponibilizacao;
      const dt = new Date(data); if (!data || isNaN(dt.getTime())) continue;
      const tipo = p.tipoDocumento || p.tipo_documento || p.tipoComunicacao || 'comunicação';
      const hash = 'djen:' + (p.id ?? p.hash ?? (await sha1(JSON.stringify(p))));
      linhas.set(hash, { processo_id: procId, data_hora: dt.toISOString(), codigo: null,
        nome: ('Publicação oficial: ' + tipo).slice(0, 500), complemento: null, grau: null, hash });
      if (!capa.orgao_julgador && (p.nomeOrgao || p.nome_orgao)) capa.orgao_julgador = p.nomeOrgao || p.nome_orgao;
      if (!capa.classe && (p.nomeClasse || p.nome_classe)) capa.classe = p.nomeClasse || p.nome_classe;
      if (!capa.tribunal && (p.siglaTribunal || p.sigla_tribunal)) capa.tribunal = p.siglaTribunal || p.sigla_tribunal;
    }
  }
  let novas = 0, antes = 0;
  if (linhas.size) {
    const { data: existentes } = await adm.from('movimentacoes').select('hash').eq('processo_id', procId);
    const ja = new Set((existentes || []).map((x: any) => x.hash));
    antes = ja.size;
    const inserir = [...linhas.values()].filter((l) => !ja.has(l.hash));
    if (inserir.length) {
      const { error } = await adm.from('movimentacoes').insert(inserir);
      if (!error) novas = inserir.length;
    }
  }
  const upd: Record<string, unknown> = { ultima_sincronizacao: new Date().toISOString(), ...Object.fromEntries(Object.entries(capa).filter(([, v]) => v)) };
  if (novas && antes) upd.ultima_novidade = new Date().toISOString();
  upd.ultimo_erro = hits === null && !linhas.size ? 'DataJud indisponível' : (hits && !hits.length && !linhas.size ? 'Processo não encontrado na base pública (pode ser sigiloso)' : null);
  await adm.from('processos').update(upd).eq('id', procId);
  return novas;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const auth = req.headers.get('Authorization') || '';
    const usr = createClient(URL_SB, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: u } = await usr.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
    if (!u?.user) return resp({ ok: false, motivo: 'sessao' });
    const est = await usr.rpc('estado_acesso');
    if (est.error || !est.data?.vinculado || !est.data?.pin_ok) return resp({ ok: false, motivo: 'sessao' });

    const adm = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });
    const { data: cli } = await adm.from('clientes').select('id,nome')
      .or(`user_id.eq.${u.user.id},google_user_id.eq.${u.user.id}`).limit(1).maybeSingle();
    if (!cli) return resp({ ok: false, motivo: 'sessao' });

    const body = await req.json().catch(() => ({}));

    if (body?.buscarCpf) {
      const desde1 = new Date(Date.now() - 36e5).toISOString();
      const { count: c1 } = await adm.from('consultas_log').select('id', { count: 'exact', head: true })
        .eq('cliente_id', cli.id).gte('criado_em', desde1);
      if ((c1 || 0) >= LIMITE_HORA) return resp({ ok: false, motivo: 'limite' });
      let pubs: any[];
      try { pubs = await djenPorNome(cli.nome); }
      catch (_) {
        await adm.from('consultas_log').insert({ cliente_id: cli.id, numero_cnj: null, resultado: 'cpf: djen indisponível' });
        return resp({ ok: false, motivo: 'indisponivel' });
      }
      const porNumero = new Map<string, any[]>();
      for (const p of pubs) {
        if (!temNossaOab(p) || !nomeConfere(cli.nome, p)) continue;
        const n = numeroDoItem(p);
        if (!cnjValido(n)) continue;
        if (!porNumero.has(n)) porNumero.set(n, []);
        porNumero.get(n)!.push(p);
      }
      const { data: ja } = await adm.from('processos').select('numero_cnj').eq('cliente_id', cli.id);
      const tem = new Set((ja || []).map((x: any) => x.numero_cnj));
      let novos = 0;
      for (const [n, lista] of [...porNumero.entries()].slice(0, 15)) {
        if (tem.has(n)) continue;
        const { data: np } = await adm.from('processos')
          .insert({ cliente_id: cli.id, numero_cnj: n, ativo: true, vinculo: 'automatico' }).select('id').single();
        if (np) { novos++; await atualizar(adm, np.id, n, lista).catch(() => 0); }
      }
      await adm.from('consultas_log').insert({ cliente_id: cli.id, numero_cnj: null,
        resultado: `cpf: ${pubs.length} publicações, ${porNumero.size} processos conferidos, ${novos} novos` });
      return resp({ ok: true, encontrados: porNumero.size, novos });
    }
    const numero = String(body?.numero || '').replace(/\D/g, '');
    if (!cnjValido(numero)) return resp({ ok: false, motivo: 'numero' });

    const { data: proc } = await adm.from('processos').select('id,ultima_sincronizacao')
      .eq('cliente_id', cli.id).eq('numero_cnj', numero).maybeSingle();
    if (proc) {
      const velho = !proc.ultima_sincronizacao || Date.now() - new Date(proc.ultima_sincronizacao).getTime() > ATUALIZA_HORAS * 36e5;
      const novas = velho ? await atualizar(adm, proc.id, numero, null) : 0;
      return resp({ ok: true, ja: true, atualizado: velho, novas });
    }
    if (body?.atualizar) return resp({ ok: false, motivo: 'nao_vinculado' });

    const desde = new Date(Date.now() - 36e5).toISOString();
    const { count } = await adm.from('consultas_log').select('id', { count: 'exact', head: true })
      .eq('cliente_id', cli.id).gte('criado_em', desde);
    if ((count || 0) >= LIMITE_HORA) return resp({ ok: false, motivo: 'limite' });

    let pubs: any[];
    try { pubs = await djen(numero); }
    catch (e) {
      await adm.from('consultas_log').insert({ cliente_id: cli.id, numero_cnj: numero, resultado: 'djen indisponível' });
      return resp({ ok: false, motivo: 'indisponivel' });
    }
    const nossas = pubs.filter(temNossaOab);
    const confere = nossas.some((p) => nomeConfere(cli.nome, p));
    await adm.from('consultas_log').insert({ cliente_id: cli.id, numero_cnj: numero,
      resultado: !nossas.length ? 'sem publicação com nossa OAB' : (confere ? 'vinculado' : 'nome não confere') });
    if (!confere) return resp({ ok: false, motivo: 'nao_encontrado' });

    const { data: novo, error } = await adm.from('processos')
      .insert({ cliente_id: cli.id, numero_cnj: numero, ativo: true, vinculo: 'automatico' }).select('id').single();
    if (error || !novo) return resp({ ok: false, motivo: 'indisponivel' });
    await atualizar(adm, novo.id, numero, nossas).catch(() => 0);
    return resp({ ok: true, novo: true });
  } catch (e) {
    console.error(e);
    return resp({ ok: false, motivo: 'indisponivel' });
  }
});

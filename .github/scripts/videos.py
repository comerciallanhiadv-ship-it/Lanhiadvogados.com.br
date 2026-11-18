"""Atualiza videos.json com os 7 Shorts mais recentes do canal do Felipe Lanhi no YouTube.
Roda no GitHub Actions (videos.yml). Usa só o feed público do YouTube, sem chave.
As capas são baixadas para img/yt/ (o site só carrega imagens do próprio domínio)."""
import json, os, re, sys, urllib.request, urllib.error, xml.etree.ElementTree as ET
CANAL = 'UCIMM4x-Q2mR63haBAcSdGrQ'            # @felipelanhi
QTD = 7
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ARQ = os.path.join(RAIZ, 'videos.json'); PASTA = os.path.join(RAIZ, 'img', 'yt')
CAPAS_PROPRIAS = {'rFHr4URWFmw': '/img/390a0606522d.webp', 'OLCVLhsh0q4': '/img/4a33cf283c68.webp',
                  'ugphUtV8gBw': '/img/65d8365b0095.webp', 'TGI6pP_E7zg': '/img/3e6f51d30817.webp'}
NS = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
UA = {'User-Agent': 'Mozilla/5.0 (site lanhiadvogados.com.br; atualizacao de videos)'}
def baixa(url, binario=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        d = r.read(); return d if binario else d.decode('utf-8')
def le_feed(xml):
    raiz = ET.fromstring(xml); out = []
    for e in raiz.findall('a:entry', NS):
        vid = e.findtext('yt:videoId', namespaces=NS); tit = (e.findtext('a:title', namespaces=NS) or '').strip()
        pub = e.findtext('a:published', namespaces=NS) or ''
        if vid: out.append({'id': vid, 'titulo': tit, 'publicado': pub[:10]})
    return out
def eh_short(vid):
    class SemRedir(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k): return None
    op = urllib.request.build_opener(SemRedir)
    try: return op.open(urllib.request.Request('https://www.youtube.com/shorts/' + vid, headers=UA, method='HEAD'), timeout=20).status == 200
    except urllib.error.HTTPError: return False
def tag(t):
    t = t.lower()
    for chave, nome in [('perícia', 'Perícia'), ('pericia', 'Perícia'), ('auxílio-doença', 'Auxílio-doença'), ('auxilio-doença', 'Auxílio-doença'), ('auxílio-acidente', 'Auxílio-acidente'),
                        ('acidente', 'Acidente'), ('aposentad', 'Aposentadoria'), ('bpc', 'BPC/LOAS'), ('loas', 'BPC/LOAS'), ('inss', 'INSS'), ('dúvida', 'Dúvidas')]:
        if chave in t: return nome
    return 'Seus direitos'
def capa(vid):
    if vid in CAPAS_PROPRIAS: return CAPAS_PROPRIAS[vid]
    os.makedirs(PASTA, exist_ok=True); dest = os.path.join(PASTA, vid + '.jpg')
    if not os.path.exists(dest):
        for nome in ('oar2.jpg', 'hq720.jpg', 'hqdefault.jpg'):
            try: open(dest, 'wb').write(baixa(f'https://i.ytimg.com/vi/{vid}/{nome}', True)); break
            except urllib.error.HTTPError: continue
    return '/img/yt/' + vid + '.jpg' if os.path.exists(dest) else ''
def main():
    lista = []
    try: lista = le_feed(baixa('https://www.youtube.com/feeds/videos.xml?playlist_id=UUSH' + CANAL[2:]))
    except Exception as e: print('feed de Shorts indisponível:', e)
    if not lista:
        todos = le_feed(baixa('https://www.youtube.com/feeds/videos.xml?channel_id=' + CANAL))
        lista = [v for v in todos if eh_short(v['id'])]
    lista = sorted(lista, key=lambda v: v['publicado'], reverse=True)[:QTD]
    if not lista: print('nenhum vídeo encontrado; nada alterado'); return 0
    for v in lista: v['tag'] = tag(v['titulo']); v['capa'] = capa(v['id'])
    novo = {'canal': '@felipelanhi', 'videos': lista}
    antigo = json.load(open(ARQ)) if os.path.exists(ARQ) else {}
    if {k: antigo.get(k) for k in novo} == novo: print('sem novidades'); return 0
    novo['atualizado_em'] = __import__('datetime').datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ')
    json.dump(novo, open(ARQ, 'w'), ensure_ascii=False, indent=1)
    if os.path.isdir(PASTA):
        manter = {v['id'] + '.jpg' for v in lista}
        for f in os.listdir(PASTA):
            if f not in manter: os.remove(os.path.join(PASTA, f))
    print('atualizado:', [v['titulo'] for v in lista]); return 0
if __name__ == '__main__': sys.exit(main())

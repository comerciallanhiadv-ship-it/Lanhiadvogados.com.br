"""Monta a capa de destaque de um Short: a imagem original do vídeo (9:16) com a frase-gancho do título
em letras grandes, em faixas coloridas, no terço de baixo — no estilo das capas que chamam atenção no site."""
import io, os, re, hashlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FONTE = os.path.join(os.path.dirname(__file__), '..', 'fontes', 'Anton-Regular.ttf')
TEMAS = [((255, 230, 0), (17, 17, 17)), ((227, 38, 46), (255, 255, 255)), ((34, 112, 230), (255, 255, 255)), ((255, 255, 255), (17, 17, 17))]
PEQUENAS = {'o','a','os','as','de','do','da','dos','das','por','para','pra','e','no','na','nos','nas','que','se','com','ao','um','uma','em','teu','tua','seu','sua'}
def gancho(titulo, maximo=62):
    t = re.sub(r'\s*#\w+', '', titulo).strip()
    m = re.match(r'^(.{12,70}?[?!:])(\s|$)', t)
    g = (m.group(1) if m else t).rstrip(':').strip()
    if len(g) > maximo:
        ps = g[:maximo + 1].split(' ')[:-1] if g[maximo:maximo + 1] != ' ' else g[:maximo].split(' ')
        while ps and ps[-1].lower().strip(',') in PEQUENAS: ps.pop()
        g = ' '.join(ps).rstrip(',')
    return g.upper()
def quebra(txt, fonte, larg, draw):
    linhas, atual = [], ''
    for p in txt.split():
        teste = (atual + ' ' + p).strip()
        if draw.textlength(teste, font=fonte) <= larg or not atual: atual = teste
        else: linhas.append(atual); atual = p
    if atual: linhas.append(atual)
    return linhas
def monta(bruto, titulo, vid, saida, W=540, H=960, frase=None):
    im = Image.open(io.BytesIO(bruto)).convert('RGB')
    r = max(W / im.width, H / im.height); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x0 = (im.width - W) // 2; y0 = (im.height - H) // 2; im = im.crop((x0, y0, x0 + W, y0 + H))
    # escurece do meio para baixo (cobre as legendas do próprio vídeo e dá leitura ao título)
    sombra = Image.linear_gradient('L').resize((W, H))
    sombra = sombra.point(lambda v: 0 if v < 105 else min(242, int((v - 105) / 150 * 242 * 1.35)))
    im = Image.composite(Image.new('RGB', (W, H), (8, 9, 11)), im, sombra)
    d = ImageDraw.Draw(im); fundo, letra = TEMAS[int(hashlib.md5(vid.encode()).hexdigest(), 16) % len(TEMAS)]
    txt = (frase or gancho(titulo)).upper(); marg = 30; pad = 14; larg = W - 2 * marg - 2 * pad
    for tam in (92, 84, 76, 70, 64, 58, 54, 50, 46, 42):
        f = ImageFont.truetype(FONTE, tam); linhas = quebra(txt, f, larg, d)
        if (len(linhas) <= (3 if len(txt) <= 34 else 4) and max(d.textlength(l, font=f) for l in linhas) <= larg) or tam == 42: break
    alt = int(tam * 1.22); esp = 10; total = len(linhas) * alt + (len(linhas) - 1) * esp
    y = H - 64 - total
    camada = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dc = ImageDraw.Draw(camada)
    for ln in linhas:
        bx = dc.textbbox((0, 0), ln, font=f); w = bx[2] - bx[0]; h = bx[3] - bx[1]
        cx = (W - w) / 2
        caixa = [cx - pad, y, cx + w + pad, y + alt]
        dc.rounded_rectangle([caixa[0] + 5, caixa[1] + 7, caixa[2] + 5, caixa[3] + 7], 12, fill=(0, 0, 0, 140))
        dc.rounded_rectangle(caixa, 12, fill=fundo + (255,))
        dc.text((cx - bx[0], y + (alt - h) / 2 - bx[1]), ln, font=f, fill=letra + (255,))
        y += alt + esp
    camada = camada.rotate(-2, resample=Image.BICUBIC, center=(W / 2, H - 64 - total / 2))
    im = Image.alpha_composite(im.convert('RGBA'), camada).convert('RGB')
    im.save(saida, 'WEBP', quality=82, method=6)

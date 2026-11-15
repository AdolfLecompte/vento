"""Writes scripts/logo.svg: the Vento mark (two arrows and a box with a currency symbol) in white on transparent.
The rim around the box and the symbol are cut out of the shapes (masks), so the mark works on any background.
The geometry is the same as src/Logo.tsx; the symbol strokes come from src/divisas.json. Run: python3 scripts/make-logo.py"""
import json

R = 'stroke-linejoin="round" stroke-linecap="round"'
# Two corner arrows (down-left and, turned 180 degrees, up-right) tucked behind the box, plus the tips of a vertical pair.
PIEZAS = ["43,198 73,222 128,176 143,178 169,314 169,324 43,324", "220,84 250,112 190,112"]
GIRO = 'rotate(180 235.5 212)'
LID = '<rect x="134" y="120" width="198" height="48" rx="18"/>'
BODY = '<path d="M141 160 H325 V270 A30 30 0 0 1 295 300 H171 A30 30 0 0 1 141 270 Z"/>'
S = 2.1  # the 390x260 drawing, scaled and centred in the 1024 square
MASK = 'maskUnits="userSpaceOnUse" x="-200" y="-200" width="900" height="900"'

dolar = next(d for d in json.load(open('src/divisas.json')) if d['id'] == 'dolar')
trazos = ''.join(f'<path d="{d}"/>' for d in dolar['trazos'])
piezas = ''.join(f'<polygon points="{p}"/><polygon points="{p}" transform="{GIRO}"/>' for p in PIEZAS)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<defs>
<mask id="recorte" {MASK}><rect x="-200" y="-200" width="900" height="900" fill="white"/><g fill="black" stroke="black" stroke-width="24" {R}>{LID}{BODY}</g></mask>
<mask id="simbolo" {MASK}><rect x="-200" y="-200" width="900" height="900" fill="white"/><g transform="translate(189 192) scale(0.88)" fill="none" stroke="black" stroke-width="12" {R}>{trazos}</g></mask>
</defs>
<g transform="translate({512 - 235.5 * S:.1f} {512 - 212 * S:.1f}) scale({S})">
<g mask="url(#recorte)" fill="white" stroke="white" stroke-width="8" {R}>{piezas}</g>
<g mask="url(#simbolo)" fill="white">{LID}{BODY}</g>
</g>
</svg>
'''
open('scripts/logo.svg', 'w').write(svg)

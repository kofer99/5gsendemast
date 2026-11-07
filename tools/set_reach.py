"""Hilfsskript fürs Balancing: python tools/set_reach.py mast=1000 tanne=6000 ..."""
import re, sys
p = 'assets/js/data/buildings.js'
t = open(p, encoding='utf-8').read()
for arg in sys.argv[1:]:
    k, v = arg.split('=')
    t, n = re.subn(r"(id: '%s',.*?reach: )[0-9.e]+(,)" % k, r"\g<1>%s\2" % v, t)
    assert n == 1, k
open(p, 'w', encoding='utf-8').write(t)

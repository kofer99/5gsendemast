"""Prüft die SQL-Befehle der Bestenliste gegen SQLite (D1 ist SQLite).

Liest migrations/*.sql und das SQL-Objekt aus functions/_lib/store.js, führt alles in einer
In-Memory-Datenbank aus und prüft das Verhalten (Upsert nur nach oben, Sortierung, Rang).
Aufruf: python tools/check_sql.py
"""
import pathlib
import re
import sqlite3
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_sql():
    src = (ROOT / 'functions/_lib/store.js').read_text(encoding='utf-8')
    block = src[src.index('export const SQL = {'):src.index('};', src.index('export const SQL = {'))]
    out = {}
    for m in re.finditer(r"(\w+):\s*(?:'([^']*)'|`([^`]*)`)", block):
        out[m.group(1)] = m.group(2) if m.group(2) is not None else m.group(3)
    return out


def main():
    db = sqlite3.connect(':memory:')
    db.row_factory = sqlite3.Row
    for f in sorted((ROOT / 'migrations').glob('*.sql')):
        db.executescript(f.read_text(encoding='utf-8'))
    sql = load_sql()
    expected = {'byRun', 'byName', 'lastByIp', 'newByIp', 'upsert', 'top', 'rankOf', 'remove', 'count'}
    assert expected <= set(sql), f'SQL fehlt: {expected - set(sql)}'

    def upsert(run, name, score, fp, phase, play, ip, now):
        db.execute(sql['upsert'], (run, name, name.lower(), score, fp, phase, play, ip, now))

    a, b, c = 'a' * 24, 'b' * 24, 'c' * 24
    upsert(a, 'Anna', 1e9, 5e12, 3, 9000, 'ip1', 1000)
    upsert(b, 'Bert', 1.5e15, 1e15, 5, 20000, 'ip2', 1100)
    upsert(c, 'Cleo', 1.5e15, 2e15, 5, 30000, 'ip1', 1200)
    # Verbesserung und Verschlechterung: Werte gehen nur nach oben, Name ändert sich
    upsert(a, 'Anna2', 5e8, 6e12, 2, 8000, 'ip3', 1300)
    r = db.execute(sql['byRun'], (a,)).fetchone()
    assert r['name'] == 'Anna2' and r['score'] == 1e9 and r['fp_all'] == 6e12 and r['phase'] == 3 and r['playtime'] == 9000, dict(r)
    assert r['created_at'] == 1000 and r['updated_at'] == 1300 and r['ip_hash'] == 'ip3'

    assert db.execute(sql['byName'], ('bert',)).fetchone()['run_id'] == b
    assert db.execute(sql['lastByIp'], ('ip1',)).fetchone()['t'] == 1200
    assert db.execute(sql['newByIp'], ('ip1', 1100)).fetchone()['n'] == 1

    top = [x['name'] for x in db.execute(sql['top'], (0, 100))]
    assert top == ['Cleo', 'Bert', 'Anna2'], top
    week = [x['name'] for x in db.execute(sql['top'], (1150, 100))]
    assert week == ['Cleo', 'Anna2'], week
    assert db.execute(sql['count'], (0,)).fetchone()['n'] == 3

    def rank(run, since):
        row = db.execute(sql['byRun'], (run,)).fetchone()
        return db.execute(sql['rankOf'], (since, row['score'], row['fp_all'], row['created_at'])).fetchone()['r']
    assert (rank(c, 0), rank(b, 0), rank(a, 0)) == (1, 2, 3)
    assert rank(a, 1150) == 2

    # Eindeutiger Name
    try:
        db.execute(sql['upsert'], ('d' * 24, 'CLEO', 'cleo', 1, 1, 1, 0, 'ip9', 2000))
        raise AssertionError('doppelter Name wurde angenommen')
    except sqlite3.IntegrityError:
        pass

    db.execute(sql['remove'], (b,))
    assert db.execute(sql['byRun'], (b,)).fetchone() is None
    print(f'SQL ok ({len(sql)} Befehle, SQLite {sqlite3.sqlite_version})')


if __name__ == '__main__':
    try:
        main()
    except AssertionError as e:
        print('FEHLER:', e)
        sys.exit(1)

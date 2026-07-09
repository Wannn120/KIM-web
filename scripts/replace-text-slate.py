from pathlib import Path
import re

root = Path('f:/Project/Minisoccer')
patterns = [
    (re.compile(r'text-slate-400'), 'text-[color:var(--muted)]'),
    (re.compile(r'text-slate-300'), 'text-[color:var(--muted)]'),
    (re.compile(r'text-slate-200'), 'text-[color:var(--foreground)]'),
]

files = list(root.rglob('*.tsx')) + list(root.rglob('*.ts')) + list(root.rglob('*.jsx')) + list(root.rglob('*.js'))
updated = 0
for file in files:
    text = file.read_text(encoding='utf-8')
    new = text
    for pat, repl in patterns:
        new = pat.sub(repl, new)
    if new != text:
        file.write_text(new, encoding='utf-8')
        updated += 1
print(f'updated {updated} files')

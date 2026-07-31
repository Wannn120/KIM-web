from pathlib import Path
path = Path('lib/security-headers.ts')
text = path.read_text(encoding='utf-8')
lines = text.splitlines(keepends=True)
new_lines = []
changed = False
for line in lines:
    if 'img-src' in line and 'https://snap-assets.sandboxmidtrans.com' in line and 'https://g.alicdn.com' in line:
        if 'https://res.cloudinary.com' not in line:
            line = line.replace('img-src \'self\' data: ', "img-src 'self' data: https://res.cloudinary.com ")
            changed = True
    new_lines.append(line)
if not changed:
    raise SystemExit('NO_CHANGE')
path.write_text(''.join(new_lines), encoding='utf-8')
print('patched')

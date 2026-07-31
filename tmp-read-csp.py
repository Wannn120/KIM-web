from pathlib import Path
text = Path('lib/security-headers.ts').read_text(encoding='utf-8')
for i, line in enumerate(text.splitlines(), 1):
    if 'img-src' in line or 'style-src' in line:
        print(i, repr(line))

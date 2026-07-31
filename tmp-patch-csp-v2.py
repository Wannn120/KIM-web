from pathlib import Path
path = Path('lib/security-headers.ts')
text = path.read_text(encoding='utf-8')
old = '    "img-src \'self\' data: https://snap-assets.sandboxmidtrans.com https://snap-assets.sandboxmidtrans.com https://snap-assets.midtrans.com https://api.sandboxmidtrans.com https://api.midtrans.com https://pay.google.com https://g.alicdn.com",'
new = '    "img-src \'self\' data: https://res.cloudinary.com https://snap-assets.sandboxmidtrans.com https://snap-assets.sandboxmidtrans.com https://snap-assets.midtrans.com https://api.sandboxmidtrans.com https://api.midtrans.com https://pay.google.com https://g.alicdn.com",'
if old not in text:
    print('OLD_NOT_FOUND')
    raise SystemExit(1)
path.write_text(text.replace(old, new), encoding='utf-8')
print('patched')

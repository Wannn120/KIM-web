import time, urllib.request, sys
url = 'https://klaten-international-minisoccer.vercel.app/api/fields/klaten-field-1/availability?date=2026-07-25'
for i in range(12):
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            status = r.getcode()
            body = r.read().decode('utf-8')
        print(f'Attempt {i+1}: HTTP {status}')
        print(body)
        if status == 200:
            sys.exit(0)
    except Exception as e:
        print(f'Attempt {i+1}: ERROR {e!r}')
    time.sleep(10)
print('No successful 200 response after polling')

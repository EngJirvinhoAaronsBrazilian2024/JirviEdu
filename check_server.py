import urllib.request
import json
import time
import sys

time.sleep(2)

try:
    req = urllib.request.Request('http://localhost:3000')
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    print("HTML length:", len(html))
except Exception as e:
    print("Error:", e)

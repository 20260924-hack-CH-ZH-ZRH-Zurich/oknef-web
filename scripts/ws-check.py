"""Verify actual session-authenticated WebSocket upgrade without a browser."""
import base64, http.client, json, os, socket, ssl
from urllib.parse import urlsplit
base = urlsplit(os.environ['QA_BASE_URL'])
origin = os.environ.get('QA_ORIGIN', os.environ['QA_BASE_URL'])
connection_type = http.client.HTTPSConnection if base.scheme == 'https' else http.client.HTTPConnection
connection = connection_type(base.hostname, base.port, timeout=20)
connection.request('POST', '/api/auth/demo', '{}', {'Content-Type': 'application/json', 'Origin': origin})
response = connection.getresponse()
assert response.status == 200, f'demo status {response.status}'
cookie = response.getheader('set-cookie').split(';')[0]
response.read()
connection.close()
sock = socket.create_connection((base.hostname, base.port or (443 if base.scheme == 'https' else 80)), timeout=20)
if base.scheme == 'https': sock = ssl.create_default_context().wrap_socket(sock, server_hostname=base.hostname)
key = base64.b64encode(os.urandom(16)).decode()
request = f'GET /api/ws HTTP/1.1\r\nHost: {base.netloc}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: {key}\r\nOrigin: {origin}\r\nCookie: {cookie}\r\n\r\n'
sock.sendall(request.encode())
data = b''
while b'\r\n\r\n' not in data:
    part = sock.recv(4096)
    if not part: break
    data += part
header, _, remaining = data.partition(b'\r\n\r\n')
status = header.split(b'\r\n')[0].decode()
print(json.dumps({'handshake':status,'buffered_frame_bytes':len(remaining)}))
assert status.startswith('HTTP/1.1 101'), 'WebSocket handshake failed'
if not remaining: remaining = sock.recv(4096)
assert remaining, 'WebSocket did not deliver a frame'
print(json.dumps({'event_frame_received':True,'bytes':len(remaining)}))
sock.close()

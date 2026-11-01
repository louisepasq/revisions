# Base factice qui répond comme l'API REST d'Upstash (commande en tableau JSON), pour les essais locaux.
import json, http.server
D = {}
def executer(c):
    op = c[0].upper(); a = c[1:]
    if op == "GET": return D.get(a[0])
    if op == "SET": D[a[0]] = a[1]; return "OK"
    if op == "DEL": return int(D.pop(a[0], None) is not None)
    if op == "INCR": D[a[0]] = int(D.get(a[0], 0)) + 1; return D[a[0]]
    if op == "EXPIRE": return 1
    return None
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        corps = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"[]")
        if self.path.startswith("/pipeline") or self.path.startswith("/multi-exec"):
            rep = [{"result": executer(c)} for c in corps]
        else:
            rep = {"result": executer(corps)}
        b = json.dumps(rep).encode(); self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def log_message(self, *a): pass
http.server.HTTPServer(("127.0.0.1", 3171), H).serve_forever()

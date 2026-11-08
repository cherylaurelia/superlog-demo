#!/usr/bin/env python3
"""Send one OTLP error span with an exception event, plus one error log. Usage: send_error.py <endpoint> <keyfile> <tag>"""
import json, secrets, sys, time, urllib.request, urllib.error
ep, keyfile, tag = sys.argv[1:4]
key = open(keyfile).read().strip()
now = time.time_ns()
attrs = lambda d: [{"key": k, "value": {"stringValue": v}} for k, v in d.items()]
res = {"attributes": attrs({"service.name": "checkout-demo", "deployment.environment": "production"})}
msg = f"cannot read property total of undefined ({tag})"
stack = f"TypeError: {msg}\n    at priceCart (src/cart.ts:42:17)\n    at handler (src/routes/checkout.ts:18:9)"
traces = {"resourceSpans": [{"resource": res, "scopeSpans": [{"scope": {"name": "demo"}, "spans": [{
    "traceId": secrets.token_hex(16), "spanId": secrets.token_hex(8), "name": "POST /checkout", "kind": 2,
    "startTimeUnixNano": str(now - 5_000_000), "endTimeUnixNano": str(now), "status": {"code": 2, "message": msg},
    "attributes": attrs({"http.route": "/checkout"}),
    "events": [{"name": "exception", "timeUnixNano": str(now), "attributes": attrs({"exception.type": "TypeError", "exception.message": msg, "exception.stacktrace": stack})}],
}]}]}]}
logs = {"resourceLogs": [{"resource": res, "scopeLogs": [{"scope": {"name": "demo"}, "logRecords": [{
    "timeUnixNano": str(now), "severityNumber": 17, "severityText": "ERROR", "body": {"stringValue": msg},
    "attributes": attrs({"exception.type": "TypeError", "exception.message": msg, "exception.stacktrace": stack}),
}]}]}]}
for path, body in (("/v1/traces", traces), ("/v1/logs", logs)):
    req = urllib.request.Request(ep + path, json.dumps(body).encode(), {"content-type": "application/json", "x-api-key": key})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            print(path, r.status, r.read()[:120])
    except urllib.error.HTTPError as e:
        print(path, e.code, e.read()[:200])

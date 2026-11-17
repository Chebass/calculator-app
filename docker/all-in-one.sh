#!/bin/sh
# Starts both Go services (as the unprivileged "app" user) and nginx in one container.
# If any process exits the container stops, so the orchestrator can restart it.
set -eu

# Because this script is the CMD (not "nginx"), the nginx image skips its template
# rendering step; run it explicitly.
/docker-entrypoint.d/20-envsubst-on-templates.sh

su app -s /bin/sh -c "PORT=8081 exec /usr/local/bin/calculator-service" &
p1=$!
su app -s /bin/sh -c "PORT=8082 exec /usr/local/bin/history-service" &
p2=$!
nginx -g "daemon off;" &
p3=$!

trap "kill $p1 $p2 $p3 2>/dev/null; exit 0" TERM INT
while kill -0 "$p1" 2>/dev/null && kill -0 "$p2" 2>/dev/null && kill -0 "$p3" 2>/dev/null; do
  sleep 2
done
echo "a process exited; stopping container" >&2
kill "$p1" "$p2" "$p3" 2>/dev/null || true
exit 1

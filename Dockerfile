# Flavio Leone — photographer portfolio
# Static site served by nginx. Built to run on deplo.io:
#   - listens on 0.0.0.0:$PORT (default 8080)
#   - TCP health probe on that port gates incoming traffic
# https://guides.deplo.io/docker/quick-start.html

FROM nginx:1.27-alpine

# deplo.io injects $PORT; default to 8080 so the image also runs locally as-is.
ENV PORT=8080

# nginx's official entrypoint runs envsubst over every *.template in
# /etc/nginx/templates and writes the result into /etc/nginx/conf.d/.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Site content
COPY site/ /usr/share/nginx/html/

# Documentation only — the real port is whatever $PORT resolves to.
EXPOSE 8080

# Base image ENTRYPOINT renders templates, then runs: nginx -g 'daemon off;'

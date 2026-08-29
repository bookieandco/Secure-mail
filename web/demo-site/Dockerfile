FROM nginx:1.29-alpine

RUN addgroup -S site && adduser -S -G site site \
    && mkdir -p /var/cache/nginx /var/run/nginx /usr/share/nginx/html \
    && chown -R site:site /var/cache/nginx /var/run/nginx /usr/share/nginx/html /etc/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html

USER site
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

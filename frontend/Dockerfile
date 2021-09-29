FROM nginx:1.21.0

RUN mkdir -p /app
ADD build/ /app
RUN rm -f /etc/nginx/nginx.conf && chown -R nginx:nginx /app

WORKDIR /app

CMD nginx -g 'daemon off;'

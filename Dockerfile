FROM nginx:1.21

COPY ./written_in_js/ /usr/share/nginx/html/

CMD ["nginx", "-g", "daemon off;"]
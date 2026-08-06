# 哲唯科技~GEO交付平台 · 后端镜像（零依赖 Node，无需 npm install）
FROM node:20-alpine
WORKDIR /app
COPY server ./server
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/server.mjs"]

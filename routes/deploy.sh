#/bin/bash

cd /home/server/antv-x6-serve &&
    git pull &&
    pnpm i &&
    pm2 reload 0 &&
    cd /home/webroots/antv-x6-vue3 &&
    git pull &&
    pnpm i &&
    pnpm build &&
    nginx -s reload

const router = require('koa-router')()
const { exec } = require('child_process');

router.get('/deploy', async (ctx, next) => {
  const scriptPath = `${__dirname}/deploy.sh`;
  const res = exec(`sh ${scriptPath}`);
  ctx.body = { code: 100 }
  next()
})

module.exports = router

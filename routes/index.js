const router = require('koa-router')()
const { execSync } = require('child_process');

router.get('/deploy', async (ctx, next) => {
  const scriptPath = `${__dirname}/deploy.sh`;
  try {
    const res = execSync(`sh ${scriptPath}`);
    ctx.body = { code: 100, message: res.toString() }
  } catch (error) {
    const res = execSync(`sh ${scriptPath}`);
    ctx.body = { code: 100, message: error.toString() }
  }
  next()
})

module.exports = router

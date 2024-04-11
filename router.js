const router = require('koa-router')()
const { exec, spawn } = require('child_process');

let lock = false
let msgs = []

async function executeShellCommand(command) {
  console.log("[debug]command:", command)
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        resolve(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function spawnShellCommand(command, options) {
  console.log("[debug]command:", command, options)
  return new Promise((resolve, reject) => {
    const ls = spawn(command, options, { stdio: 'inherit' });
    ls.on('error', (error) => {
      reject(error);
    });
    ls.on('close', (code) => {
      console.log(`子进程退出码：${code}`);
      resolve();
    });
  });
}

router.get('/deploy', async (ctx, next) => {
  ctx.body = { code: 100 }
  if (lock) {
    console.log("lock锁住，不做处理")
    next()
    return
  }
  try {
    lock = true
    msgs = []
    await executeShellCommand('cd /home/server/antv-x6-serve')
    msgs.push("开始构建serve")
    await executeShellCommand('git pull')
    msgs.push("拉取服务端最新代码")
    await executeShellCommand('pnpm i')
    msgs.push("更新服务端依赖")
    await executeShellCommand('pm2 reload 0')
    msgs.push("重启服务")
    await executeShellCommand('cd /home/webroots/antv-x6-vue3')
    msgs.push("开始构建前端")
    await executeShellCommand('git pull')
    msgs.push("拉取编辑器最新代码")
    await executeShellCommand('pnpm i')
    msgs.push("更新编辑器依赖")
    // await spawnShellCommand('pwd', [])
    // await spawnShellCommand('cd', ['/home/webroots/antv-x6-vue3'])
    // await spawnShellCommand('pwd', [])
    // await spawnShellCommand('npx', ['vite', 'build'])
    msgs.push("开始编译")
    await executeShellCommand('nginx -s reload')
    msgs.push("构建完成")
    lock = false
  } catch (error) {
    console.log("[debug]error:", error)
  }
  next()
})

router.get('/deploy-status', async (ctx, next) => {
  ctx.body = { code: 100, data: msgs }
  next()
})

module.exports = router

const router = require('koa-router')()
const { exec, spawn } = require('child_process');

let lock = false
let msgs = []

async function executeShellCommand(command, cwd) {
  console.log("[debug]command:", command)
  msgs.push(command)
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        resolve(stderr);
      } else {
        console.log(stdout)
        msgs.push(stdout)
        resolve(stdout);
      }
    });
  });
}

async function spawnShellCommand(command, cwd) {
  console.log("[debug]command:", command)
  msgs.push(command)
  return new Promise((resolve, reject) => {
    const ls = spawn(command, { cwd })
    // 监听输出事件
    ls.stdout.on('data', (stdout) => {
      console.log(stdout)
      msgs.push(stdout)
    });

    ls.stderr.on('data', (error) => {
      reject(error);
      return;
    });

    ls.on('close', (code) => {
      console.log(`子进程退出，退出码 ${code}`);
      resolve();
    });
  });
}

const SERVE_DIR = '/home/server/antv-x6-serve'
const FRONT_PAGE_DIR = '/home/webroots/antv-x6-vue3'

router.get('/deploy', async (ctx, next) => {
  if (lock) {
    console.log("lock锁住，不做处理")
    ctx.body = { code: 101, message: '正在构建当中，请勿重复操作!' }
    next()
    return
  }
  try {
    ctx.body = { code: 100 }
    lock = true
    msgs = []
    msgs.push("开始构建serve")
    msgs.push("拉取服务端最新代码")
    await spawnShellCommand('git pull', SERVE_DIR)

    msgs.push("更新服务端依赖")
    await spawnShellCommand('pnpm i', SERVE_DIR)

    msgs.push("重启服务")
    await spawnShellCommand('pm2 reload 0')

    msgs.push("开始构建前端")
    msgs.push("拉取编辑器最新代码")
    await spawnShellCommand('git pull', FRONT_PAGE_DIR)

    msgs.push("更新编辑器依赖")
    await spawnShellCommand('pnpm i', FRONT_PAGE_DIR)

    msgs.push("开始编译")
    await spawnShellCommand('pnpm build', FRONT_PAGE_DIR)
    msgs.push("编译结束")

    await spawnShellCommand('nginx -s reload')
    msgs.push("构建完成!!!")
    lock = false
  } catch (error) {
    console.log("[debug]error:", error)
  }
  next()
})

router.get('/deploy-status', async (ctx, next) => {
  if (!lock) {
    setTimeout(() => {
      msgs = []
    }, 1000);
  }
  ctx.body = { code: 100, data: msgs, done: !lock }
  next()
})

module.exports = router

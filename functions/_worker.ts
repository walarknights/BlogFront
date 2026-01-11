import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from '../src/server/types' // 导入共享类型

// 导入API 模块
import usersApi from '../src/server/users' // 默认导入 index.ts
import articleApi from '../src/server/article/index' // 导入文章相关API
import personalApi from '../src/server/personal/index' // 导入个人信息API
import testApi from '../src/server/test/index' // 导入测试API

// 扩展 Env 类型以包含 ASSETS bindings (Cloudflare Workers Assets)
interface WorkerEnv extends Env {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> }
}

// 初始化主 Hono 应用 (不使用 basePath)
const app = new Hono<{ Bindings: WorkerEnv }>()

app.use(
  '/*',
  cors({
    origin: (origin) => origin, // 在生产环境中，允许请求来源（通常前端和后端同源），或者您可以指定具体的生产域名
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Length', 'Content-Type', 'Authorization'], // 添加 Authorization
    exposeHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 600,
    credentials: true,
  }),
)

// 创建 API 路由组
const api = new Hono<{ Bindings: WorkerEnv }>()
api.route('/user', usersApi)
api.route('/article', articleApi)
api.route('/personal', personalApi)
api.route('/test', testApi)

// 将 API 路由挂载到 /api 路径下
app.route('/api', api)

// 处理静态资源 (Fallback for SPA)
app.get('/*', async (c) => {
  const assets = c.env.ASSETS
  if (!assets) {
    return c.text('Assets binding not found', 500)
  }

  const url = new URL(c.req.url)
  // 尝试获取静态资源
  let response = await assets.fetch(c.req.raw)

  // SPA 路由支持：如果资源不存在(404)且不是 API 请求，通过 index.html 响应
  // 注意：API 请求通常在上面已经匹配了，或者是 404 的 API，这里主要针对前端路由
  if (response.status === 404 && !url.pathname.startsWith('/api')) {
    response = await assets.fetch(new Request(new URL('/index.html', c.req.url), c.req.raw))
  }

  return response
})

export default {
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
}

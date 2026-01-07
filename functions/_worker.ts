import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from 'src/server/types' // 导入共享类型

// 导入API 模块
import usersApi from 'src/server/users' // 默认导入 index.ts
import articleApi from 'src/server/article/index' // 导入文章相关API
import personalApi from 'src/server/personal/index' // 导入个人信息API
import testApi from 'src/server/test/index' // 导入测试API

// 初始化主 Hono 应用 (不使用 basePath)
const app = new Hono<{ Bindings: Env }>()

app.use(
  '/*',
  cors({
    origin: 'http://localhost:9000', // 指定具体的源,不能使用通配符
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Length', 'Content-Type', 'Authorization'], // 添加 Authorization
    exposeHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 600,
    credentials: true,
  }),
)

app.route('/user', usersApi)
app.route('/article', articleApi) // 文章路由直接挂载在根路径
app.route('/personal', personalApi) // 个人路由直接挂载在根路径
app.route('/test', testApi) // 测试路由直接挂载在根路径
export default {
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
}

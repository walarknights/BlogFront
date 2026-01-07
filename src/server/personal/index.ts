import { AwsClient } from 'aws4fetch'
import { Hono } from 'hono'

import type {
  Env,
  UserFansInfo,
  UserFocusInfo,
  ArticleSimpleInfo,
  UserInfo,
} from 'src/server/types'

const app = new Hono<{ Bindings: Env }>()
const generatePresignedUrl = async (path: string, env: Env): Promise<string> => {
  if (!path) return ''
  if (path.startsWith('http')) return path

  try {
    const aws = new AwsClient({
      accessKeyId: env.B2_KEY_ID,
      secretAccessKey: env.B2_APPLICATION_KEY,
      service: 's3',
      region: 'us-west-004',
    })

    const filePath = path.startsWith('/') ? path.substring(1) : path
    const s3Url = `https://${env.B2_BUCKET_NAME}.${env.B2_ENDPOINT}/${filePath}`

    const signedRequest = await aws.sign(s3Url, {
      method: 'GET',
      aws: { signQuery: true },
    })
    return signedRequest.url
  } catch (error) {
    console.error('Failed to generate signed URL:', error)
    const filePath = path.startsWith('/') ? path.substring(1) : path
    return `https://${env.B2_BUCKET_NAME}.${env.B2_ENDPOINT}/${filePath}`
  }
}

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

const formatDateTime = (isoString: string): string => {
  // 将 "2025-12-31T08:30:45.123Z" 转换为 "2025-12-31 08:30:45"
  return isoString.replace('T', ' ').replace(/\.\d{3}Z$/, '')
}

// ...existing code...
app.get('/getInfo/:id', async (c) => {
  const userId = c.req.param('id')
  if (!userId) {
    return c.json({ error: 'request is invalid' }, 401)
  }
  const db = c.env.DB
  const row = await db
    .prepare(
      'SELECT id, username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?',
    )
    .bind(userId)
    .first()

  row.avatar = await generatePresignedUrl(row.avatar as string, c.env)
  if (!row) {
    return c.json({ error: 'User not found' }, 404)
  }
  return c.json(row)
})

app.get('/getPersonalArticle/:id', async (c) => {
  const userId = c.req.param('id')
  if (!userId) {
    return c.json({ error: 'request is invalid' }, 401)
  }
  const db = c.env.DB
  const res = await db
    .prepare('SELECT id FROM article WHERE userId = ? LIMIT 10')
    .bind(userId)
    .all()
  const articleIds = res.results.map((row) => row.id)
  const articles: ArticleSimpleInfo[] = []
  for (const articleId of articleIds) {
    const article = await db
      .prepare('SELECT id, title, content, coverUrl FROM article WHERE id = ?')
      .bind(articleId)
      .first()
    let coverUrl: string = ''
    if (article && article.coverUrl && typeof article.coverUrl === 'string') {
      coverUrl = article.coverUrl ? article.coverUrl : ''
      article.coverUrl = await generatePresignedUrl(coverUrl, c.env)
    }
    if (article) {
      articles.push({
        id: article.id as number,
        title: article.title as string,
        abstract: article.content as string,
        coverUrl: article.coverUrl as string,
      })
    }
  }
  return c.json(articles)
})

// 个人信息设置
app.post(`/setting/:id`, async (c) => {
  const userId = c.req.param('id')

  // 使用 parseBody 处理 multipart/form-data
  try {
    const body = await c.req.parseBody()
    const header = c.req.header('Content-Type') || ''
    if (!header.includes('multipart/form-data')) {
      return c.json({ message: '请求格式错误,Content-Type 必须为 multipart/form-data' }, 401)
    }
    const db = c.env.DB
    const updates = []
    const values = []

    // 处理用户名更新
    if (body.username) {
      updates.push('username = ?')
      values.push(body.username)
    } else {
      return c.json({ message: '请求格式错误，缺少用户名' }, 401)
    }

    // 处理密码更新
    if (body.password) {
      updates.push('password = ?')
      values.push(body.password)
    } else {
      return c.json({ message: '请求格式错误，缺少密码' }, 401)
    }

    // 处理文件上传

    if (body.file instanceof File) {
      const file = body.file
      const fileBuffer = await file.arrayBuffer()
      const fileName = `user_${userId}.${file.name.split('.').pop()}`
      const filePath = `usersInfo/avatar/${fileName}`
      console.log('Uploading file to B2 with path:', filePath)

      const uploadUrl = `https://${c.env.B2_BUCKET_NAME}.${c.env.B2_ENDPOINT}/${filePath}`
      const aws = new AwsClient({
        accessKeyId: c.env.B2_KEY_ID,
        secretAccessKey: c.env.B2_APPLICATION_KEY,
        service: 's3',
        region: 'us-west-004',
      })

      // 先尝试删除旧文件(如果存在)
      try {
        await aws.fetch(uploadUrl, {
          method: 'DELETE',
        })
        console.log('Old avatar deleted successfully')
      } catch (deleteError) {
        // 如果文件不存在或删除失败,继续上传新文件
        console.log('No old avatar to delete or delete failed:', deleteError)
      }

      // 上传新文件,使用 x-bz-info-src_last_modified_millis 确保覆盖
      const uploadResponse = await aws.fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'x-bz-info-src_last_modified_millis': Date.now().toString(),
        },
        body: fileBuffer,
      })
      console.log('Upload URL:', uploadUrl)
      if (uploadResponse.ok) {
        updates.push('avatar = ?')
        values.push(filePath)
      } else {
        return c.json({ flag: false, message: '头像上传失败' }, 500)
      }
    }

    // 如果没有任何更新
    if (updates.length === 0) {
      return c.json({ flag: false, message: '没有需要更新的内容' }, 400)
    }

    // 执行数据库更新
    values.push(userId)
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    const userInfo: UserInfo = {
      id: 0,
      username: '',
      password: '',
      followers: 0,
      followings: 0,
      avatar: '',
      dynamicNum: 0,
    }
    const res = await db
      .prepare(sql)
      .bind(...values)
      .run()
    if (res.success === true) {
      try {
        const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()

        if (row.avatar) {
          userInfo.avatar = await generatePresignedUrl(row.avatar as string, c.env)
        }
        if (row.password) {
          userInfo.password = await hashPassword(row.password as string)
        }
        userInfo.id = row.id as number
        userInfo.username = row.username as string
        userInfo.followers = row.followers as number
        userInfo.followings = row.followings as number
        userInfo.dynamicNum = row.dynamicNum as number
      } catch (error) {
        console.error('Error fetching user data:', error)
        return c.json({ flag: false, message: '获取用户数据失败', error: String(error) }, 500)
      }
      return c.json({ flag: true, message: '更新成功', data: userInfo })
    }
  } catch (error) {
    console.error('Error parsing form data:', error)
    return c.json({ flag: false, message: '表单数据解析失败', error: String(error) }, 400)
  }
})

//增加关注
app.post(`/addFollow/:id`, async (c) => {
  const payload = await c.req.json<{ follower: number; followee: number }>()
  const followerId = payload.follower
  const followeeId = payload.followee

  if (followerId === followeeId) {
    return c.json({ isFollow: true, message: '不能关注自己' }, 400)
  }
  const db = c.env.DB
  try {
    // 先检查是否已经关注过
    const existing = await db
      .prepare('SELECT 1 FROM followes WHERE followerId = ? AND followeeId = ?')
      .bind(followerId, followeeId)
      .first()

    if (existing) {
      return c.json({ isFollow: true, message: '已经关注过了' })
    }

    const sql = `INSERT INTO followes (followerId,followeeId) VALUES (?,?)`
    const res = await db.prepare(sql).bind(followerId, followeeId).run()
    if (res.success === true) {
      // 关注成功后，更新用户的关注和粉丝数量
      const res1 = await db
        .prepare('UPDATE users SET followings = followings + 1 WHERE id = ?')
        .bind(followerId)
        .run()
      const res2 = await db
        .prepare('UPDATE users SET followers = followers + 1 WHERE id = ?')
        .bind(followeeId)
        .run()
      if (res1.success !== true || res2.success !== true) {
        return c.json({ isFollow: false, message: '关注失败' }, 500)
      }
    } else {
      return c.json({ isFollow: false, message: '关注失败' }, 500)
    }
    return c.json({ isFollow: true, message: '关注成功' })
  } catch (err) {
    console.error('addFollow error:', err)
    return c.json({ isFollow: false, message: '关注失败', error: String(err) }, 500)
  }
})

app.post(`/removeFollow/:id`, async (c) => {
  const payload = await c.req.json<{ follower: number; followee: number }>()
  const followerId = payload.follower
  const followeeId = payload.followee

  if (followerId === followeeId) {
    return c.json({ isFollow: false, message: '不能取消关注自己' }, 400)
  }
  const db = c.env.DB
  try {
    const sql = `DELETE FROM followes WHERE followerId = ? AND followeeId = ?`
    const res = await db.prepare(sql).bind(followerId, followeeId).run()
    if (res.success === true) {
      // 取消关注成功后，更新用户的关注和粉丝数量
      const res1 = await db
        .prepare('UPDATE users SET followings = followings - 1 WHERE id = ? AND followings > 0')
        .bind(followerId)
        .run()
      const res2 = await db
        .prepare('UPDATE users SET followers = followers - 1 WHERE id = ? AND followers > 0')
        .bind(followeeId)
        .run()
      if (res1.success !== true || res2.success !== true) {
        return c.json({ isFollow: true, message: '取消关注失败' }, 500)
      }
    } else {
      return c.json({ isFollow: true, message: '取消关注失败' }, 500)
    }
    return c.json({ isFollow: false, message: '取消关注成功' })
  } catch (err) {
    console.error('removeFollow error:', err)
    return c.json({ isFollow: true, message: '取消关注失败', error: String(err) }, 500)
  }
})

app.get(`/followList/:id`, async (c) => {
  const userId = c.req.param('id')
  if (!userId) {
    return c.json({ error: 'Missing userId parameter' }, 400)
  }
  const db = c.env.DB
  try {
    const sql = `SELECT followeeId FROM followes WHERE followerId = ?`
    const result = await db.prepare(sql).bind(userId).all()
    const followeeIds = result.results.map((row) => row.followeeId)
    const followees: UserFocusInfo[] = []
    for (let i = 0; i < followeeIds.length; i++) {
      const followeeRow = await db
        .prepare('SELECT id, username, avatar FROM users WHERE id = ?')
        .bind(followeeIds[i])
        .first()
      if (followeeRow) {
        let filePath: string = ''
        if (followeeRow.avatar && typeof followeeRow.avatar === 'string') {
          filePath = followeeRow.avatar
        }
        followeeRow.avatar = await generatePresignedUrl(filePath, c.env)
        followees.push({
          userId: followeeRow.id as number,
          userName: followeeRow.username as string,
          avatar: followeeRow.avatar as string,
          isFollow: true,
        })
      } else {
        return c.json({ error: 'Failed to fetch followee user data' }, 502)
      }
    }

    return c.json(followees)
  } catch (err) {
    console.error('followList error:', err)
    return c.json({ error: 'Failed to fetch follow list', details: String(err) }, 500)
  }
})

app.get(`/followerList/:id`, async (c) => {
  const userId = c.req.param('id')
  if (!userId) {
    return c.json({ error: 'Missing userId parameter' }, 400)
  }
  try {
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database connection not available' }, 501)
    }
    const followerRes = await db
      .prepare('SELECT followerId FROM followes WHERE followeeId = ?')
      .bind(userId)
      .all()
    const followerIds = followerRes.results.map((row) => row.followerId)
    const followers: UserFansInfo[] = []
    // 获取当前用户关注的用户列表，用于判断是否互相关注
    const followeeRes = await db
      .prepare('SELECT followeeId FROM followes WHERE followerId = ?')
      .bind(userId)
      .all()
    const followeeIds = followeeRes.results.map((row) => row.followeeId)
    for (const id of followerIds) {
      const followerRow = await db
        .prepare('SELECT id, username, avatar FROM users WHERE id = ?')
        .bind(id)
        .first()

      if (!followerRow) {
        return c.json({ error: 'Failed to fetch follower user data' }, 502)
      }
      if (followerRow) {
        followerRow.avatar = await generatePresignedUrl(followerRow.avatar as string, c.env)
        // 检查当前用户是否也关注了该粉丝
        followers.push({
          userId: followerRow.id as number,
          userName: followerRow.username as string,
          avatar: followerRow.avatar as string,
          isFollow: followeeIds.includes(followerRow.id as number),
        })
      }
    }
    return c.json(followers)
  } catch (error) {
    console.error('followerList error:', error)
    return c.json({ error: 'Failed to fetch follower list', details: String(error) }, 510)
  }
})

app.get('/getFavoritesArticles/:id', async (c) => {
  const userId = c.req.param('id')
  if (!userId) {
    return c.json({ error: 'Missing userId parameter' }, 401)
  }
  const db = c.env.DB
  if (!db) {
    return c.json({ error: 'Database connection not available' }, 502)
  }
  const res = await db
    .prepare('SELECT articleId FROM favorites WHERE userId = ? AND favorites = 1')
    .bind(userId)
    .all()
  const articleIds = res.results.map((row) => row.articleId)
  const articles: ArticleSimpleInfo[] = []
  for (const articleId of articleIds) {
    const article = await db
      .prepare('SELECT id, title, content FROM article WHERE id = ?')
      .bind(articleId)
      .first()
    let coverUrl: string = ''
    if (article && article.coverUrl && typeof article.coverUrl === 'string') {
      coverUrl = article.coverUrl ? article.coverUrl : ''
      article.coverUrl = await generatePresignedUrl(coverUrl, c.env)
    }
    if (article) {
      articles.push({
        id: article.id as number,
        title: article.title as string,
        abstract: article.content as string,
        coverUrl: article.coverUrl as string,
      })
    }
  }
  return c.json(articles)
})

app.get('/getLikeArticles/:id', async (c) => {
  const userId = c.req.param('id')
  if (!userId) {
    return c.json({ error: 'Missing userId parameter' }, 401)
  }
  const db = c.env.DB
  if (!db) {
    return c.json({ error: 'Database connection not available' }, 502)
  }
  const res = await db
    .prepare('SELECT articleId FROM likes WHERE userId = ? AND likes = 1')
    .bind(userId)
    .all()
  const articleIds = res.results.map((row) => row.articleId)
  const articles: ArticleSimpleInfo[] = []
  for (const articleId of articleIds) {
    const article = await db
      .prepare('SELECT id, title, content, coverUrl FROM article WHERE id = ?')
      .bind(articleId)
      .first()
    let coverUrl: string = ''
    if (article && article.coverUrl && typeof article.coverUrl === 'string') {
      coverUrl = article.coverUrl ? article.coverUrl : ''
      coverUrl = await generatePresignedUrl(coverUrl, c.env)
      article.coverUrl = coverUrl
    }
    if (article) {
      articles.push({
        id: article.id as number,
        title: article.title as string,
        abstract: article.content as string,
        coverUrl: article.coverUrl as string,
      })
    }
  }
  return c.json(articles, 200)
})

app.post('/addHistory', async (c) => {
  const payload = await c.req.json<{ userId: number; articleId: number; viewTime: string }>()
  if (!payload.userId || !payload.articleId || !payload.viewTime) {
    return c.json({ flag: false, message: '缺少必要参数' }, 401)
  }
  const userId = payload.userId
  const articleId = payload.articleId
  let viewTime = payload.viewTime
  viewTime = formatDateTime(viewTime)
  const db = c.env.DB
  if (!db) {
    return c.json({ error: 'Database connection not available' }, 502)
  }
  try {
    await db
      .prepare(
        'INSERT INTO history (userId, articleId, time) VALUES (?, ?, ?) ON CONFLICT(userId, articleId) DO UPDATE SET time = excluded.time',
      )
      .bind(userId, articleId, viewTime)
      .run()
    return c.json({ flag: true, message: '添加历史记录成功' })
  } catch (error) {
    console.error('addHistory error:', error)
    return c.json({ flag: false, message: '添加历史记录失败', details: String(error) }, 510)
  }
})

app.get('/getHistory/:id', async (c) => {
  const userId = c.req.param('id')
  if (!userId) {
    return c.json({ error: 'Missing userId parameter' }, 401)
  }
  const db = c.env.DB
  if (!db) {
    return c.json({ error: 'Database connection not available' }, 502)
  }
  const res = await db
    .prepare('SELECT articleId FROM history WHERE userId = ? ORDER BY time DESC')
    .bind(userId)
    .all()
  const articleIds = res.results.map((row) => row.articleId)
  const articles: ArticleSimpleInfo[] = []
  for (const articleId of articleIds) {
    const article = await db
      .prepare('SELECT id, title, content, coverUrl FROM article WHERE id = ?')
      .bind(articleId)
      .first()
    let coverUrl: string = ''
    if (article && article.coverUrl && typeof article.coverUrl === 'string') {
      coverUrl = article.coverUrl ? article.coverUrl : ''
      article.coverUrl = await generatePresignedUrl(coverUrl, c.env)
    }
    if (article) {
      articles.push({
        id: article.id as number,
        title: article.title as string,
        abstract: article.content as string,
        coverUrl: article.coverUrl as string,
      })
    }
  }
  return c.json(articles)
})

app.post()
export default app

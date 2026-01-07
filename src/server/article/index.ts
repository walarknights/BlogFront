import { Hono } from 'hono'
import { AwsClient } from 'aws4fetch'
import type { Env } from 'src/server/types'
import type { ArticleSimpleInfo } from 'src/server/types'
const app = new Hono<{ Bindings: Env }>()

// 辅助函数：生成预签名 URL
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

// 发布文章
app.post('/setArticle', async (c) => {
  console.log('=== Set article request received ===')

  try {
    const header = c.req.header('Content-Type')
    if (!header || !header.includes('multipart/form-data')) {
      return c.json({ message: '不支持的内容类型' }, 415)
    }
    const body = await c.req.parseBody()
    const userId = body.userId ? Number(body.userId) : null
    const title = body.title as string
    const content = body.content as string
    const type = body.type === 'op1' ? 1 : 0
    const abstract = body.abstract as string
    const link = (body.link as string) || ''
    const file = body.file

    if (!userId || !title) {
      return c.json({ message: '无效的请求参数' }, 400)
    }

    if (!(file instanceof File)) {
      return c.json({ message: '缺少封面文件' }, 400)
    }

    const db = c.env.DB
    if (!db) {
      return c.json({ message: '数据库连接失败' }, 500)
    }
    const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first()
    if (!user) {
      return c.json({ message: '用户Id错误' }, 401)
    }
    const aws = new AwsClient({
      accessKeyId: c.env.B2_KEY_ID,
      secretAccessKey: c.env.B2_APPLICATION_KEY,
      service: 's3',
      region: 'us-west-004',
    })
    const arrayBuffer = await file.arrayBuffer()
    // 上传封面到 B2
    const fileName = `cover_0.${file.name.split('.').pop()}`
    const filePath = `articleCover/${fileName}`
    const uploadUrl = `https://${c.env.B2_BUCKET_NAME}.${c.env.B2_ENDPOINT}/${filePath}`
    console.log('Uploading cover to:', uploadUrl)

    const uploadResponse = await aws.fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: arrayBuffer,
    })
    console.log('Article insert result:')
    if (!uploadResponse.ok) {
      return c.json({ message: '封面上传失败' }, 500)
    }

    // 插入文章记录
    const articleResult = await db
      .prepare(
        'INSERT INTO article (userId, content, title, type, abstract, likes, favorites, link, coverUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(userId, content, title, type, abstract, 0, 0, link, filePath)
      .run()

    if (!articleResult.success) {
      return c.json({ message: '数据库插入失败' }, 500)
    }

    return c.json({ message: '发布成功' }, 200)
  } catch (error) {
    console.error('SetArticle error:', error)
    return c.json({ message: '服务器内部错误', error: String(error) }, 500)
  }
})

// 获取文章详情
app.get('/specific/:id', async (c) => {
  const id = c.req.param('id')
  if (!id) return c.json({ message: '缺少文章id' }, 400)

  const db = c.env.DB
  try {
    const article = await db
      .prepare(
        'SELECT id, userId, content, title, type, abstract, likes, favorites, link, coverUrl FROM article WHERE id = ?',
      )
      .bind(id)
      .first()

    if (!article) {
      return c.json({ message: '未找到对应文章' }, 404)
    }

    const author = await db
      .prepare('SELECT username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?')
      .bind(article.userId)
      .first()

    let coverUrl = '' as string
    if (article.coverUrl === null) {
      coverUrl = ''
    } else {
      coverUrl = article.coverUrl as string
    }

    if (coverUrl) {
      if (coverUrl && !coverUrl.startsWith('http')) {
        coverUrl = await generatePresignedUrl(coverUrl, c.env)
        article.coverUrl = coverUrl
      }
    }

    let avatar = author?.avatar as string
    if (avatar && !avatar.startsWith('http')) {
      avatar = await generatePresignedUrl(avatar, c.env)
      author.avatar = avatar
    }

    return c.json({
      ...article,
      author: {
        ...author,
        avatar,
      },
    })
  } catch (error) {
    console.error('GetArticle error:', error)
    return c.json({ message: '服务器内部错误' }, 500)
  }
})

// 获取文章列表
app.get('/list', async (c) => {
  const db = c.env.DB
  if (!db) {
    console.error('Database connection failed')
    return c.json({ message: '数据库连接失败' }, 500)
  } else {
    console.log('Database connection successful')
  }
  try {
    const { results } = await db
      .prepare(
        'SELECT id, userId, content, title, type, abstract, likes, favorites, link, coverUrl FROM article ORDER BY id DESC LIMIT 4',
      )
      .all()
    if (!results || results.length === 0) {
      console.log('No articles found')

      return c.json({ message: '暂无文章' }, 200)
    }
    const articles = []
    for (const article of results) {
      const author = await db
        .prepare(
          'SELECT username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?',
        )
        .bind(article.userId)
        .first()
      if (!author) {
        console.log(
          `Author not found for article ${article.id as string}, userId: ${article.userId as string}`,
        )
        continue
      }
      let coverUrl = article.coverUrl as string
      if (coverUrl && !coverUrl.startsWith('http')) {
        coverUrl = await generatePresignedUrl(coverUrl, c.env)
        article.coverUrl = coverUrl
      }

      let avatar = author?.avatar as string
      if (avatar && !avatar.startsWith('http')) {
        avatar = await generatePresignedUrl(avatar, c.env)
        author.avatar = avatar
      }

      articles.push({
        ...article,
        author: { ...author },
      })
    }
    return c.json(articles, 202)
  } catch (error) {
    console.error('GetArticleList error:', error)
    return c.json({ message: '服务器内部错误' }, 500)
  }
})

// 搜索文章
app.post('/search', async (c) => {
  try {
    const { q } = await c.req.json<{ q: string }>()
    const keyword = q?.trim()
    const db = c.env.DB

    const { results } = await db
      .prepare(
        'SELECT id, title, abstract, coverUrl FROM article WHERE title LIKE ? ORDER BY likes DESC, id DESC LIMIT 10',
      )
      .bind(`%${keyword}%`)
      .all()

    const articles: ArticleSimpleInfo[] = []
    for (const article of results) {
      try {
        article.coverUrl = await generatePresignedUrl(article.coverUrl as string, c.env)
      } catch (error) {
        console.error('Error generating cover URL:', error)
      }
      const articleNow: ArticleSimpleInfo = {
        id: article.id as number,
        title: article.title as string,
        abstract: article.abstract as string,
        coverUrl: article.coverUrl as string,
      }
      articles.push(articleNow)
    }
    return c.json(articles)
  } catch (error) {
    console.error('SearchArticle error:', error)
    return c.json({ message: '服务器内部错误' }, 500)
  }
})

// 点赞
app.post('/like/:id', async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  try {
    await db
      .prepare(
        `
            INSERT INTO likes (userId, articleId, likes) VALUES (?, ?, 1)
            ON CONFLICT(userId, articleId) DO UPDATE SET likes = 1
        `,
      )
      .bind(userId, articleId)
      .run()

    const result = await db
      .prepare('SELECT likes FROM likes WHERE userId = ? AND articleId = ?')
      .bind(userId, articleId)
      .first()

    if (result) {
      const change = result.likes === 1 ? 1 : 0
      await db
        .prepare('UPDATE article SET likes = likes + ? WHERE id = ?')
        .bind(change, articleId)
        .run()
    }
    return c.json({ message: '操作成功', islike: result?.likes })
  } catch (error) {
    console.error('LikeArticle error:', error)
    return c.json({ error: '操作失败' }, 500)
  }
})

app.post(`/removeLike/:id`, async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  try {
    const res = await db
      .prepare(
        `
            UPDATE likes SET likes = 0 WHERE userId = ? AND articleId = ?
        `,
      )
      .bind(userId, articleId)
      .run()
    if (res.success) {
      const res = await db
        .prepare('UPDATE article SET likes = likes - 1 WHERE id = ?')
        .bind(articleId)
        .run()
      if (!res.success) {
        return c.json({ error: '取消点赞失败' }, 500)
      }
    }
    return c.json({ message: '取消点赞成功', isLike: 0 })
  } catch (error) {
    console.error('UnlikeArticle error:', error)
    return c.json({ error: '取消点赞失败' }, 500)
  }
})

app.post('/isLike/:id', async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  try {
    const result = await db
      .prepare('SELECT likes FROM likes WHERE userId = ? AND articleId = ?')
      .bind(userId, articleId)
      .first()
    const likes = result ? result.likes : 0
    return c.json({ likes }, 200)
  } catch (error) {
    console.error('IsLikeArticle error:', error)
    return c.json({ error: '查询失败' }, 500)
  }
})

// 收藏
app.post('/favorite/:id', async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  try {
    const res = await db
      .prepare(
        `
            INSERT INTO favorites (userId, ArticleId, favorites) VALUES (?, ?, 1)
            ON CONFLICT(userId, ArticleId) DO UPDATE SET favorites = 1
        `,
      )
      .bind(userId, articleId)
      .run()

    if (res.success) {
      const res = await db
        .prepare('UPDATE article SET favorites = favorites + 1 WHERE id = ?')
        .bind(articleId)
        .run()
      if (!res.success) {
        return c.json({ error: '收藏失败' }, 501)
      }
    } else {
      return c.json({ error: '收藏失败' }, 501)
    }
    const result = await db
      .prepare('SELECT favorites FROM favorites WHERE userId = ? AND ArticleId = ?')
      .bind(userId, articleId)
      .first()

    return c.json({ message: '收藏成功', isFavorite: result.favorites ? result.favorites : 0 })
  } catch (error) {
    console.error('FavoriteArticle error:', error)
    return c.json({ error: '收藏失败' }, 510)
  }
})

app.post('/removeFavorite/:id', async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  try {
    const res = await db
      .prepare(
        `
            UPDATE favorites SET favorites = 0 WHERE userId = ? AND ArticleId = ?
        `,
      )
      .bind(userId, articleId)
      .run()
    if (res.success) {
      const res = await db
        .prepare('UPDATE article SET favorites = favorites - 1 WHERE id = ?')
        .bind(articleId)
        .run()
      if (!res.success) {
        return c.json({ error: '取消收藏失败' }, 500)
      }
    }
    return c.json({ message: '取消收藏成功', isFavorite: 0 })
  } catch (error) {
    console.error('UnfavoriteArticle error:', error)
    return c.json({ error: '取消收藏失败' }, 500)
  }
})

app.post('/isFavorite/:id', async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  try {
    const result = await db
      .prepare('SELECT favorites FROM favorites WHERE userId = ? AND ArticleId = ?')
      .bind(userId, articleId)
      .first()

    return c.json({ favorites: result?.favorites || 0 })
  } catch (error) {
    console.error('IsFavoriteArticle error:', error)
    return c.json({ error: '查询失败' }, 500)
  }
})

app.post(`/removeFavorite/:id`, async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  try {
    await db
      .prepare(
        `
            UPDATE favorites SET favorites = 0 WHERE userId = ? AND ArticleId = ?
        `,
      )
      .bind(userId, articleId)
      .run()

    return c.json({ message: '取消收藏成功' })
  } catch (error) {
    console.error('UnfavoriteArticle error:', error)
    return c.json({ error: '取消收藏失败' }, 500)
  }
})

// 查询是否点赞
app.post('/isLike/:id', async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  const result = await db
    .prepare('SELECT likes FROM likes WHERE userId = ? AND articleId = ?')
    .bind(userId, articleId)
    .first()
  const likes = result ? result.likes : 0
  const query = !!result

  return c.json({ likes, query, userId })
})

// 查询是否收藏
app.post('/isFavorite/:id', async (c) => {
  const articleId = c.req.param('id')
  const { userId } = await c.req.json<{ userId: number }>()
  const db = c.env.DB

  const result = await db
    .prepare('SELECT favorites FROM favorites WHERE userId = ? AND articleId = ?')
    .bind(userId, articleId)
    .first()
  const favorites = result ? result.favorites : 0

  return c.json({ favorites })
})

// 获取评论
app.get('/comments/:id', async (c) => {
  const articleId = c.req.param('id')
  const db = c.env.DB

  try {
    const { results } = await db
      .prepare(
        `
            SELECT c.*,
                pc.userId as parent_user_id,
                pc.userName as parent_user_name,
                pc.userAvatar as parent_user_avatar
            FROM comments c
            LEFT JOIN comments pc ON c.parentId = pc.id
            WHERE c.articleId = ?
            ORDER BY c.rootId ASC, c.createdAt ASC
        `,
      )
      .bind(articleId)
      .all()

    const comments = await Promise.all(
      results.map(async (row) => {
        let userAvatar = row.userAvatar as string
        if (userAvatar && !userAvatar.startsWith('http')) {
          userAvatar = await generatePresignedUrl(userAvatar, c.env)
        }

        let parentUserAvatar = row.parent_user_avatar as string
        if (parentUserAvatar && !parentUserAvatar.startsWith('http')) {
          parentUserAvatar = await generatePresignedUrl(parentUserAvatar, c.env)
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const comment: any = {
          commentId: row.id,
          content: row.content,
          userId: row.userId,
          userName: row.userName,
          userAvatar: userAvatar,
          articleId: row.articleId,
          createdAt: row.createdAt,
          parentId: row.parentId,
          rootId: row.rootId,
          parentUser: null,
        }

        if (row.parent_user_id) {
          comment.parentUser = {
            userId: row.parent_user_id,
            userName: row.parent_user_name,
            userAvatar: parentUserAvatar,
          }
        }
        return comment
      }),
    )

    return c.json(comments)
  } catch (error) {
    console.error('GetComments error:', error)
    return c.json({ error: 'Failed to fetch comments' }, 500)
  }
})

// 添加评论
app.post('/addComment/:id', async (c) => {
  try {
    const input = await c.req.json<{
      articleId: number
      userId: number

      content: string
      parentId?: number
    }>()

    const db = c.env.DB
    const createdAt = new Date().toISOString()
    const userInfo = await db
      .prepare('SELECT username, avatar FROM users WHERE id = ?')
      .bind(input.userId)
      .first()
    if (!userInfo) {
      return c.json({ error: 'Invalid userId' }, 400)
    }
    const user = {
      userName: userInfo.username as string,
      userAvatar: userInfo.avatar as string,
    }
    const result = await db
      .prepare(
        'INSERT INTO comments (content, userId, userName, userAvatar, articleId, createdAt, parentId, rootId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        input.content,
        input.userId,
        user.userName,
        user.userAvatar,
        input.articleId,
        createdAt,
        input.parentId || null,
        0,
      )
      .run()
    if (!result.success) {
      return c.json({ error: 'Failed to add comment' }, 500)
    }
    const commentId = result.meta.last_row_id
    let rootId = commentId

    if (input.parentId) {
      const parent = await db
        .prepare('SELECT rootId FROM comments WHERE id = ?')
        .bind(input.parentId)
        .first()
      if (parent) {
        rootId = parent.rootId as number
      }
    }

    await db.prepare('UPDATE comments SET rootId = ? WHERE id = ?').bind(rootId, commentId).run()

    return c.json(
      {
        comment: {
          id: commentId,
          articleId: input.articleId,
          userId: input.userId,
          userName: user.userName,
          userAvatar: user.userAvatar,
          content: input.content,
          parentId: input.parentId,
          rootId: rootId,
          createdAt,
        },
      },
      201,
    )
  } catch (error) {
    console.error('AddComment error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

export default app

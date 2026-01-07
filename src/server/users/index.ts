import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { AwsClient } from 'aws4fetch'

import type { Env } from 'src/server/types'
import { User } from 'src/server/types'

const app = new Hono<{ Bindings: Env }>()

const checkPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const hash = await hashPassword(password)
  return hash === hashedPassword
}

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// 生成 S3 预签名 URL 的辅助函数
const generatePresignedUrl = async (avatarPath: string, env: Env): Promise<string> => {
  try {
    const aws = new AwsClient({
      accessKeyId: env.B2_KEY_ID,
      secretAccessKey: env.B2_APPLICATION_KEY,
      service: 's3',
      region: 'us-west-004',
    })

    // 移除开头的 / (如果存在)
    const filePath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath

    // 构建 S3 URL
    const s3Url = `https://${env.B2_BUCKET_NAME}.${env.B2_ENDPOINT}/${filePath}`

    // 生成预签名 URL（有效期 1 小时 = 3600 秒）
    const signedRequest = await aws.sign(s3Url, {
      method: 'GET',
      aws: {
        signQuery: true,
      },
    })

    return signedRequest.url
  } catch (error) {
    console.error('Failed to generate signed URL:', error)
    // 如果签名失败，返回公开访问 URL
    const filePath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath
    return `https://${env.B2_BUCKET_NAME}.${env.B2_ENDPOINT}/${filePath}`
  }
}

// 示例：健康检查
app.get('/list', (c) => c.json({ message: 'User API is working!' }))

app.get('/getInfo', async (c) => {
  const db = c.env.DB
  const payload = await c.req.json<{ id: number }>()
  const results = await db
    .prepare(
      'SELECT id, username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?',
    )
    .bind(payload.id)
    .first()
  return c.json(results ?? [])
})

app.post('/login', async (c) => {
  try {
    const payload = await c.req.json<{ username: string; password: string }>()
    if (!payload?.username || !payload?.password) {
      return c.json({ error: 'username and password are required' }, 400)
    }

    const db = c.env.DB
    if (!db) {
      console.error('Database not available in environment')
      return c.json({ message: '数据库连接失败' }, 500)
    }

    const result = await db
      .prepare('SELECT password FROM users WHERE username = ?')
      .bind(payload.username)
      .first()

    if (!result) {
      return c.json({ message: '不存在该用户' }, 401)
    }
    const hashedPassword = result.password as string
    if (!(await checkPassword(payload.password, hashedPassword))) {
      return c.json({ message: '密码错误' }, 401)
    }
    const userInfo = await db
      .prepare(
        'SELECT id, username, followers, followings, avatar, dynamicNum FROM users WHERE username = ?',
      )
      .bind(payload.username)
      .first()

    if (!userInfo) {
      return c.json({ message: '获取用户信息失败' }, 500)
    }

    // 生成 S3 预签名 URL
    let avatar = userInfo.avatar as string

    // 如果有 avatar 路径，生成预签名 URL
    if (avatar) {
      try {
        avatar = await generatePresignedUrl(avatar, c.env)
      } catch (error) {
        console.error('Failed to generate signed URL:', error)
        // 如果签名失败，使用公开访问 URL
        const filePath = avatar.startsWith('/') ? avatar.substring(1) : avatar
        avatar = `https://${c.env.B2_BUCKET_NAME}.${c.env.B2_ENDPOINT}/${filePath}`
      }
    } else {
      // 如果没有 avatar，使用默认头像
      avatar = '/usersInfo/avatar/user_0.png'
      try {
        const aws = new AwsClient({
          accessKeyId: c.env.B2_KEY_ID,
          secretAccessKey: c.env.B2_APPLICATION_KEY,
          service: 's3',
          region: 'us-west-004',
        })

        const s3Url = `https://${c.env.B2_BUCKET_NAME}.${c.env.B2_ENDPOINT}/usersInfo/avatar/user_0.png`
        const signedRequest = await aws.sign(s3Url, {
          method: 'GET',
          aws: {
            signQuery: true,
          },
        })

        avatar = signedRequest.url.toString()
      } catch (error) {
        console.error('Failed to generate default avatar signed URL:', error)
        avatar = `https://${c.env.B2_BUCKET_NAME}.${c.env.B2_ENDPOINT}/usersInfo/avatar/user_0.png`
      }
    }

    userInfo.avatar = avatar
    const userResponse: User = {
      userId: userInfo.id as number,
      username: userInfo.username as string,
      followers: (userInfo.followers as number) || 0,
      following: (userInfo.followings as number) || 0,
      avatar: (userInfo.avatar as string) || '/usersInfo/avatar/user_0.png',
      dynamicNum: (userInfo.dynamicNum as number) || 0,
      isLogin: true,
    }

    const token = await sign(
      {
        userId: userResponse.userId,
        username: userResponse.username,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      c.env.JWT_SECRET,
    )

    return c.json({ userResponse, token })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ message: '服务器错误', error: String(error) }, 500)
  }
})

app.post('/verifyToken', async (c) => {
  console.log('Veify Token request received')

  try {
    const payload = await c.req.json<{ token: string }>()
    if (!payload?.token) {
      return c.json({ valid: false, message: 'Token is required' }, 400)
    }

    const decoded = await verify(payload.token, c.env.JWT_SECRET)

    const db = c.env.DB
    const userInfo = await db
      .prepare(
        'SELECT id, username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?',
      )
      .bind(decoded.userId)
      .first()

    if (!userInfo) {
      return c.json({ valid: false, message: 'User not found' }, 404)
    }

    let avatar = userInfo.avatar as string
    if (!avatar) {
      avatar = '/usersInfo/avatar/user_0.png'
    }

    avatar = await generatePresignedUrl(avatar, c.env)

    const userResponse: User = {
      userId: userInfo.id as number,
      username: userInfo.username as string,
      followers: (userInfo.followers as number) || 0,
      following: (userInfo.followings as number) || 0,
      avatar: avatar,
      dynamicNum: (userInfo.dynamicNum as number) || 0,
      isLogin: true,
    }

    return c.json({ valid: true, userResponse })
  } catch (error) {
    console.error('Verify Token error:', error)
    return c.json({ valid: false, message: '无效的 Token 或验证失败', error: String(error) }, 401)
  }
})

app.post('/setUser', async (c) => {
  try {
    const payload = await c.req.json<{ username: string; password: string }>()
    if (!payload?.username || !payload?.password) {
      return c.json({ error: 'username and password are required' }, 400)
    }
    const db = c.env.DB
    if (!db) {
      console.error('Database not available in environment')
      return c.json({ message: '数据库连接失败' }, 500)
    }

    await db
      .prepare(
        'INSERT INTO users (username, password, followers, followings, avatar, dynamicNum) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(
        payload.username,
        await hashPassword(payload.password),
        0,
        0,
        '/usersInfo/avatar/user_0.png',
        0,
      )
      .run()
    const result = await db
      .prepare('SELECT id FROM users WHERE username = ?')
      .bind(payload.username)
      .first()
    if (!result) {
      return c.json({ message: '用户创建失败' }, 500)
    }
    const userResponse: User = {
      userId: result.id as number,
      username: payload.username,
      followers: 0,
      following: 0,
      avatar: '/usersInfo/avatar/user_0.png',
      dynamicNum: 0,
      isLogin: true,
    }
    const jwtToken = await sign(
      {
        userId: userResponse.userId,
        username: userResponse.username,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      c.env.JWT_SECRET,
    )
    return c.json({ message: '注册成功', user: userResponse, token: jwtToken })
  } catch (error) {
    console.error('SetUser error:', error)
    return c.json({ message: '服务器错误', error: String(error) }, 500)
  }
})
// 根据 ID 获取用户信息

export default app

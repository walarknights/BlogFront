import { Hono } from 'hono'
import { AwsClient } from 'aws4fetch'

import { Env } from '../types'
const app = new Hono<{ Bindings: Env }>()
app.get('/list', (c) => c.json({ message: 'User API is working!' }))
app.post('/upload', async (c) => {
  const contentType = c.req.header('Content-Type')
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return c.json({ error: 'Unsupported content type' }, 415)
  }

  try {
    // 使用 parseBody 处理 multipart/form-data
    const body = await c.req.parseBody()
    console.log('Parsed body keys:', Object.keys(body))
    console.log('body.file type:', typeof body.file, body.file instanceof File)

    if (!body.file) {
      return c.json(
        {
          error: 'No file provided',
          availableFields: Object.keys(body),
        },
        400,
      )
    }

    if (!(body.file instanceof File)) {
      return c.json(
        {
          error: 'Invalid file type',
          receivedType: typeof body.file,
        },
        400,
      )
    }

    const file = body.file
    const arrayBuffer = await file.arrayBuffer()

    const fileName = `user_0.${file.name.split('.').pop()}`
    const filePath = `usersInfo/avatar/${fileName}`

    const aws = new AwsClient({
      accessKeyId: c.env.B2_KEY_ID, // Application Key ID
      secretAccessKey: c.env.B2_APPLICATION_KEY, // Application Key
      service: 's3',
      region: 'us-west-004', // 改成你的 bucket 所在 region
    })

    // 使用正确的 endpoint 格式
    const uploadUrl = `https://${c.env.B2_BUCKET_NAME}.${c.env.B2_ENDPOINT}/${filePath}`
    console.log('Upload URL:', uploadUrl)

    const uploadResponse = await aws.fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: arrayBuffer,
    })

    if (uploadResponse.ok) {
      console.log('File uploaded successfully')
      return c.json({ message: 'File uploaded successfully' }, 202)
    } else {
      const errorText = await uploadResponse.text()
      console.log('Upload failed:', uploadResponse.status, errorText)
      return c.json(
        {
          error: 'Upload failed',
          status: uploadResponse.status,
          details: errorText,
        },
        500,
      )
    }
  } catch (error) {
    console.log('Upload error:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    )
  }
})

export default app

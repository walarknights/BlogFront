import { Hono } from 'hono'

export interface Env {
  DB: D1Database
  B2_ENDPOINT: string
  B2_KEY_ID: string
  B2_APPLICATION_KEY: string
  B2_BUCKET_NAME: string
  JWT_SECRET: string
}

// article 类型定义
export interface Article {
  id: number
  title: string
  content: string
  authorId: number
  createdAt: string
  abstract: string
  coverUrl: string
}

// user 类型定义
export interface User {
  userId: number
  username: string
  followers: number
  following: number
  avatar: string
  dynamicNum: number
  isLogin: boolean
}

export interface UserInfo {
  id: number
  username: string
  password: string
  followers: number
  followings: number
  avatar: string
  dynamicNum: number
}

// 文章信息类型
export interface ArticleSimpleInfo {
  id: number
  title: string
  abstract: string
  coverUrl: string
}

// 关注用户信息类型
export interface UserFocusInfo {
  userName: string
  avatar: string
  userId: number
  isFollow: boolean
}

// 粉丝用户信息类型
export interface UserFansInfo {
  userName: string
  avatar: string
  userId: number
  isFollow: boolean
}

// 关注请求参数
export interface FocusRequest {
  focusId: number
  focusedId: number
}

// 个人设置请求参数
export interface PersonalSettingRequest {
  username?: string
  password?: string
  avatar?: string
}
// 创建一个带类型的 Hono App 类型，方便在各模块中使用
export type HonoApp = Hono<{ Bindings: Env }>

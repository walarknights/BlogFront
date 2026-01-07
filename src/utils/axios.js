import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 100000,

  withCredentials: true,
})

// 添加请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('authToken')

    // 如果存在 token,添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 添加响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('响应错误:', error.response.data)
    } else if (error.request) {
      console.error('请求错误:', error.request)
    } else {
      console.error('其他错误:', error.message)
    }
    return Promise.reject(error)
  },
)

export default api

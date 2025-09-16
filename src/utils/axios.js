import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8010',
  timeout: 5000,

  withCredentials: true,
})

// 添加请求拦截器

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

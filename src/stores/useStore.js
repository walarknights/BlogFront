import { defineStore, acceptHMRUpdate } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    username: '',
    followers: 0,
    following: 0,
    dynamic: 0,
    isLoggedIn: false,
    avatar: 'img/default.png',
  }),
  actions: {
    setUser(data) {
      // 使用解构赋值和空值合并运算符来安全地设置值
      const {
        userId,
        username,
        followers = 0,
        following = 0,
        dynamicNum = 0,
        avatar = 'img/default.png',
        isLogin,
      } = data

      this.userId = userId

      this.username = username
      this.followers = followers
      this.following = following
      this.isLoggedIn = isLogin
      this.dynamic = dynamicNum
      this.avatar = avatar
    },
    logout() {
      this.userId = null
      this.username = ''
      this.followers = 0
      this.following = 0
      this.isLoggedIn = false
      this.dynamic = 0
      this.avatar = 'img/default.png'
    },
    incrementFollowing() {
      this.following++
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}

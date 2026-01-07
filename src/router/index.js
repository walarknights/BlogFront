import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import { useQuasar } from 'quasar'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // 路由守卫: 检查需要认证的路由
  Router.beforeEach((to, from, next) => {
    const $q = useQuasar()
    const token = localStorage.getItem('authToken')

    // 需要认证的路由列表
    const requiresAuth = ['Create', 'Setting']

    if (requiresAuth.includes(to.name) && !token) {
      $q.notify({
        type: 'warning',
        message: '请先登录以访问此页面',
        position: 'top',
      })
      // 未登录,重定向到首页
      next({ name: 'HomeM' })
    } else {
      next()
    }
  })

  return Router
})

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/HomeM.vue'), name: 'HomeM' },
      {
        path: '/Create',
        component: () => import('src/pages/CreateCenter.vue'),
        name: 'Create',
      },
      {
        path: '/articles/:id',
        component: () => import('src/pages/ArticlePage.vue'),
        name: 'ArticlePage',
      },
      {
        path: '/personalHome/:userId',
        component: () => import('src/pages/PersonalHomepage.vue'),
        name: 'Personal',
      },
      {
        path: '/setting/:userId',
        component: () => import('src/pages/PersonalSetting.vue'),
        name: 'Setting',
      },
      {
        path: '/success',
        component: () => import('src/pages/SuccessPage.vue'),
        name: 'Success',
      },
      {
        path: '/favorite/:userId',
        component: () => import('src/pages/FavoritePage.vue'),
        name: 'Favorite',
      },
      {
        path: '/search',
        component: () => import('src/pages/SearchPage.vue'),
        name: 'SearchPage',
      },
      {
        path: '/history/:userId',
        component: () => import('src/pages/HistoryPage.vue'),
        name: 'History',
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes

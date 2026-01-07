<template>
  <div>
    <q-card>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="article" label="文章主页" />
        <q-tab name="focus" label="关注列表" />
        <q-tab name="fans" label="粉丝列表" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="article" class="q-pa-none" style="height: 500px">
          <q-splitter v-model="splitterModel">
            <template v-slot:before>
              <q-tabs
                v-model="innerTab"
                vertical
                class="custom-tabs column justify-evenly"
                active-color="negative"
                indicator-color="negative"
                style="height: 500px"
              >
                <q-tab name="innerarticle" icon="sym_o_token" label="代表作" />
                <q-tab name="innerfocus" icon="sym_o_favorite" label="最近收藏" />
                <q-tab name="innerfans" icon="sym_o_recommend" label="最近点赞" />
              </q-tabs>
            </template>

            <template v-slot:after>
              <q-tab-panels
                v-model="innerTab"
                animated
                transition-prev="jump-up"
                transition-next="jump-up"
                style="height: 500px; min-width: 800px"
              >
                <q-tab-panel name="innerarticle" style="height: 100%">
                  <ArticleList />
                </q-tab-panel>

                <q-tab-panel name="innerfocus">
                  <FavoriteList />
                </q-tab-panel>

                <q-tab-panel name="innerfans">
                  <LikeList />
                </q-tab-panel>
              </q-tab-panels>
            </template>
          </q-splitter>
        </q-tab-panel>

        <q-tab-panel name="focus" style="height: 500px">
          <FocusList />
        </q-tab-panel>

        <q-tab-panel name="fans" style="height: 500px">
          <FansList />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FocusList from './FocusList.vue'
import FansList from './FansList.vue'
import ArticleList from './ArticleList.vue'
import LikeList from './LikeList.vue'
import FavoriteList from './FavoriteList.vue'
const tab = ref('article')
const innerTab = ref('innerarticle')
const splitterModel = ref<number>(20)
</script>
<style>
.vertical-tabs .q-tabs__content {
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 垂直方向均匀分布 */
}

.vertical-tabs .q-tab {
  flex: 1; /* 每个 tab 占据相等高度 */
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平居中 */
  justify-content: center; /* 垂直居中 */
}

.custom-tabs .q-tab {
  color: rgb(14, 165, 224) !important; /* 未选中tab文字和图标为灰色 */
}
.custom-tabs .q-tab--active {
  color: #f44336 !important; /* 选中tab为红色，可根据active-color设置 */
}
</style>

import { createRouter, createWebHashHistory } from 'vue-router'
import AntiqueList from '../views/AntiqueList.vue'
import MyBids from '../views/MyBids.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: AntiqueList,
  },
  {
    path: '/mybids',
    name: 'My Bids',
    component: MyBids,
  },
]

const router = createRouter({ history: createWebHashHistory(), routes })
export default router

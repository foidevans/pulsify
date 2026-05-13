import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ECharts from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  CandlestickChart,
  HeatmapChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
   VisualMapComponent, 
} from 'echarts/components'

import { LegacyGridContainLabel } from 'echarts/features' 

import App from './App.vue'
import router  from './router'
import './assets/main.css'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  CandlestickChart,
   HeatmapChart,     
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
    VisualMapComponent, 
   LegacyGridContainLabel, 
])

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.component('VChart', ECharts)

app.mount('#app')
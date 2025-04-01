<template>
  <div class="glass-view">
    <!-- 顶部横幅 -->
    <div class="hero-section">
      <div class="hero-overlay"></div>
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">玻璃切割优化</h1>
          <p class="hero-subtitle">智能优化切割方案，最大化材料利用率，降低成本</p>
        </div>
      </div>
    </div>

    <div class="container main-content">
      <div class="row g-4">
        <!-- 输入区域 -->
        <div class="col-lg-4 input-section">
          <!-- 原料规格卡片 -->
          <div class="card input-card glass-card mb-4">
            <div class="card-body">
              <h3 class="card-title">
                <i class="icon-wrapper"><el-icon><IconSheet /></el-icon></i>
                原料规格
              </h3>
              <form @submit.prevent="calculateOptimization">
                <!-- 原料清单 -->
                <div class="mb-3">
                  <div class="input-list-header">
                    <label class="form-label">原料清单</label>
                  </div>
                  <div v-for="(stock, index) in stockList" :key="index" class="mb-2">
                    <div class="d-flex stock-item">
                      <div class="flex-grow-1 d-flex">
                        <input type="number" class="form-control" v-model="stock.width" placeholder="宽度(mm)" required
                          min="0" step="1">
                        <button type="button" class="btn btn-outline-secondary swap-btn" @click="swapDimensions(stock)"
                          title="交换宽高">
                          <el-icon><IconSwap /></el-icon>
                        </button>
                        <input type="number" class="form-control" v-model="stock.height" placeholder="高度(mm)" required
                          min="0" step="1">
                        <input type="number" class="form-control" v-model="stock.price" placeholder="单价" required min="0"
                          step="0.01">
                      </div>
                      <button type="button" class="btn btn-danger ms-2 d-flex align-items-center delete-btn"
                        @click="removeStockItem(index)" :disabled="stockList.length === 1">
                        <el-icon><IconDelete /></el-icon>
                      </button>
                    </div>
                  </div>
                  <button type="button" class="btn btn-add w-100 mb-3" @click="addStockItem">
                    <el-icon><IconPlus /></el-icon>添加原料规格
                  </button>
                </div>

                <!-- 切割清单 -->
                <div class="mb-3">
                  <div class="input-list-header">
                    <label class="form-label">切割清单</label>
                  </div>
                  <div v-for="(item, index) in cutList" :key="index" class="mb-2">
                    <div class="d-flex cut-item">
                      <div class="flex-grow-1 d-flex">
                        <input type="number" class="form-control" v-model="item.width" placeholder="宽度(mm)" required min="0"
                          step="1">
                        <button type="button" class="btn btn-outline-secondary swap-btn" @click="swapDimensions(item)"
                          title="交换宽高">
                          <el-icon><IconSwap /></el-icon>
                        </button>
                        <input type="number" class="form-control" v-model="item.height" placeholder="高度(mm)" required
                          min="0" step="1">
                        <input type="number" class="form-control" v-model="item.quantity" placeholder="数量" required min="1"
                          step="1">
                      </div>
                      <button type="button" class="btn btn-danger ms-2 d-flex align-items-center delete-btn"
                        @click="removeCutItem(index)">
                        <el-icon><IconDelete /></el-icon>
                      </button>
                    </div>
                  </div>
                  <button type="button" class="btn btn-add w-100" @click="addCutItem">
                    <el-icon><IconPlus /></el-icon>添加切割项
                  </button>
                </div>

                <button type="submit" class="btn btn-primary w-100 mb-3 calculate-btn">
                  <el-icon><IconCalculator /></el-icon>计算优化方案
                </button>
              </form>
            </div>
          </div>

          <!-- 导入导出卡片 -->
          <div class="card input-card glass-card mb-4">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="card-title mb-0">
                  <i class="icon-wrapper"><el-icon><IconImport /></el-icon></i>
                  数据导入导出
                </h3>
                <a href="#" class="text-primary text-decoration-none" @click.prevent="downloadTemplate" title="下载Excel模板">
                  <el-icon><IconDownload /></el-icon>
                  <small class="ms-1">下载模板</small>
                </a>
              </div>
              <div class="import-export-buttons">
                <div class="btn-item">
                  <button class="action-button" @click="importFromExcel" title="从Excel导入">
                    <el-icon><IconExcel /></el-icon>
                  </button>
                  <span class="btn-label">从Excel导入</span>
                </div>
                <div class="btn-item">
                  <button class="action-button" @click="exportToExcel" title="导出到Excel">
                    <el-icon><IconExcelExport /></el-icon>
                  </button>
                  <span class="btn-label">导出到Excel</span>
                </div>
                <div class="btn-item">
                  <button class="action-button" @click="exportToImage" title="导出到图片">
                    <el-icon><IconPicture /></el-icon>
                  </button>
                  <span class="btn-label">导出到图片</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 结果展示区域 -->
        <div class="col-lg-8">
          <!-- 优化结果统计 -->
          <div class="card result-card glass-card mb-4">
            <div class="card-body">
              <h3 class="card-title">
                <i class="icon-wrapper"><el-icon><IconChartPie /></el-icon></i>
                优化结果统计
              </h3>
              <div class="row g-4">
                <div class="col-md-3 col-6">
                  <div class="stats-item">
                    <div class="stats-icon">
                      <el-icon><IconPercentage /></el-icon>
                    </div>
                    <div class="stats-value">{{ utilization.toFixed(2) }}%</div>
                    <div class="stats-label">材料利用率</div>
                  </div>
                </div>
                <div class="col-md-3 col-6">
                  <div class="stats-item">
                    <div class="stats-icon">
                      <el-icon><IconLayers /></el-icon>
                    </div>
                    <div class="stats-value">{{ totalSheets }}</div>
                    <div class="stats-label">需要原料数</div>
                  </div>
                </div>
                <div class="col-md-3 col-6">
                  <div class="stats-item">
                    <div class="stats-icon">
                      <el-icon><IconWaste /></el-icon>
                    </div>
                    <div class="stats-value">{{ (wasteArea / 1000000).toFixed(2) }}m²</div>
                    <div class="stats-label">总废料面积</div>
                  </div>
                </div>
                <div class="col-md-3 col-6">
                  <div class="stats-item">
                    <div class="stats-icon">
                      <el-icon><IconMoney /></el-icon>
                    </div>
                    <div class="stats-value">¥{{ totalCost }}</div>
                    <div class="stats-label">总成本</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 原料使用统计 -->
          <div class="card result-card glass-card mb-4">
            <div class="card-body">
              <h3 class="card-title">
                <i class="icon-wrapper"><el-icon><IconStatistics /></el-icon></i>
                原料使用统计
              </h3>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>原料规格</th>
                      <th>单价</th>
                      <th>使用数量</th>
                      <th>总价</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(stat, index) in materialUsageStats" :key="index">
                      <td>{{ stat.spec }}</td>
                      <td>¥{{ stat.price }}</td>
                      <td>{{ stat.quantity }}块</td>
                      <td>¥{{ stat.total }}</td>
                    </tr>
                    <tr class="table-info">
                      <td colspan="2"><strong>合计</strong></td>
                      <td><strong>{{ totalSheets }}块</strong></td>
                      <td><strong>¥{{ totalCost }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 详细切割方案 -->
          <div class="card result-card glass-card mb-4">
            <div class="card-body">
              <h3 class="card-title">
                <i class="icon-wrapper"><el-icon><IconCut /></el-icon></i>
                详细切割方案
              </h3>
              <div v-if="cuttingPlan.length">
                <div v-for="(group, groupIndex) in groupedCuttingPlans" :key="groupIndex" class="cutting-plan-group mb-4">
                  <!-- 原料规格标题栏 -->
                  <div class="stock-header">
                    <div class="stock-info">
                      <div class="d-flex align-items-center justify-content-between w-100">
                        <h4 class="stock-title">
                          <el-icon><IconStock /></el-icon>
                          <span>板材</span>
                          <span class="stock-dimensions">({{ group.spec }})</span>
                        </h4>
                        <div class="utilization-display" :class="getUtilizationClass(group.utilization)">
                          <el-icon><IconPercentage /></el-icon>
                          <span>利用率: {{ group.utilization.toFixed(2) }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 每块板材的切割信息 -->
                  <div v-for="(sheet, sheetKey) in group.sheets" :key="sheetKey" class="sheet-item">
                    <div class="sheet-header" @click="toggleSheetExpansion(sheet.sheetIndex)">
                      <span class="sheet-number">#{{ sheet.sheetIndex + 1 }}</span>
                      <div class="sheet-progress-wrapper">
                        <div class="sheet-progress">
                          <div class="progress-bar" :class="getUtilizationClass(sheet.utilization)"
                            :style="{ width: sheet.utilization + '%' }" role="progressbar">
                            <span>{{ sheet.utilization.toFixed(2) }}%</span>
                          </div>
                        </div>
                      </div>
                      <el-icon class="toggle-icon" :class="{'is-expanded': expandedSheets.has(sheet.sheetIndex)}">
                        <IconChevron />
                      </el-icon>
                    </div>

                    <div v-show="expandedSheets.has(sheet.sheetIndex)" class="sheet-content">
                      <div class="cuts-container">
                        <!-- 切割项信息 -->
                        <div v-for="(placement, index) in sheet.placements" :key="index" class="cut-item-card">
                          <div class="cut-header">
                            <div class="cut-header-left">
                              <span class="cut-dimensions">{{ placement.width }}×{{ placement.height }}mm</span>
                              <span v-if="placement.rotated" class="cut-rotated" title="已旋转">
                                <el-icon><IconRotate /></el-icon>
                              </span>
                            </div>
                          </div>
                          <div class="cut-details">
                            <div class="position-item">
                              <el-icon><IconPosition /></el-icon>
                              <span>位置: ({{ placement.x }},{{ placement.y }})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 余料信息 -->
                      <div v-if="sheet.remainingSpaces && sheet.remainingSpaces.length > 0" class="waste-spaces">
                        <div class="waste-area">
                          <el-icon><IconWastePiece /></el-icon>
                          <span>余料: {{ (sheet.wasteArea / 1000000).toFixed(2) }}m²</span>
                        </div>
                        <div class="remaining-spaces">
                          <div v-for="(space, spaceIndex) in sheet.remainingSpaces" :key="spaceIndex" class="space-item">
                            <span class="space-dimensions">{{ space.width }}×{{ space.height }}mm</span>
                            <span class="space-position">({{ space.x }},{{ space.y }})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <el-icon><IconEmpty /></el-icon>
                <p>暂无切割方案</p>
              </div>
            </div>
          </div>

          <!-- 切割方案可视化 -->
          <div class="card result-card glass-card mb-4">
            <div class="card-body">
              <h3 class="card-title">
                <i class="icon-wrapper"><el-icon><IconVisualization /></el-icon></i>
                切割方案可视化
              </h3>
              <div class="cutting-visualization" ref="visualizationContainer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, h } from 'vue'
import * as d3 from 'd3'
import ExcelJS from 'exceljs'
// 引入优化算法
import optimizeCuts from '../utils/CuttingOptimizer';
import { ElMessage } from 'element-plus';
import { Icon } from '@iconify/vue';

// 图标组件
const IconSheet = () => h(Icon, { icon: 'tabler:notebook', width: '20', height: '20' });
const IconSwap = () => h(Icon, { icon: 'tabler:arrows-exchange', width: '16', height: '16' });
const IconDelete = () => h(Icon, { icon: 'tabler:trash', width: '16', height: '16' });
const IconPlus = () => h(Icon, { icon: 'tabler:plus', width: '16', height: '16' });
const IconCalculator = () => h(Icon, { icon: 'tabler:calculator', width: '18', height: '18' });
const IconImport = () => h(Icon, { icon: 'tabler:file-import', width: '20', height: '20' });
const IconDownload = () => h(Icon, { icon: 'tabler:download', width: '16', height: '16' });
const IconExcel = () => h(Icon, { icon: 'tabler:file-spreadsheet', width: '20', height: '20' });
const IconExcelExport = () => h(Icon, { icon: 'tabler:file-export', width: '20', height: '20' });
const IconPicture = () => h(Icon, { icon: 'tabler:photo', width: '20', height: '20' });
const IconChartPie = () => h(Icon, { icon: 'tabler:chart-pie', width: '20', height: '20' });
const IconPercentage = () => h(Icon, { icon: 'tabler:percentage', width: '20', height: '20' });
const IconLayers = () => h(Icon, { icon: 'tabler:layers-intersect', width: '20', height: '20' });
const IconWaste = () => h(Icon, { icon: 'tabler:trash', width: '20', height: '20' });
const IconMoney = () => h(Icon, { icon: 'tabler:currency-yuan', width: '20', height: '20' });
const IconStatistics = () => h(Icon, { icon: 'tabler:chart-bar', width: '20', height: '20' });
const IconCut = () => h(Icon, { icon: 'tabler:cut', width: '20', height: '20' });
const IconStock = () => h(Icon, { icon: 'tabler:box', width: '18', height: '18' });
const IconChevron = () => h(Icon, { icon: 'tabler:chevron-down', width: '16', height: '16' });
const IconRotate = () => h(Icon, { icon: 'tabler:refresh', width: '14', height: '14' });
const IconPosition = () => h(Icon, { icon: 'tabler:map-pin', width: '14', height: '14' });
const IconWastePiece = () => h(Icon, { icon: 'tabler:square', width: '14', height: '14' });
const IconEmpty = () => h(Icon, { icon: 'tabler:mood-empty', width: '40', height: '40' });
const IconVisualization = () => h(Icon, { icon: 'tabler:chart-area', width: '20', height: '20' });

// 状态定义
const stockList = ref([
  { width: 2440, height: 1220, price: 1000 }  // 默认一个原料材料尺寸
])
const cutList = ref([{ width: 600, height: 500, quantity: 5, canRotate: true },{ width: 700, height: 400, quantity: 4, canRotate: true }]) // 默认一个切割项
const sawKerf = ref(4)  // 切割损耗默认为4mm

// 添加必要的响应式变量
const cuttingPlan = ref([])
const expandedSheets = ref(new Set())
const utilization = ref(0)
const totalSheets = ref(0)
const wasteArea = ref(0)
const totalCost = ref(0)
const materialUsageStats = ref([])
const showAdvancedSettings = ref(false)
const optimizationStrategy = ref('utilization')
const layoutStrategy = ref('any')
const firstCutDirection = ref('none')

// 计算属性
const groupedCuttingPlans = computed(() => {
  // 按规格分组
  const groups = new Map()
  
  cuttingPlan.value.forEach((plan, index) => {
    const spec = `${plan.stock.width}×${plan.stock.height}`
    if (!groups.has(spec)) {
      groups.set(spec, {
        spec,
        utilization: 0,
        sheets: []
      })
    }
    const group = groups.get(spec)
    group.sheets.push({
      ...plan,
      sheetIndex: index
    })
    // 更新组的利用率
    group.utilization = plan.utilization
  })
  
  return Array.from(groups.values())
})

// 添加全局图例项计算属性
const globalLegendItems = computed(() => {
  if (!cuttingPlan.value.length) return [];
  
  // 收集所有不同尺寸的切割项
  const sizeSet = new Set();
  const items = [];
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
  cuttingPlan.value.forEach(plan => {
    plan.placements.forEach(placement => {
      const size = `${placement.width}×${placement.height}mm`;
      if (!sizeSet.has(size)) {
        sizeSet.add(size);
        items.push({
          size,
          color: colorScale(items.length)
        });
      }
    });
  });
  
  return items;
});

// 方法
const getUtilizationClass = (utilization) => {
  if (utilization >= 85) return 'high-utilization'
  if (utilization >= 70) return 'medium-utilization'
  return 'low-utilization'
}

const toggleSheetExpansion = (sheetIndex) => {
  if (expandedSheets.value.has(sheetIndex)) {
    expandedSheets.value.delete(sheetIndex)
  } else {
    expandedSheets.value.add(sheetIndex)
  }
}

const swapDimensions = (item) => {
  const temp = item.width
  item.width = item.height
  item.height = temp
  // 交换完成后自动执行计算优化
  calculateOptimization()
}

const addStockItem = () => {
  stockList.value.push({ width: 0, height: 0, price: 0 })
}

const removeStockItem = (index) => {
  stockList.value.splice(index, 1)
}

const addCutItem = () => {
  cutList.value.push({ width: 0, height: 0, quantity: 1, canRotate: true })
}

const removeCutItem = (index) => {
  cutList.value.splice(index, 1)
}

const calculateOptimization = () => {
  console.log('%c=== 开始优化计算 ===', 'color: #2196F3; font-weight: bold');
  console.log('输入参数:');
  console.log('原料清单:', JSON.stringify(stockList.value, null, 2));
  console.log('切割清单:', JSON.stringify(cutList.value, null, 2));
  console.log('切割损耗:', sawKerf.value, 'mm');

  // 验证原料清单
  if (stockList.value.length === 0) {
    console.error('错误: 请添加至少一个原料规格');
    ElMessage.error('请添加至少一个原料规格');
    return;
  }

  // 验证原料规格的宽度、高度和价格
  const invalidStock = stockList.value.some(stock => stock.width <= 0 || stock.height <= 0 || stock.price <= 0);
  if (invalidStock) {
    console.error('错误: 原料的宽度、高度和价格必须大于0');
    ElMessage.error('原料的宽度、高度和价格必须大于0');
    return;
  }

  // 验证切割清单
  if (cutList.value.length === 0) {
    console.error('错误: 请添加至少一个切割项');
    ElMessage.error('请添加至少一个切割项');
    return;
  }

  // 验证切割项的宽度、高度和数量
  const invalidCut = cutList.value.some(cut => cut.width <= 0 || cut.height <= 0 || cut.quantity <= 0);
  if (invalidCut) {
    console.error('错误: 切割项的宽度、高度和数量必须大于0');
    ElMessage.error('切割项的宽度、高度和数量必须大于0');
    return;
  }

  // 验证切割项尺寸不能大于最大原料尺寸
  const maxStockWidth = Math.max(...stockList.value.map(stock => stock.width));
  const maxStockHeight = Math.max(...stockList.value.map(stock => stock.height));
  
  const invalidSize = cutList.value.some(cut => {
    // 如果允许旋转，检查两种方向都不能放下
    if (cut.canRotate) {
      return (cut.width > maxStockWidth && cut.width > maxStockHeight) || 
             (cut.height > maxStockWidth && cut.height > maxStockHeight);
    }
    // 如果不允许旋转，直接检查当前方向
    return cut.width > maxStockWidth || cut.height > maxStockHeight;
  });
  
  if (invalidSize) {
    console.error('错误: 切割项尺寸不能大于原料尺寸');
    ElMessage.error('切割项尺寸不能大于原料尺寸');
    return;
  }

  // 验证切割损耗
  if (sawKerf.value < 0) {
    console.error('错误: 切割损耗不能小于0');
    ElMessage.error('切割损耗不能小于0');
    return;
  }

  console.log('数据验证通过，开始计算优化方案...');
  console.time('优化计算耗时');

  const config = {
    optimizationStrategy: optimizationStrategy.value,
    layoutStrategy: layoutStrategy.value,
    firstCutDirection: firstCutDirection.value,
    sawKerf: sawKerf.value  // 添加切割损耗参数
  };
  
  const result = optimizeCuts(stockList.value, cutList.value, config);
  console.timeEnd('优化计算耗时');
  console.log('%c优化结果：', 'color: #4CAF50; font-weight: bold', result);

  if (result && result.plans.length > 0) {
    cuttingPlan.value = result.plans;
    utilization.value = result.totalUtilization;
    totalSheets.value = result.sheetsCount;
    wasteArea.value = result.totalWasteArea;
    totalCost.value = result.totalCost;
    
    // 自动展开第一个切割方案作为示例
    if (cuttingPlan.value.length > 0) {
      expandedSheets.value.add(0);
    }
    
    // 更新材料使用统计
    const usageMap = new Map();
    result.plans.forEach(plan => {
      const spec = `${plan.stock.width}×${plan.stock.height}`;
      if (!usageMap.has(spec)) {
        usageMap.set(spec, {
          spec,
          price: plan.stock.price,
          quantity: 1,
          total: plan.stock.price
        });
      } else {
        const stat = usageMap.get(spec);
        stat.quantity++;
        stat.total = stat.quantity * stat.price;
      }
    });
    
    materialUsageStats.value = Array.from(usageMap.values());

    console.log('%c=== 优化结果统计 ===', 'color: #9C27B0; font-weight: bold');
    console.log('总原料数:', totalSheets.value, '块');
    console.log('材料利用率:', utilization.value.toFixed(2), '%');
    console.log('总废料面积:', (wasteArea.value/1000000).toFixed(2), 'm²');
    console.log('总成本:', totalCost.value.toFixed(2), '元');
    console.log('材料使用统计:', materialUsageStats.value);

    // 使用消息通知用户计算完成
    ElMessage.success(`计算完成! 材料利用率: ${utilization.value.toFixed(2)}%`);

    // 更新可视化
    nextTick(() => {
      updateVisualization(result.plans);
      console.log('可视化更新完成');
    });
  } else {
    console.error('错误: 无法生成切割方案');
    ElMessage.error('无法生成切割方案，请检查输入数据');
  }
}

// 更新可视化方法
const updateVisualization = (plans) => {
  const container = d3.select(visualizationContainer.value)
  container.selectAll('*').remove()

  const margin = { top: 40, right: 40, bottom: 40, left: 40 }
  const containerWidth = container.node().getBoundingClientRect().width - margin.left - margin.right
  const width = Math.max(800, containerWidth)
  const height = 600

  // 创建SVG
  const svg = container
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', (height + margin.top + margin.bottom) * plans.length)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 生成颜色比例尺
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

  // 添加全局图例
  const legend = svg.append('g')
    .attr('class', 'global-legend')
    .attr('transform', `translate(${width - 200}, -30)`)

  // 收集所有不同尺寸的切割项
  const sizeSet = new Set();
  const legendItems = [];
  
  plans.forEach(plan => {
    plan.placements.forEach(placement => {
      const size = `${placement.width}×${placement.height}mm`;
      if (!sizeSet.has(size)) {
        sizeSet.add(size);
        legendItems.push({
          size,
          color: colorScale(legendItems.length)
        });
      }
    });
  });
  
  // 添加图例项
  const legendItem = legend.selectAll('.legend-item')
    .data(legendItems)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`)

  legendItem.append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('rx', 2)
    .attr('fill', d => d.color)

  legendItem.append('text')
    .attr('x', 20)
    .attr('y', 12)
    .text(d => d.size)
    .attr('font-size', '12px')
    .attr('fill', '#fff')

  // 为每个板材创建一个组
  plans.forEach((plan, planIndex) => {
    const planGroup = svg.append('g')
      .attr('transform', `translate(0,${planIndex * (height + margin.top + margin.bottom)})`)

    // 计算缩放比例
    const scale = Math.min(
      width / plan.stock.width,
      height / plan.stock.height
    )

    // 绘制原料板材
    planGroup.append('rect')
      .attr('class', 'stock-sheet')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', plan.stock.width * scale)
      .attr('height', plan.stock.height * scale)
      .attr('fill', '#6a6a6a')
      .attr('stroke', '#dee2e6')

    // 添加网格线
    const gridSize = 100
    for (let x = gridSize; x < plan.stock.width; x += gridSize) {
      planGroup.append('line')
        .attr('x1', x * scale)
        .attr('y1', 0)
        .attr('x2', x * scale)
        .attr('y2', plan.stock.height * scale)
        .attr('stroke', '#eee')
        .attr('stroke-dasharray', '2,2')
    }
    for (let y = gridSize; y < plan.stock.height; y += gridSize) {
      planGroup.append('line')
        .attr('x1', 0)
        .attr('y1', y * scale)
        .attr('x2', plan.stock.width * scale)
        .attr('y2', y * scale)
        .attr('stroke', '#eee')
        .attr('stroke-dasharray', '2,2')
    }

    // 添加板材标题和信息
    planGroup.append('text')
      .attr('class', 'stock-label')
      .attr('x', 10)
      .attr('y', -10)
      .text(`板材 ${planIndex + 1} (${plan.stock.width}×${plan.stock.height}mm) - 利用率: ${plan.utilization.toFixed(2)}%`)
      .attr('fill', '#fff')

    // 按位置分组切割件
    const groupedPlacements = new Map()
    plan.placements.forEach((placement, i) => {
      const key = `${placement.width}×${placement.height}`
      if (!groupedPlacements.has(key)) {
        groupedPlacements.set(key, [])
      }
      groupedPlacements.get(key).push({...placement, index: i})
    })

    // 绘制切割件
    Array.from(groupedPlacements.entries()).forEach(([size, placements], groupIndex) => {
      const pieces = planGroup.selectAll(`.cut-piece-${groupIndex}`)
        .data(placements)
        .enter()
        .append('g')
        .attr('class', `cut-piece-${groupIndex}`)
        .attr('transform', d => `translate(${d.x * scale},${d.y * scale})`)

      // 绘制矩形
      pieces.append('rect')
        .attr('width', d => d.width * scale)
        .attr('height', d => d.height * scale)
        .attr('fill', colorScale(groupIndex))
        .attr('stroke', 'white')
        .attr('stroke-width', 1)

      // 添加尺寸标签
      pieces.append('text')
        .attr('x', d => d.width * scale / 2)
        .attr('y', d => d.height * scale / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .text(size)

      // 添加位置编号
      pieces.append('text')
        .attr('x', d => d.width * scale / 2)
        .attr('y', d => d.height * scale / 2 + 20)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .text((d, i) => `位置 ${i + 1}: (${d.x},${d.y})`)

      // 添加旋转标记
      pieces.filter(d => d.rotated)
        .append('text')
        .attr('x', d => d.width * scale - 15)
        .attr('y', 15)
        .attr('text-anchor', 'end')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .text('↻')
    })
  })
}

// 添加可视化容器引用
const visualizationContainer = ref(null)

// 添加 onMounted 钩子自动执行计算
onMounted(() => {
  calculateOptimization()
})

// 导入导出功能
const downloadTemplate = async () => {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  
  // 创建原料清单工作表
  const stockSheet = workbook.addWorksheet('原料清单');
  stockSheet.columns = [
    { header: '序号', width: 10 },
    { header: '宽度(mm)', width: 15 },
    { header: '高度(mm)', width: 15 },
    { header: '单价(元)', width: 15 }
  ];
  
  // 添加示例数据
  stockSheet.addRow([1, 2440, 1220, 1000]);
  
  // 创建切割清单工作表
  const cutSheet = workbook.addWorksheet('切割清单');
  cutSheet.columns = [
    { header: '序号', width: 10 },
    { header: '宽度(mm)', width: 15 },
    { header: '高度(mm)', width: 15 },
    { header: '数量(件)', width: 15 }
  ];
  
  // 添加示例数据
  cutSheet.addRows([
    [1, 800, 600, 3],
    [2, 500, 400, 2],
    [3, 350, 300, 4]
  ]);
  
  // 设置表头样式
  [stockSheet, cutSheet].forEach(sheet => {
    sheet.getRow(1).font = { name: '微软雅黑', size: 11, bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDEBF7' }
    };
    
    // 添加说明行
    sheet.insertRow(1, ['请按照以下格式填写数据']);
    sheet.getRow(1).font = { name: '微软雅黑', size: 12, bold: true, color: { argb: 'FF0000FF' } };
    sheet.mergeCells('A1:D1');
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '板材下料优化方案模板.xlsx';
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success('模板下载成功');
}

const importFromExcel = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  
  input.onchange = async (e) => {
    try {
      const file = e.target.files[0];
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      // 读取原料清单
      const stockSheet = workbook.getWorksheet('原料清单');
      if (stockSheet) {
        const stockData = [];
        stockSheet.eachRow((row, rowNumber) => {
          // 跳过前两行（说明行和表头）
          if (rowNumber > 2) {
            const [_, sn, width, height, price] = row.values;
            if (width && height && price) {
              stockData.push({
                width: Number(width),
                height: Number(height),
                price: Number(price)
              });
            }
          }
        });
        if (stockData.length > 0) {
          stockList.value = stockData;
        }
      }
      
      // 读取切割清单
      const cutSheet = workbook.getWorksheet('切割清单');
      if (cutSheet) {
        const cutData = [];
        cutSheet.eachRow((row, rowNumber) => {
          // 跳过前两行（说明行和表头）
          if (rowNumber > 2) {
            const [_, sn, width, height, quantity] = row.values;
            if (width && height && quantity) {
              cutData.push({
                width: Number(width),
                height: Number(height),
                quantity: Number(quantity),
                canRotate: true
              });
            }
          }
        });
        if (cutData.length > 0) {
          cutList.value = cutData;
        }
      }
      
      ElMessage.success('数据导入成功');
      // 导入后自动计算优化方案
      calculateOptimization();
      
    } catch (error) {
      console.error('导入Excel文件时出错:', error);
      ElMessage.error('导入失败，请确保文件格式正确');
    }
  };
  
  input.click();
}

const exportToExcel = async () => {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('切割优化方案');

  // 设置列宽
  worksheet.columns = [
    { width: 15 },  // A列
    { width: 15 },  // B列
    { width: 80 },  // C列
    { width: 15 }  // D列
  ];

  // 准备数据
  const data = [
    ['板材下料优化方案'],
    [],  // 空行
    ['原料尺寸清单'],
    ['序号', '宽度(mm)', '高度(mm)', '单价(元)'],
    ...stockList.value.map((stock, index) => [
      index + 1, 
      stock.width,
      stock.height,
      stock.price
    ]),
    [],  // 空行
    ['下料尺寸清单'],
    ['序号', '宽度(mm)', '高度(mm)', '数量(件)'],
    ...cutList.value.map((cut, index) => [
      index + 1, 
      cut.width,
      cut.height,
      cut.quantity
    ]),
    [],  // 空行
    ['切割优化方案'],
    ['原料编号', '原料规格', '切割明细', '利用率(%)'],
    ...cuttingPlan.value.map((plan, index) => [
      index + 1,
      `${plan.stock.width}×${plan.stock.height}`,
      plan.placements.map(p => `${p.width}×${p.height}mm`).join('，'),
      `${plan.utilization.toFixed(2)}%`
    ]),
    [],  // 空行
    ['总计数据'],
    ['总原料数(块)', '材料利用率(%)', '总废料面积(m²)', '总成本(元)'],
    [
      totalSheets.value,
      `${utilization.value.toFixed(2)}%`,
      (wasteArea.value/1000000).toFixed(2),
      totalCost.value.toFixed(2)
    ]
  ];

  // 添加数据到工作表
  worksheet.addRows(data);

  // 设置合并单元格
  worksheet.mergeCells('A1:D1');  // 主标题

  // 应用样式
  worksheet.eachRow((row, rowNumber) => {
    // 设置行高
    row.height = 25;

    row.eachCell((cell) => {
      // 基础样式
      cell.font = { name: '微软雅黑', size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };

      // 定义行号常量
      const TITLE_ROW = 1;
      const STOCK_LIST_LENGTH = stockList.value.length;
      const CUT_LIST_LENGTH = cutList.value.length;
      const CUTTING_PLAN_LENGTH = cuttingPlan.value.length;

      const SUBTITLE_ROWS = [
        3,
        6 + STOCK_LIST_LENGTH,
        9 + STOCK_LIST_LENGTH + CUT_LIST_LENGTH,
        12 + STOCK_LIST_LENGTH + CUT_LIST_LENGTH + CUTTING_PLAN_LENGTH
      ];

      // 特殊样式
      if (rowNumber === TITLE_ROW) {
        // 主标题
        cell.font = { name: '微软雅黑', size: 16, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF9BC2E6' }
        };
      } else if (SUBTITLE_ROWS.includes(rowNumber)) {
        // 子标题
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2F0D9' }
        };
      } else if (SUBTITLE_ROWS.includes(rowNumber - 1)) {
        // 表头
        cell.font = { name: '微软雅黑', size: 11, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDDEBF7' }
        };
      }
    });
  });

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '板材下料优化方案.xlsx';
  link.click();
  URL.revokeObjectURL(url);
  
  ElMessage.success('导出Excel成功');
}

// 在script部分添加导出图片方法
const exportToImage = () => {
  if (!visualizationContainer.value) return;
  
  try {
    // 获取SVG元素
    const svg = visualizationContainer.value.querySelector('svg');
    if (!svg) {
      console.warn('未找到SVG元素');
      ElMessage.warning('未找到可视化图表');
      return;
    }

    // 创建一个SVG的克隆，以便修改而不影响原始SVG
    const clonedSvg = svg.cloneNode(true);
  
    // 设置白色背景
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'white');
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);

    // 将SVG转换为字符串
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clonedSvg);
    
    // 创建Blob
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // 创建Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 创建图片对象
    const img = new Image();
    img.onload = () => {
      // 设置Canvas尺寸
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图片
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // 转换为PNG并下载
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `切割方案_${new Date().toISOString().slice(0,10)}.png`;
      downloadLink.click();
      
      // 清理
      URL.revokeObjectURL(url);
      
      ElMessage.success('导出图片成功');
    };
    
    img.src = url;
  } catch (error) {
    console.error('导出图片时出错:', error);
    ElMessage.error('导出图片失败');
  }
}

// 添加滚动到计算器区域的方法
const scrollToCalculator = () => {
  const calculatorElement = document.querySelector('.input-section')
  if (calculatorElement) {
    calculatorElement.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
.glass-view {
  min-height: 100vh;
  background-color: var(--dark-bg, #1e1e1e);
  color: var(--light-text, #e0e0e0);
}

/* 顶部横幅 */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 3rem 0;
  margin-bottom: 2rem;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  background-size: 300px 300px;
  opacity: 0.6;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(120deg, #ffd700, #fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.2rem;
  max-width: 800px;
  margin: 0 auto;
  opacity: 0.8;
}

.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main-content {
  padding: 1rem 0 3rem;
}

/* 卡片样式 */
.glass-card {
  background: rgba(42, 42, 42, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.glass-card:hover {
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.card-body {
  padding: 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  position: relative;
  font-weight: 600;
}

.card-title::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  border-radius: 3px;
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(145deg, #2a2a2a, #1c1c1c);
  color: #4facfe;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* 输入区域 */
.input-section {
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding-right: 1rem;
}

.input-section::-webkit-scrollbar {
  width: 6px;
}

.input-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.input-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.input-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.input-card {
  margin-bottom: 1.5rem;
}

.input-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.form-label {
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 0;
}

/* 输入项样式 */
.stock-item,
.cut-item {
  background-color: rgba(45, 45, 45, 0.6);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: stretch;
  height: 38px;
  transition: all 0.3s ease;
}

.stock-item:hover,
.cut-item:hover {
  border-color: rgba(79, 172, 254, 0.5);
}

.stock-item .flex-grow-1,
.cut-item .flex-grow-1 {
  flex: 1;
  display: flex;
  align-items: stretch;
}

.stock-item .form-control,
.cut-item .form-control {
  border: none;
  border-radius: 0;
  padding: 0.5rem;
  flex: 1;
  min-width: 0;
  text-align: center;
  background-color: transparent;
  color: #e0e0e0;
  transition: all 0.3s ease;
}

.stock-item .form-control:focus,
.cut-item .form-control:focus {
  background-color: rgba(79, 172, 254, 0.1);
  box-shadow: none;
}

.swap-btn {
  width: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(60, 60, 60, 0.5);
  color: #aaa;
  transition: all 0.2s ease;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.swap-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  color: #4facfe;
}

.delete-btn {
  width: 38px;
  margin: 0;
  padding: 0;
  border: none;
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.4);
  color: #fff;
}

.delete-btn:disabled {
  opacity: 0.5;
  background: rgba(220, 53, 69, 0.1);
  color: rgba(220, 53, 69, 0.5);
}

/* 按钮样式 */
.btn-add {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.03);
  color: #e0e0e0;
  border-radius: 8px;
  padding: 0.5rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-add:hover {
  background-color: rgba(79, 172, 254, 0.1);
  border-color: rgba(79, 172, 254, 0.3);
  color: #4facfe;
}

.calculate-btn {
  background: linear-gradient(to right, #4facfe, #00f2fe);
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(79, 172, 254, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  font-weight: 600;
}

.calculate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(79, 172, 254, 0.4);
}

/* 导入导出按钮 */
.import-export-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.action-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a2a2a, #1c1c1c);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4facfe;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(79, 172, 254, 0.3);
  background: linear-gradient(145deg, #1c1c1c, #2a2a2a);
}

.btn-label {
  font-size: 0.8rem;
  color: #aaa;
  white-space: nowrap;
}

/* 结果卡片样式 */
.result-card {
  margin-bottom: 1.5rem;
}

/* 统计数据样式 */
.stats-item {
  padding: 1.5rem 1rem;
  background: rgba(50, 50, 50, 0.3);
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stats-item:hover {
  background: rgba(79, 172, 254, 0.1);
  border-color: rgba(79, 172, 254, 0.2);
  transform: translateY(-3px);
}

.stats-icon {
  font-size: 1.5rem;
  color: #4facfe;
  margin-bottom: 0.5rem;
}

.stats-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.25rem;
}

.stats-label {
  color: #aaa;
  font-size: 0.9rem;
}

/* 表格样式 */
.table {
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.1);
}

.table th {
  background-color: rgba(50, 50, 50, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
  font-weight: 600;
  padding: 0.75rem;
}

.table td {
  border-color: rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
}

.table-info {
  background-color: rgba(79, 172, 254, 0.1);
}

/* 切割方案样式 */
.cutting-plan-group {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stock-header {
  background-color: rgba(50, 50, 50, 0.5);
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.stock-title {
  font-size: 1rem;
  margin: 0;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stock-dimensions {
  color: #aaa;
  font-weight: normal;
  margin-left: 0.5rem;
}

.utilization-display {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.high-utilization {
  color: #2ecc71;
}

.medium-utilization {
  color: #f1c40f;
}

.low-utilization {
  color: #e74c3c;
}

.sheet-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.sheet-item:last-child {
  border-bottom: none;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  background-color: rgba(40, 40, 40, 0.5);
  transition: all 0.3s ease;
}

.sheet-header:hover {
  background-color: rgba(50, 50, 50, 0.7);
}

.sheet-number {
  font-weight: 500;
  color: #aaa;
  min-width: 35px;
}

.sheet-progress-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

.sheet-progress {
  flex: 1;
  height: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
  transition: width 0.6s ease;
  border-radius: 6px;
  background-size: 1rem 1rem;
}

.progress-bar.high-utilization {
  background-color: #2ecc71;
  background-image: linear-gradient(45deg, 
    rgba(255,255,255,.15) 25%, 
    transparent 25%, 
    transparent 50%, 
    rgba(255,255,255,.15) 50%, 
    rgba(255,255,255,.15) 75%, 
    transparent 75%, 
    transparent);
  animation: progress-bar-stripes 1s linear infinite;
}

.progress-bar.medium-utilization {
  background-color: #f1c40f;
  background-image: linear-gradient(45deg, 
    rgba(255,255,255,.15) 25%, 
    transparent 25%, 
    transparent 50%, 
    rgba(255,255,255,.15) 50%, 
    rgba(255,255,255,.15) 75%, 
    transparent 75%, 
    transparent);
  animation: progress-bar-stripes 1s linear infinite;
}

.progress-bar.low-utilization {
  background-color: #e74c3c;
  background-image: linear-gradient(45deg, 
    rgba(255,255,255,.15) 25%, 
    transparent 25%, 
    transparent 50%, 
    rgba(255,255,255,.15) 50%, 
    rgba(255,255,255,.15) 75%, 
    transparent 75%, 
    transparent);
  animation: progress-bar-stripes 1s linear infinite;
}

@keyframes progress-bar-stripes {
  from { background-position: 1rem 0; }
  to { background-position: 0 0; }
}

.toggle-icon {
  transition: transform 0.3s ease;
}

.toggle-icon.is-expanded {
  transform: rotate(180deg);
}

.sheet-content {
  padding: 1rem;
  background-color: rgba(35, 35, 35, 0.5);
}

.cuts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.cut-item-card {
  background-color: rgba(45, 45, 45, 0.6);
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.cut-item-card:hover {
  background-color: rgba(50, 50, 50, 0.8);
  border-color: rgba(79, 172, 254, 0.2);
  transform: translateY(-2px);
}

.cut-header {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.cut-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cut-dimensions {
  font-weight: 500;
  color: #e0e0e0;
}

.cut-rotated {
  color: #aaa;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cut-details {
  padding-top: 0.25rem;
}

.position-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  color: #aaa;
  font-size: 0.9rem;
}

.waste-spaces {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.waste-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e74c3c;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.remaining-spaces {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
}

.space-item {
  background-color: rgba(45, 45, 45, 0.5);
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.space-dimensions {
  color: #e0e0e0;
  font-weight: 500;
}

.space-position {
  color: #aaa;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: #aaa;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* 切割方案可视化 */
.cutting-visualization {
  width: 100%;
  overflow-x: auto;
  min-height: 600px;
  background-color: rgba(30, 30, 30, 0.5);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.cutting-visualization svg {
  display: block;
  width: 100%;
  height: auto;
  min-width: 800px;
}

.stock-sheet {
  fill: #2d2d2d;
  stroke: #444;
  stroke-width: 1px;
}

.stock-label {
  font-size: 14px;
  font-weight: bold;
  fill: #e0e0e0;
}

.global-legend {
  fill: #e0e0e0;
  font-family: Arial, sans-serif;
  font-size: 12px;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .input-section {
    position: relative;
    top: 0;
    height: auto;
    overflow-y: visible;
    padding-right: 0;
    margin-bottom: 2rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .stats-item {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .stats-value {
    font-size: 1.25rem;
  }
  
  .cuts-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .cutting-visualization {
    min-height: 400px;
  }
  
  .table-responsive {
    margin: 0 -1rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 0;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
  
  .stats-item {
    padding: 0.75rem;
  }
  
  .stats-icon {
    font-size: 1.25rem;
  }
  
  .stats-value {
    font-size: 1.1rem;
  }
  
  .stats-label {
    font-size: 0.8rem;
  }
  
  .sheet-header {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .cuts-container {
    grid-template-columns: 1fr;
  }
  
  .remaining-spaces {
    grid-template-columns: 1fr;
  }
  
  .import-export-buttons {
    flex-wrap: wrap;
    gap: 1.5rem;
  }
}

@media (max-width: 576px) {
  .hero-title {
    font-size: 1.75rem;
  }
  
  .hero-subtitle {
    font-size: 0.9rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .card-title {
    font-size: 1.1rem;
    margin-bottom: 1.25rem;
  }
  
  .stock-header {
    padding: 0.75rem;
  }
  
  .stock-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .utilization-display {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .sheet-progress {
    height: 10px;
  }
  
  .cut-item-card {
    padding: 0.5rem;
  }
  
  .cut-dimensions {
    font-size: 0.9rem;
  }
  
  .position-item,
  .waste-area {
    font-size: 0.8rem;
  }
  
  .space-item {
    padding: 0.35rem;
  }
  
  .space-dimensions {
    font-size: 0.8rem;
  }
  
  .space-position {
    font-size: 0.75rem;
  }
}
</style> 
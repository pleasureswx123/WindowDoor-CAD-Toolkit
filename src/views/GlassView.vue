<template>

  <div class="row">
    <!-- 输入区域 -->
    <div class="col-lg-4 input-section">
      <div class="card mb-4">
        <div class="card-body">
          <h3 class="card-title mb-4">原料规格</h3>
          <form @submit.prevent="calculateOptimization">
            <!-- 原料清单 -->
            <div class="mb-3">
              <label class="form-label">原料清单</label>
              <div v-for="(stock, index) in stockList" :key="index" class="mb-2">
                <div class="d-flex stock-item">
                  <div class="flex-grow-1 d-flex">
                    <input type="number" class="form-control" v-model="stock.width" placeholder="宽度(mm)" required
                      min="0" step="1">
                    <button type="button" class="btn btn-outline-secondary swap-btn" @click="swapDimensions(stock)"
                      title="交换宽高">
                      <i class="fas fa-exchange-alt"></i>
                    </button>
                    <input type="number" class="form-control" v-model="stock.height" placeholder="高度(mm)" required
                      min="0" step="1">
                    <input type="number" class="form-control" v-model="stock.price" placeholder="单价" required min="0"
                      step="0.01">
                  </div>
                  <button type="button" class="btn btn-danger ms-2 d-flex align-items-center delete-btn"
                    @click="removeStockItem(index)" :disabled="stockList.length === 1">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-success w-100 mb-3" @click="addStockItem">
                <i class="fas fa-plus me-2"></i>添加原料规格
              </button>
            </div>

            <!-- 切割清单 -->
            <div class="mb-3">
              <label class="form-label">切割清单</label>
              <div v-for="(item, index) in cutList" :key="index" class="mb-2">
                <div class="d-flex cut-item">
                  <div class="flex-grow-1 d-flex">
                    <input type="number" class="form-control" v-model="item.width" placeholder="宽度(mm)" required min="0"
                      step="1">
                    <button type="button" class="btn btn-outline-secondary swap-btn" @click="swapDimensions(item)"
                      title="交换宽高">
                      <i class="fas fa-exchange-alt"></i>
                    </button>
                    <input type="number" class="form-control" v-model="item.height" placeholder="高度(mm)" required
                      min="0" step="1">
                    <input type="number" class="form-control" v-model="item.quantity" placeholder="数量" required min="1"
                      step="1">
                  </div>
                  <button type="button" class="btn btn-danger ms-2 d-flex align-items-center delete-btn"
                    @click="removeCutItem(index)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-success w-100" @click="addCutItem">
                <i class="fas fa-plus me-2"></i>添加切割项
              </button>
            </div>

            <button type="submit" class="btn btn-primary w-100 mb-3">
              <i class="fas fa-calculator me-2"></i>计算优化方案
            </button>

          </form>
        </div>
      </div>

      <!-- 导入导出 -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h3 class="card-title mb-0">数据导入导出</h3>
            <a href="#" class="text-primary text-decoration-none" @click.prevent="downloadTemplate" title="下载Excel模板">
              <i class="fas fa-file-download"></i>
              <small class="ms-1">下载Excel模板</small>
            </a>
          </div>
          <div class="d-flex justify-content-between">
            <div class="btn-icon-with-label">
              <button class="btn btn-icon" @click="importFromExcel" title="从Excel导入">
                <i class="fas fa-file-import text-success"></i>
              </button>
              <span class="btn-label">从Excel导入</span>
            </div>
            <div class="btn-icon-with-label">
              <button class="btn btn-icon" @click="exportToExcel" title="导出到Excel">
                <i class="fas fa-file-export text-success"></i>
              </button>
              <span class="btn-label">导出到Excel</span>
            </div>
            <div class="btn-icon-with-label">
              <button class="btn btn-icon" @click="exportToImage" title="导出到图片">
                <i class="fas fa-images text-success"></i>
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
      <div class="card mb-4">
        <div class="card-body">
          <h3 class="card-title mb-4">优化结果统计</h3>
          <div class="row g-4">
            <div class="col-md-3">
              <div class="stats-item text-center">
                <div class="stats-icon mb-2">
                  <i class="fas fa-percentage"></i>
                </div>
                <div class="stats-value">{{ utilization.toFixed(2) }}%</div>
                <div class="stats-label">材料利用率</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stats-item text-center">
                <div class="stats-icon mb-2">
                  <i class="fas fa-layer-group"></i>
                </div>
                <div class="stats-value">{{ totalSheets }}</div>
                <div class="stats-label">需要原料数</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stats-item text-center">
                <div class="stats-icon mb-2">
                  <i class="fas fa-trash-alt"></i>
                </div>
                <div class="stats-value">{{ (wasteArea / 1000000).toFixed(2) }}m²</div>
                <div class="stats-label">总废料面积</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stats-item text-center">
                <div class="stats-icon mb-2">
                  <i class="fas fa-yen-sign"></i>
                </div>
                <div class="stats-value">¥{{ totalCost }}</div>
                <div class="stats-label">总成本</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 原料使用统计 -->
      <div class="card mb-4">
        <div class="card-body">
          <h3 class="card-title mb-4">原料使用统计</h3>
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
      <div class="card mb-4">
        <div class="card-body">
          <h3 class="card-title mb-4">详细切割方案</h3>
          <div v-if="cuttingPlan.length">
            <div v-for="(group, groupIndex) in groupedCuttingPlans" :key="groupIndex" class="cutting-plan-group mb-4">
              <!-- 原料规格标题栏 -->
              <div class="stock-header">
                <div class="stock-info">
                  <div class="d-flex align-items-center justify-content-between w-100">
                    <h4 class="stock-title">
                      <i class="fas fa-layer-group"></i>
                      <span>板材</span>
                      <span class="stock-dimensions">({{ group.spec }})</span>
                    </h4>
                    <div class="utilization-display" :class="getUtilizationClass(group.utilization)">
                      <i class="fas fa-percentage me-2"></i>
                      <span>利用率: {{ group.utilization.toFixed(2) }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 每块板材的切割信息 -->
              <div v-for="(sheet, sheetKey) in group.sheets" :key="sheetKey">
                <div class="sheet-header cursor-pointer" style="padding: 0 0.75rem; margin-bottom: 0; gap: 0.5rem;"
                  @click="toggleSheetExpansion(sheet.sheetIndex)">
                  #{{ sheet.sheetIndex + 1 }}

                  <div class="sheet-progress-wrapper">
                    <div class="sheet-progress">
                      <div class="progress-bar" :class="getUtilizationClass(sheet.utilization)"
                        :style="{ width: sheet.utilization + '%' }" role="progressbar">
                        <span style="font-size: 12px;">{{ sheet.utilization.toFixed(2) }}%</span>
                      </div>
                    </div>
                  </div>

                  <i :class="['fas', expandedSheets.has(sheet.sheetIndex) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                </div>

                <div v-show="expandedSheets.has(sheet.sheetIndex)" class="sheet-content">
                  <div class="cuts-container">
                    <!-- 切割项信息 -->
                    <div v-for="(placement, index) in sheet.placements" :key="index" class="cut-item-card">
                      <div class="cut-header">
                        <div class="cut-header-left">
                          <span class="cut-dimensions">{{ placement.width }}×{{ placement.height }}mm</span>
                          <span v-if="placement.rotated" class="cut-rotated" title="已旋转">
                            <i class="fas fa-sync-alt"></i>
                          </span>
                        </div>
                      </div>
                      <div class="cut-details">
                        <div class="position-item">
                          <i class="fas fa-map-marker-alt"></i>
                          <span>位置: ({{ placement.x }},{{ placement.y }})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 余料信息 -->
                  <div v-if="sheet.remainingSpaces && sheet.remainingSpaces.length > 0" class="waste-spaces mt-3">
                    <div class="waste-area">
                      <i class="fas fa-square-full text-danger me-1"></i>
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
          <div v-else class="text-center py-4">
            <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
            <p class="text-muted">暂无切割方案</p>
          </div>
        </div>
      </div>

      <!-- 切割方案可视化 -->
      <div class="card mb-4">
        <div class="card-body">
          <h3 class="card-title mb-4">切割方案可视化</h3>
          <div class="cutting-visualization" ref="visualizationContainer"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import * as d3 from 'd3'
import ExcelJS from 'exceljs'
// 引入优化算法
import optimizeCuts from '../utils/CuttingOptimizer';
import { ElMessage } from 'element-plus';

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
}

// 在script部分添加导出图片方法
const exportToImage = () => {
  if (!visualizationContainer.value) return;
  
  try {
    // 获取SVG元素
    const svg = visualizationContainer.value.querySelector('svg');
    if (!svg) {
      console.warn('未找到SVG元素');
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
    };
    
    img.src = url;
  } catch (error) {
    console.error('导出图片时出错:', error);
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
.cutting-visualization {
  width: 100%;
  overflow-x: auto;
  min-height: 800px; /* 增加最小高度 */
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem; /* 增加内边距 */
  margin-bottom: 2rem; /* 增加底部间距 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.05); /* 添加阴影效果 */
}

.cutting-visualization svg {
  display: block;
  width: 100%; /* 设置宽度为100% */
  height: auto;
  min-width: 800px; /* 设置最小宽度 */
}

.stock-sheet {
  fill: #f8f9fa;
  stroke: #dee2e6;
  stroke-width: 1px;
}

.cut-piece {
  stroke: white;
  stroke-width: 1px;
}

.cut-piece text {
  font-size: 12px;
  font-family: Arial, sans-serif;
  pointer-events: none;
}

.stock-label {
  font-size: 14px;
  font-weight: bold;
  fill: #495057;
}

.stats-item {
  padding: 1.5rem;
  background: var(--light-bg);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stats-icon {
  font-size: 2rem;
  color: var(--secondary-color);
}

.stats-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stats-label {
  color: #666;
  font-size: 0.9rem;
}

.table th {
  white-space: nowrap;
}

/* 新增的样式 */
.stock-item,
.cut-item {
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: stretch;
  height: 38px;
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
}

.swap-btn {
  width: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f8f9fa;
  color: #6c757d;
  transition: all 0.2s ease;
  border-left: 1px solid #dee2e6;
  border-right: 1px solid #dee2e6;
}

.swap-btn:hover {
  background: #e9ecef;
  color: #2c3e50;
}

.swap-btn i {
  font-size: 0.8rem;
}

.delete-btn {
  width: 38px;
  margin: 0;
  padding: 0;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: #bb2d3b;
}

.delete-btn:disabled {
  opacity: 0.65;
  background: #dc3545;
}

.form-check-input:checked {
  background-color: #2ecc71;
  border-color: #2ecc71;
  visibility: hidden;
}

.input-group .form-control.w-100 {
  border-radius: 0;
  width: 100%;
}

/* 高级设置样式 */
.advanced-settings {
  width: 100%;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.settings-header:hover {
  background-color: #e9ecef;
}

.settings-header h4 {
  color: #2c3e50;
  font-size: 1.1rem;
}

.settings-header i {
  color: #6c757d;
  transition: transform 0.3s ease;
}

.settings-content {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
}

.parameter-group {
  background-color: #fff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.parameter-group:last-child {
  margin-bottom: 0;
}

/* 参数配置样式更新 */
.parameter-group .form-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}

.parameter-options .form-check {
  margin-bottom: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  background-color: #fff;
  position: relative;
  overflow: hidden;
}

.parameter-options .form-check:hover {
  border-color: #2ecc71;
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.parameter-options .form-check-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 0;
  position: relative;
  width: 100%;
}

.parameter-options .form-check-label i {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin-right: 0.75rem;
  background-color: #f8f9fa;
  color: #6c757d;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.parameter-options .option-title {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.parameter-options small {
  color: #6c757d;
  display: block;
  font-size: 0.875rem;
}

/* 选中状态样式优化 */
.parameter-options .form-check-input:checked + .form-check-label {
  color: #2ecc71;
}

.parameter-options .form-check-input:checked + .form-check-label i {
  background-color: #2ecc71;
  color: #fff;
}

.parameter-options .form-check-input:checked + .form-check-label .option-title {
  color: #2ecc71;
  font-weight: 600;
}

.parameter-options .form-check-input:checked ~ .form-check {
  border-color: #2ecc71;
}

/* 选中状态添加左边框效果 */
.parameter-options .form-check-input:checked + .form-check-label::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 70%;
  background-color: #2ecc71;
  border-radius: 0 4px 4px 0;
}

/* 添加选中状态的微妙背景效果 */
.parameter-options .form-check-input:checked + .form-check-label {
  background: linear-gradient(to right, rgba(46, 204, 113, 0.05), transparent);
}

/* 动画效果优化 */
.parameter-options .form-check {
  transform-origin: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.parameter-options .form-check:hover {
  transform: translateY(-2px);
}

.parameter-options .form-check-input:checked + .form-check-label i {
  transform: scale(1.1);
}

/* 图标大小统一 */
.parameter-options .utilization-icon,
.parameter-options .mincuts-icon,
.parameter-options .price-icon {
  font-size: 1rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .settings-header {
    padding: 0.75rem;
  }
  
  .settings-content {
    padding: 0.75rem;
  }
  
  .parameter-group {
    padding: 0.75rem;
  }
}

/* 添加新的样式 */
.table-secondary {
  background-color: #f8f9fa;
  border-left: 4px solid #6c757d;
}

.table td {
  vertical-align: middle;
  padding: 0.75rem;
}

.text-danger {
  font-size: 0.9rem;
}

.small {
  font-size: 0.85rem;
  color: #666;
}

/* 余料信息样式 */
.waste-info {
  font-size: 0.9rem;
  padding: 4px 0;
}

.waste-area {
  display: flex;
  align-items: center;
  color: #dc3545;
  font-weight: 500;
  margin-bottom: 6px;
}

.waste-spaces {
  border-left: 2px solid #eee;
  padding-left: 8px;
  margin-left: 2px;
}

.waste-spaces-header {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.waste-spaces-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 4px;
}

.waste-space-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #666;
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.space-size {
  color: #dc3545;
  font-weight: 500;
  margin-right: 4px;
}

.space-position {
  color: #6c757d;
  font-size: 0.8rem;
}

.no-waste {
  display: flex;
  align-items: center;
  color: #198754;
  font-size: 0.9rem;
}

/* 新增固定定位样式 */
.input-section {
  /* 默认移动端样式 */
  position: relative;
  top: 0;
  max-height: none;
  overflow-y: visible;
  z-index: 1;
}

/* 桌面端样式 */
@media (min-width: 992px) {
  .input-section {
    position: sticky;
    top: 60px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    z-index: 100;
  }

  /* 滚动条样式仅在桌面端生效 */
  .input-section::-webkit-scrollbar {
    width: 6px;
  }

  .input-section::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .input-section::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }

  .input-section::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
}

/* 添加响应式布局 */
@media (max-width: 992px) {
  .cutting-visualization {
    min-height: 800px;
    padding: 0.5rem;
    margin: 0 -1rem; /* 扩展到屏幕边缘 */
    border-radius: 0;
    width: calc(100% + 2rem);
  }
  
  .cutting-visualization svg {
    min-width: 1200px; /* 增加最小宽度 */
    padding: 1rem;
  }

  /* 优化滚动提示 */
  .cutting-visualization::after {
    content: '← 左右滑动查看更多 →';
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    pointer-events: none;
    animation: fadeInOut 2s ease-in-out infinite;
  }

  @keyframes fadeInOut {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
  }

  /* 优化滚动条样式 */
  .cutting-visualization::-webkit-scrollbar {
    height: 8px;
  }

  .cutting-visualization::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .cutting-visualization::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  .cutting-visualization::-webkit-scrollbar-thumb:hover {
    background: #666;
  }
}

/* 在style部分添加图例样式 */
.legend text {
  fill: #495057;
  font-family: Arial, sans-serif;
}

.legend rect {
  stroke: #dee2e6;
  stroke-width: 1px;
}

@media (max-width: 992px) {
  .legend text {
    font-size: 14px;
  }
}

/* 切割方案组样式 */
.cutting-plan-group {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.stock-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.stock-title {
  font-size: 1.1rem;
  margin: 0;
  color: #2c3e50;
}

.stock-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #6c757d;
}

.stat-item.high-utilization {
  color: #2ecc71;
}

.stat-item.medium-utilization {
  color: #f1c40f;
}

.stat-item.low-utilization {
  color: #e74c3c;
}

.stock-progress {
  height: 0.5rem;
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar {
  transition: width 0.3s ease;
  text-align: center;
  font-size: 0.75rem;
  line-height: 0.5rem;
  color: white;
}

.progress-bar.high-utilization {
  background-color: #2ecc71;
}

.progress-bar.medium-utilization {
  background-color: #f1c40f;
}

.progress-bar.low-utilization {
  background-color: #e74c3c;
}

.cuts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.5rem;
  padding: 0.75rem;
}

.cut-item-card {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.cut-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem;
  border-bottom: 1px solid #eee;
  margin-bottom: 0.5rem;
}

.cut-count {
  background: #2ecc71;
  color: white;
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.85rem;
  margin-right: 0.5rem;
}

.positions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.position-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #6c757d;
  font-size: 0.85rem;
  background: #f8f9fa;
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
}

@media (max-width: 768px) {
  .cuts-container {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    padding: 0.5rem;
  }

  .cut-item-card {
    padding: 0.35rem;
    font-size: 0.85rem;
  }

  .positions-list {
    grid-template-columns: 1fr;
  }

  .position-item {
    font-size: 0.8rem;
  }
}

@media (max-width: 576px) {
  .cuts-container {
    grid-template-columns: 1fr;
  }
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: #f8f9fa;
}

.cut-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cut-header-right {
  color: #6c757d;
}

.cut-header-right i {
  transition: transform 0.3s ease;
}

.cut-details {
  padding: 0.75rem;
  border-top: none;
  background-color: #fff;
  transition: all 0.3s ease;
}

.cut-sequence {
  background: #2c3e50;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
}

.cut-dimensions {
  font-weight: 500;
  color: #2c3e50;
}

.cut-rotated {
  color: #6c757d;
  font-size: 0.9rem;
}

.cut-details {
  font-size: 0.9rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.waste-spaces {
  border-top: 1px dashed #dee2e6;
  padding-top: 0.75rem;
}

.waste-area {
  color: #dc3545;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.remaining-spaces {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}

.space-item {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
}

.space-dimensions {
  color: #2c3e50;
  font-weight: 500;
}

.space-position {
  color: #6c757d;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .stock-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .stock-stats {
    flex-wrap: wrap;
  }
  
  .cuts-container {
    grid-template-columns: 1fr;
  }
}

/* 添加新的样式 */
.sheet-container {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sheet-title {
  font-size: 1.1rem;
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
}

.cut-count {
  background: #2ecc71;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
  margin-right: 0.75rem;
}

.positions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.position-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* 添加新的样式 */
.cuts-section {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-top: 1rem;
  background: #fff;
}

.cuts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  transition: all 0.3s ease;
}

.cuts-header:hover {
  background: #e9ecef;
}

.cuts-header-left {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #2c3e50;
}

.cuts-header-right i {
  color: #6c757d;
  transition: transform 0.3s ease;
}

.cuts-content {
  transition: all 0.3s ease;
}

.page-subtitle {
  padding: 0.75rem 0;  /* 减小顶部标题区域的padding */
  margin-bottom: 1rem;
}

.page-subtitle h2 {
  font-size: 1.5rem;  /* 减小标题字体 */
  margin-bottom: 0.25rem;
}

.page-subtitle p {
  font-size: 0.9rem;
  margin-bottom: 0;
}

.card {
  margin-bottom: 0.75rem !important;  /* 减小卡片间距 */
}

.card-body {
  padding: 0.75rem;  /* 减小卡片内边距 */
}

.card-title {
  font-size: 1.1rem;
  margin-bottom: 0.75rem !important;
}

.mb-4 {
  margin-bottom: 0.75rem !important;  /* 统一减小间距 */
}

.progress {
  margin: 0.5rem 0 !important;  /* 减小进度条上下间距 */
}

.stock-header {
  padding: 0.5rem 0.75rem;  /* 减小板材标题区域的padding */
}

.stock-title {
  font-size: 1rem;  /* 减小标题字体 */
}

.stock-stats {
  gap: 0.5rem;  /* 减小统计数据之间的间距 */
}

.stat-item {
  font-size: 0.85rem;  /* 减小统计数据字体 */
}

.cuts-container {
  gap: 0.35rem;  /* 减小切割件之间的间距 */
  padding: 0.5rem;
}

.cut-item-card {
  padding: 0.35rem;  /* 减小切割件卡片的内边距 */
}

.cut-header {
  padding: 0.15rem;  /* 减小切割件标题区域的padding */
  margin-bottom: 0.35rem;
}

.positions-list {
  gap: 0.25rem;  /* 减小位置列表的间距 */
  margin-top: 0.35rem;
}

.position-item {
  padding: 0.1rem 0.25rem;  /* 减小位置项的内边距 */
  font-size: 0.8rem;  /* 减小位置信息字体 */
}

/* 优化响应式布局 */
@media (max-width: 768px) {
  .cuts-container {
    gap: 0.25rem;
    padding: 0.35rem;
  }

  .cut-item-card {
    padding: 0.25rem;
  }

  .position-item {
    font-size: 0.75rem;
  }
}

/* 优化板材组件间距 */
.cutting-plan-group {
  margin-bottom: 0.75rem !important;
}

.sheet-container {
  padding: 0.75rem;
  margin: 0.5rem;
}

/* 优化切割信息区域 */
.cuts-section {
  margin-top: 0.5rem;
}

.cuts-header {
  padding: 0.5rem 0.75rem;
}

/* 优化统计卡片 */
.stats-item {
  padding: 1rem;
}

.stats-icon {
  font-size: 1.5rem;
}

.stats-value {
  font-size: 1.25rem;
}

.stats-label {
  font-size: 0.85rem;
}

/* 添加新的切割件信息切换样式 */
.cut-info-toggle {
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.cut-info-toggle:hover {
  background-color: #e9ecef;
}

.cut-info-toggle i {
  color: #6c757d;
}

.cut-info-toggle span {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
}

.cuts-section {
  margin-top: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}

/* 优化切割件容器样式 */
.cuts-container {
  padding: 0.75rem;
  background-color: #fff;
}

/* 添加展开/折叠动画 */
.cuts-section {
  transition: all 0.3s ease-in-out;
}

/* 移除原有的切割件信息头部样式 */
.cuts-header {
  display: none;
}

/* 更新板材标题栏样式 */
.sheet-header {
  padding: 0 0.75rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.sheet-header:hover {
  background-color: #e9ecef;
}

.sheet-header i.fas.fa-chevron-down,
.sheet-header i.fas.fa-chevron-up {
  color: #6c757d;
  font-size: 0.9rem;
  transition: transform 0.3s ease;
}

.sheet-header .sheet-title {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0;
}

.sheet-stats {
  display: flex;
  gap: 1rem;
}

/* 添加展开/折叠动画 */
.cuts-container {
  transition: all 0.3s ease-in-out;
}

/* 更新样式 */
.sheet-header {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.sheet-header:hover {
  background-color: #e9ecef;
}

.sheet-content {
  padding: 0 0.75rem;
}

.sheet-progress {
  width: 150px;  /* 增加进度条宽度 */
  height: 12px;  /* 增加进度条高度 */
  margin: 0 8px !important;
  background-color: #f1f1f1;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
  display: inline-block;
  vertical-align: middle;
}

.progress-bar {
  height: 100%;
  font-size: 0;
  line-height: 12px;
  text-align: center;
  transition: width 0.6s ease;
  position: relative;
  border-radius: 6px;
  background-image: linear-gradient(45deg, 
    rgba(255,255,255,.15) 25%, 
    transparent 25%, 
    transparent 50%, 
    rgba(255,255,255,.15) 50%, 
    rgba(255,255,255,.15) 75%, 
    transparent 75%, 
    transparent);
  background-size: 1rem 1rem;
  animation: progress-bar-stripes 1s linear infinite;
}

@keyframes progress-bar-stripes {
  from { background-position: 1rem 0; }
  to { background-position: 0 0; }
}

.progress-bar.high-utilization {
  background-color: #2ecc71;
}

.progress-bar.medium-utilization {
  background-color: #f1c40f;
}

.progress-bar.low-utilization {
  background-color: #e74c3c;
}

/* 移除进度条文字 */
.progress-bar::after {
  display: none;
}

/* 新增标题区域样式 */
.stock-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stock-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.stock-title i {
  font-size: 1.25rem;
  color: #3498db;
}

.stock-dimensions {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: normal;
}

/* 新增利用率显示区域样式 */
.stock-utilization {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.sheet-progress-wrapper {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
}

/* 优化卡片布局 */
.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.card-body {
  padding: 1.5rem;
}

/* 添加响应式布局 */
@media (max-width: 768px) {
  .stock-info {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stock-utilization {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  .sheet-progress-wrapper {
    width: 100%;
  }
  
  .sheet-progress {
    width: 100%;
  }
  
  .utilization-display {
    justify-content: center;
  }
}

/* 优化动画效果 */
.progress-bar {
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.stock-header {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加悬停效果 */
.stock-header:hover .progress-bar {
  filter: brightness(1.1);
}

.utilization-display:hover {
  transform: scale(1.02);
}

/* 更新进度条相关样式 */
.stock-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.stock-title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.stock-utilization {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.5rem;
}

.utilization-display {
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.25rem 0;
}

.sheet-progress-wrapper {
  width: 100%;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 8px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
}

.sheet-progress {
  width: 100%;
  height: 16px;
  margin: 0 !important;
  background-color: #f1f1f1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
}

.progress-bar {
  height: 100%;
  font-size: 0;
  line-height: 16px;
  text-align: center;
  transition: width 0.6s ease;
  position: relative;
  border-radius: 8px;
  background-image: linear-gradient(45deg, 
    rgba(255,255,255,.15) 25%, 
    transparent 25%, 
    transparent 50%, 
    rgba(255,255,255,.15) 50%, 
    rgba(255,255,255,.15) 75%, 
    transparent 75%, 
    transparent);
  background-size: 1rem 1rem;
  animation: progress-bar-stripes 1s linear infinite;
}

.utilization-display.high-utilization {
  color: #2ecc71;
}

.utilization-display.medium-utilization {
  color: #f1c40f;
}

.utilization-display.low-utilization {
  color: #e74c3c;
}

/* 响应式布局优化 */
@media (max-width: 768px) {
  .stock-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .sheet-progress-wrapper {
    padding: 0.5rem;
  }
  
  .sheet-progress {
    height: 12px;
  }
  
  .progress-bar {
    line-height: 12px;
  }
}

/* 添加全局图例样式 */
.global-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-block {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.legend-text {
  font-size: 0.9rem;
  color: #495057;
}

@media (max-width: 768px) {
  .global-legend {
    margin-top: 0.5rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* 新增的英雄区域样式 */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 80px 0;
  color: white;
  text-align: center;
  overflow: hidden;
  margin-bottom: 2rem;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/pattern.png') repeat;
  opacity: 0.1;
}

.hero-content {
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(120deg, #ffd700, #fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.8rem;
  font-weight: 500;
  margin-bottom: 3rem;
  opacity: 0.9;
}

.hero-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 3rem auto;
  max-width: 1200px;
  padding: 0 1rem;
}

.feature-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
}

.feature-item i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #ffd700;
}

.feature-item p {
  font-size: 1.1rem;
  line-height: 1.5;
  margin: 0;
}

.materials-support {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  margin-top: 3rem;
  backdrop-filter: blur(10px);
}

.materials-support h4 {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: #ffd700;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.material-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.material-item i {
  color: #ffd700;
  font-size: 1.2rem;
}

.material-item span {
  color: white;
  font-weight: 500;
}

.hero-cta {
  margin-top: 3rem;
}

.optimize-btn {
  background: linear-gradient(45deg, #FFD700, #FFA500);
  border: none;
  border-radius: 50px;
  padding: 15px 40px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
  color: #1e3c72;
}

.optimize-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  background: linear-gradient(45deg, #FFA500, #FFD700);
}

.optimize-btn:active {
  transform: translateY(1px);
}

.optimize-btn i {
  font-size: 1.4rem;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 60px 0;
  }
  
  .hero-title {
    font-size: 2.2rem;
  }
  
  .hero-subtitle {
    font-size: 1.4rem;
  }
  
  .hero-features {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .materials-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 按钮图标样式 */
.btn-icon {
  width: 56px;
  height: 56px;
  padding: 0;
  border-radius: 50%;
  background: #2ecc71 !important;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #27ae60 !important;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(40, 167, 69, 0.2);
}

.btn-icon i {
  font-size: 1.8rem;
}

.text-success {
  color: #fff !important;
}

.btn-icon-with-label {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-label {
  font-size: 13px;
  color: #333;
  margin-top: 2px;
  font-weight: 500;
}

.visualization-tabs {
  width: 100%;
}

.nav-tabs {
  border-bottom: 2px solid #e9ecef;
}

.nav-tabs .nav-link {
  border: none;
  color: #666;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
  color: #2196F3;
  border: none;
}

.nav-tabs .nav-link.active {
  color: #2196F3;
  border: none;
  border-bottom: 2px solid #2196F3;
  background: transparent;
}

.tab-content {
  padding: 1rem 0;
}
</style> 
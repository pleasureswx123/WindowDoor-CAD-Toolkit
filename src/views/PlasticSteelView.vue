<template>
  <div class="plastic-steel-view">
    <!-- 顶部横幅 -->
    <div class="hero-section">
      <div class="hero-overlay"></div>
      <div class="container-box">
        <div class="hero-content">
          <h1 class="hero-title">型材切割优化工具</h1>
          <p class="hero-subtitle">高效下料方案，提升材料利用率，减少浪费</p>
        </div>
      </div>
    </div>

    <div class="container-box">
      <div class="row g-3">
        <!-- 输入区域 -->
        <div class="col-lg-4 input-section pb-lg-5">
          <div class="steel-card mb-4">
            <div class="card-body">
              <h3 class="card-title mb-4">
                <IconProfile class="me-2" />
                原料清单
              </h3>
              <form @submit.prevent="calculateOptimization">
                <!-- 原料清单 -->
                <div class="mb-3">
                  <!-- label 长度 价钱 -->
                  <div class="d-flex justify-content-around align-items-center mb-2">
                    <div class="">长度（毫米）</div>
                    <div></div>
                    <div class="">价钱（元）</div>
                    <div></div>
                  </div>
                  <div v-for="(stock, index) in stockList" :key="index" class="mb-2">
                    <div class="input-group">
                      <input type="number" class="form-control" v-model="stock.length" placeholder="长度(mm)" required
                        min="0" step="1">
                      <input type="number" class="form-control" v-model="stock.price" placeholder="单价" required min="0"
                        step="0.01">
                      <button type="button" class="btn btn-delete" @click="removeStockItem(index)"
                        :disabled="stockList.length === 1">
                        <IconDelete />
                      </button>
                    </div>
                  </div>
                  <button type="button" class="btn btn-add w-100 mb-3" @click="addStockItem">
                    <IconAdd class="me-2" />添加原料规格
                  </button>
                </div>

                <!-- 切割清单 -->
                <div class="mb-3">
                  <label class="form-label">切割清单</label>
                  <!-- label 长度 数量 -->
                  <div class="d-flex justify-content-around align-items-center mb-2">
                    <div class="">长度（毫米）</div>
                    <div></div>
                    <div class="">数量（根数）</div>
                    <div></div>
                  </div>
                  <div v-for="(item, index) in cutList" :key="index" class="mb-2">
                    <div class="input-group">
                      <input type="number" class="form-control" v-model="item.length" placeholder="长度(mm)" required
                        min="0" step="1">
                      <input type="number" class="form-control" v-model="item.quantity" placeholder="数量" required
                        min="1" step="1">
                      <button type="button" class="btn btn-delete" @click="removeCutItem(index)">
                        <IconDelete />
                      </button>
                    </div>
                  </div>
                  <button type="button" class="btn btn-add w-100" @click="addCutItem">
                    <IconAdd class="me-2" />添加切割项
                  </button>
                </div>

                <!-- 切割参数 -->
                <div class="mb-3">
                  <label class="form-label">切割损耗 (mm)</label>
                  <input type="number" class="form-control" v-model="sawKerf" required min="0" step="0.1">
                </div>

                <button type="submit" class="btn btn-calculate w-100">
                  <IconCalculate class="me-2" />计算优化方案
                </button>
              </form>
            </div>
          </div>

          <!-- 导入导出 -->
          <div class="steel-card mb-4">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="card-title mb-0">
                  <IconDataTransfer class="me-2" />
                  数据导入导出
                </h3>
                <a href="#" class="text-primary text-decoration-none" @click.prevent="downloadTemplate"
                  title="下载Excel模板">
                  <IconDownload />
                  <small class="ms-1">下载模板</small>
                </a>
              </div>
              <div class="d-flex justify-content-between">
                <div class="btn-icon-with-label">
                  <button class="btn btn-action" @click="importFromExcel" title="从Excel导入">
                    <IconImport />
                  </button>
                  <span class="btn-label">从Excel导入</span>
                </div>
                <div class="btn-icon-with-label">
                  <button class="btn btn-action" @click="exportToExcel" title="导出到Excel">
                    <IconExport />
                  </button>
                  <span class="btn-label">导出到Excel</span>
                </div>
                <div class="btn-icon-with-label">
                  <button class="btn btn-action" @click="exportToImage" title="导出到图片">
                    <IconImage />
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
          <div class="steel-card mb-4">
            <div class="card-body">
              <h3 class="card-title mb-4">
                <IconStats class="me-2" />
                优化结果统计
              </h3>
              <div class="row g-4">
                <div class="col-md-3 col-6">
                  <div class="stats-item text-center">
                    <div class="stats-icon mb-2">
                      <IconPercentage />
                    </div>
                    <div class="stats-value">{{ utilization }}%</div>
                    <div class="stats-label">材料利用率</div>
                  </div>
                </div>
                <div class="col-md-3 col-6">
                  <div class="stats-item text-center">
                    <div class="stats-icon mb-2">
                      <IconBars />
                    </div>
                    <div class="stats-value">{{ totalBars }}</div>
                    <div class="stats-label">需要原料数</div>
                  </div>
                </div>
                <div class="col-md-3 col-6">
                  <div class="stats-item text-center">
                    <div class="stats-icon mb-2">
                      <IconWaste />
                    </div>
                    <div class="stats-value">{{ (wasteLength / 10).toFixed(2) }}cm</div>
                    <div class="stats-label">总废料长度</div>
                  </div>
                </div>
                <div class="col-md-3 col-6">
                  <div class="stats-item text-center">
                    <div class="stats-icon mb-2">
                      <IconCost />
                    </div>
                    <div class="stats-value">¥{{ totalCost }}</div>
                    <div class="stats-label">总成本</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 原料使用统计 -->
          <div class="steel-card mb-4">
            <div class="card-body">
              <h3 class="card-title mb-4">
                <IconUsage class="me-2" />
                原料使用统计
              </h3>
              <div class="table-responsive">
                <table class="table custom-table">
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
                      <td>{{ stat.spec }}mm</td>
                      <td>¥{{ stat.price }}</td>
                      <td>{{ stat.quantity }}根</td>
                      <td>¥{{ stat.total }}</td>
                    </tr>
                    <tr class="table-total">
                      <td colspan="2"><strong>合计</strong></td>
                      <td><strong>{{ totalBars }}根</strong></td>
                      <td><strong>¥{{ totalCost }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 详细切割方案 -->
          <div class="steel-card mb-4">
            <div class="card-body">
              <h3 class="card-title mb-4">
                <IconPlan class="me-2" />
                详细切割方案
              </h3>
              <div class="table-responsive">
                <table class="table custom-table">
                  <thead>
                    <tr>
                      <th>原料编号</th>
                      <th>原料规格</th>
                      <th>切割明细</th>
                      <th>剩余长度</th>
                      <th>利用率</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="cuttingPlan.length">
                      <tr v-for="(plan, index) in cuttingPlan" :key="index">
                        <td>{{ plan.barIndex }}</td>
                        <td>{{ plan.originalSpec }}</td>
                        <td>{{ plan.cutDetails }}</td>
                        <td>
                          <span :class="{ 'text-danger': plan.isWaste }">
                            {{ plan.remainingLength }}mm
                          </span>
                        </td>
                        <td>
                          <span class="utilization-badge" :class="{
                            'bg-success': plan.utilization >= 90,
                            'bg-warning': plan.utilization < 90 && plan.utilization >= 70,
                            'bg-danger': plan.utilization < 70
                          }">
                            {{ plan.utilization }}%
                          </span>
                        </td>
                      </tr>
                    </template>
                    <tr v-else>
                      <td colspan="5" class="text-center empty-state">
                        <IconEmpty class="mb-2" />
                        <p>暂无切割方案</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 切割方案可视化 -->
          <div class="steel-card mb-4">
            <div class="card-body">
              <h3 class="card-title mb-4">
                <IconVisualize class="me-2" />
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
import { ref, onMounted, computed, h } from 'vue'
import * as d3 from 'd3'
import ExcelJS from 'exceljs'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

// 图标组件定义
const IconProfile = () => h(Icon, { icon: 'mdi:profile', width: '22', height: '22' })
const IconAdd = () => h(Icon, { icon: 'mdi:plus', width: '20', height: '20' })
const IconDelete = () => h(Icon, { icon: 'mdi:delete', width: '20', height: '20' })
const IconCalculate = () => h(Icon, { icon: 'mdi:calculator', width: '20', height: '20' })
const IconDataTransfer = () => h(Icon, { icon: 'mdi:data-transfer', width: '22', height: '22' })
const IconDownload = () => h(Icon, { icon: 'mdi:download', width: '20', height: '20' })
const IconImport = () => h(Icon, { icon: 'mdi:import', width: '20', height: '20' })
const IconExport = () => h(Icon, { icon: 'mdi:export', width: '20', height: '20' })
const IconImage = () => h(Icon, { icon: 'mdi:image', width: '20', height: '20' })
const IconStats = () => h(Icon, { icon: 'mdi:chart-bar', width: '22', height: '22' })
const IconPercentage = () => h(Icon, { icon: 'mdi:percent', width: '24', height: '24' })
const IconBars = () => h(Icon, { icon: 'mdi:table-row', width: '24', height: '24' })
const IconWaste = () => h(Icon, { icon: 'mdi:delete-empty', width: '24', height: '24' })
const IconCost = () => h(Icon, { icon: 'mdi:currency-cny', width: '24', height: '24' })
const IconUsage = () => h(Icon, { icon: 'mdi:chart-pie', width: '22', height: '22' })
const IconPlan = () => h(Icon, { icon: 'mdi:format-list-checks', width: '22', height: '22' })
const IconEmpty = () => h(Icon, { icon: 'mdi:folder-open-outline', width: '48', height: '48', class: 'd-block mx-auto text-muted' })
const IconVisualize = () => h(Icon, { icon: 'mdi:chart-timeline-variant', width: '22', height: '22' })

// 状态定义
const stockList = ref([
  { length: 6000, price: 100 }  // 默认一个原料规格
])
const sawKerf = ref(4)  // 修改默认切割损耗为4mm
const cutList = ref([
  { length: 500, quantity: 8 },  // 更新默认切割项以便测试
  { length: 350, quantity: 6 },
  { length: 800, quantity: 6 }
])
const utilization = ref(0)
const totalBars = ref(0)
const wasteLength = ref(0)
const totalCost = ref(0)
const cuttingPlan = ref([])
const visualizationContainer = ref(null)
const materialUsageStats = ref([])  // 新增：原料使用统计

// 添加原料规格
const addStockItem = () => {
  stockList.value.push({
    length: 6000,  // 设置一个合理的默认值
    price: 100
  })
}

// 移除原料规格
const removeStockItem = (index) => {
  if (stockList.value.length > 1) {
    stockList.value.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一个原料规格')
  }
}

// 添加切割项
const addCutItem = () => {
  cutList.value.push({
    length: 500,  // 设置一个合理的默认值
    quantity: 1
  })
}

// 移除切割项
const removeCutItem = (index) => {
  if (cutList.value.length > 1) {
    cutList.value.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一个切割需求')
  }
}

// 计算优化方案
const calculateOptimization = () => {
  // 验证原料规格
  const invalidStock = stockList.value.some(stock => stock.length <= 0 || stock.price <= 0);
  if (invalidStock) {
    ElMessage.error('原料长度和价格必须大于0');
    return;
  }

  // 验证切割清单
  const invalidCut = cutList.value.some(cut => cut.length <= 0 || cut.quantity <= 0);
  if (invalidCut) {
    ElMessage.error('切割长度和数量必须大于0');
    return;
  }

  // 验证是否有切割需求
  if (cutList.value.length === 0) {
    ElMessage.warning('请添加切割需求');
    return;
  }

  // 验证是否有原料规格
  if (stockList.value.length === 0) {
    ElMessage.warning('请添加原料规格');
    return;
  }

  // 验证切割长度不能大于最大原料长度
  const maxStockLength = Math.max(...stockList.value.map(stock => stock.length));
  const invalidLength = cutList.value.some(cut => cut.length > maxStockLength);
  if (invalidLength) {
    ElMessage.error(`切割长度不能大于最大原料长度${maxStockLength}mm`);
    return;
  }

  // 验证切割损耗
  if (sawKerf.value < 0) {
    ElMessage.error('切割损耗不能小于0');
    return;
  }

  console.group('切割优化计算');
  console.log('%c输入参数', 'color: #2196F3; font-weight: bold');
  console.log('1. 切割需求:', cutList.value.map(item => ({
    length: item.length + 'mm',
    quantity: item.quantity + '根'
  })));
  console.log('2. 原料规格:', stockList.value.map(item => ({
    length: item.length + 'mm',
    price: '¥' + item.price
  })));
  console.log('3. 切割损耗:', sawKerf.value + 'mm');

  // 1. 预处理数据
  const startTime = performance.now();
  
  // 按长度降序排序切割需求并合并相同长度
  const cutLengths = new Map();
  cutList.value.forEach(req => {
    const length = req.length;
    cutLengths.set(length, (cutLengths.get(length) || 0) + req.quantity);
  });

  // 按性价比（长度/价格）降序排序原料规格
  const sortedStocks = [...stockList.value].sort((a, b) => (b.length / b.price) - (a.length / a.price));

  // 2. 优化算法实现
  const result = [];
  const remainingCuts = new Map(cutLengths);

  while ([...remainingCuts.values()].some(qty => qty > 0)) {
    let bestStock = null;
    let bestPattern = null;
    let bestEfficiency = -1;

    // 对每种原料规格尝试切割方案
    for (const stock of sortedStocks) {
      const pattern = findBestPattern(remainingCuts, stock.length);
      
      if (pattern && pattern.efficiency > bestEfficiency) {
        bestEfficiency = pattern.efficiency;
        bestPattern = pattern;
        bestStock = stock;
      }
    }

    if (bestPattern && bestStock) {
      result.push({
        stock: bestStock,
        pattern: bestPattern.cuts,
        efficiency: bestPattern.efficiency,
        waste: bestPattern.waste
      });

      // 更新剩余切割需求
      bestPattern.cuts.forEach(cut => {
        const remaining = remainingCuts.get(cut) - 1;
        if (remaining > 0) {
          remainingCuts.set(cut, remaining);
        } else {
          remainingCuts.delete(cut);
        }
      });
    } else {
      console.error('无法找到合适的切割方案');
      break;
    }
  }

  // 3. 更新统计数据
  updateStats(result);

  // 4. 生成切割方案
  generateCuttingPlan(result);

  // 5. 更新可视化
  updateVisualization(result);

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  // 输出优化结果日志
  console.log('\n%c优化结果', 'color: #4CAF50; font-weight: bold');
  console.log('1. 总方案数:', result.length, '个');
  console.log('2. 详细方案:');
  result.forEach((r, i) => {
    console.group(`方案 ${i + 1}`);
    console.log('原料规格:', r.stock.length + 'mm');
    console.log('原料单价:', '¥' + r.stock.price);
    console.log('切割明细:', r.pattern.join('mm, ') + 'mm');
    console.log('利用率:', r.efficiency.toFixed(2) + '%');
    console.log('剩余长度:', r.waste + 'mm');
    console.groupEnd();
  });

  console.log('\n%c统计数据', 'color: #FF9800; font-weight: bold');
  console.log('1. 材料利用率:', utilization.value.toFixed(2) + '%');
  console.log('2. 总原料数:', totalBars.value, '根');
  console.log('3. 总废料长度:', wasteLength.value.toFixed(2) + 'mm');
  console.log('4. 总成本:', '¥' + totalCost.value.toFixed(2));
  console.log('5. 执行时间:', executionTime.toFixed(2) + 'ms');

  console.log('\n%c原料使用统计', 'color: #9C27B0; font-weight: bold');
  materialUsageStats.value.forEach(stat => {
    console.log(
      `规格: ${stat.spec}mm`,
      `单价: ¥${stat.price}`,
      `数量: ${stat.quantity}根`,
      `总价: ¥${stat.total}`
    );
  });

  console.groupEnd();
}

// 辅助函数：找到最佳切割方案
const findBestPattern = (remainingCuts, stockLength) => {
  let bestPattern = {
    cuts: [],
    waste: stockLength,
    efficiency: 0
  };

  // 获取所有可用的切割长度，按降序排序
  const availableCuts = [...remainingCuts.entries()]
    .filter(([_, qty]) => qty > 0)
    .map(([length]) => length)
    .sort((a, b) => b - a);

  // 使用迭代方法而不是递归，避免栈溢出
  const stack = [{
    cuts: [],
    currentLength: 0,
    startIndex: 0
  }];

  while (stack.length > 0) {
    const { cuts, currentLength, startIndex } = stack.pop();

    // 计算当前方案的效率
    const efficiency = (currentLength / stockLength) * 100;
    const waste = stockLength - currentLength;

    // 如果当前方案更好，更新最佳方案
    if (efficiency > bestPattern.efficiency || 
        (efficiency === bestPattern.efficiency && waste < bestPattern.waste)) {
      bestPattern = {
        cuts: [...cuts],
        waste,
        efficiency
      };
    }

    // 如果已经达到最大切割数或无法继续切割，跳过
    if (cuts.length >= 10 || startIndex >= availableCuts.length) {
      continue;
    }

    // 尝试添加新的切割
    for (let i = startIndex; i < availableCuts.length; i++) {
      const cut = availableCuts[i];
      const newLength = currentLength + cut + (cuts.length > 0 ? sawKerf.value : 0);

      if (newLength <= stockLength && remainingCuts.get(cut) > 
          cuts.filter(c => c === cut).length) {
        stack.push({
          cuts: [...cuts, cut],
          currentLength: newLength,
          startIndex: i
        });
      }
    }
  }

  return bestPattern;
}

// 更新统计数据
const updateStats = (result) => {
  totalBars.value = result.length
  let totalUsedLength = 0
  let totalLossLength = 0
  let totalStockLength = 0
  let totalStockCost = 0
  
  const usageMap = new Map()
  
  result.forEach(plan => {
    const stock = plan.stock
    totalStockLength += stock.length
    totalStockCost += stock.price
    
    // 计算实际使用长度（包括切割损耗）
    const usedLength = plan.pattern.reduce((sum, cut) => sum + cut, 0)
    const lossLength = (plan.pattern.length - 1) * sawKerf.value
    
    totalUsedLength += usedLength
    totalLossLength += lossLength
    
    // 更新使用统计
    const key = stock.length
    if (!usageMap.has(key)) {
      usageMap.set(key, {
        spec: key,
        price: stock.price,
        quantity: 1,
        total: stock.price
      })
    } else {
      const stat = usageMap.get(key)
      stat.quantity++
      stat.total = stat.quantity * stat.price
    }
  })
  
  // 更新统计数据 - 修改利用率计算
  const totalUsed = totalUsedLength + totalLossLength // 总使用长度（包含切割损耗）
  utilization.value = Number(((totalUsed / totalStockLength) * 100).toFixed(2))
  wasteLength.value = totalStockLength - totalUsed // 总废料长度 = 总长度 - 使用长度（包含切割损耗）
  totalCost.value = totalStockCost
  materialUsageStats.value = Array.from(usageMap.values())
}

// 生成切割方案
const generateCuttingPlan = (result) => {
  // 按原料规格分组整理切割方案
  const groupedPlan = result.map((stock, stockIndex) => {
    // 统计每种长度的数量
    const lengthCounts = new Map()
    stock.pattern.forEach(cut => {
      const key = cut
      lengthCounts.set(key, (lengthCounts.get(key) || 0) + 1)
    })
    
    // 计算当前原料的利用率 - 修改计算逻辑
    const totalCutLength = stock.pattern.reduce((sum, cut) => sum + cut, 0) // 实际切割长度
    const totalLoss = (stock.pattern.length - 1) * sawKerf.value // 切割损耗总长度
    const totalUsed = totalCutLength + totalLoss // 总使用长度（包含切割损耗）
    const utilization = Number(((totalUsed / stock.stock.length) * 100).toFixed(2)) // 计算利用率，保留两位小数
    
    // 计算实际剩余长度
    const remainingLength = stock.stock.length - totalUsed
    
    // 转换为显示格式
    const cutDetails = Array.from(lengthCounts.entries())
      .sort((a, b) => b[0] - a[0]) // 按长度降序排序
      .map(([length, count]) => `${length}mm×${count}`)
      .join('，')
    
    return {
      barIndex: stockIndex + 1,
      originalSpec: `${stock.stock.length}mm`,
      cutDetails: cutDetails,
      remainingLength: remainingLength,
      isWaste: remainingLength > 0,
      utilization: utilization,
      sawKerfLoss: totalLoss
    }
  })
  
  cuttingPlan.value = groupedPlan
}

// 更新可视化
const updateVisualization = (result) => {
  if (!visualizationContainer.value) return

  // 清除现有内容
  d3.select(visualizationContainer.value).selectAll('*').remove()

  const margin = { top: 20, right: 120, bottom: 20, left: 100 }
  const width = visualizationContainer.value.clientWidth - margin.left - margin.right
  const barHeight = 40
  const height = (result.length * barHeight * 1.5) + margin.top + margin.bottom

  // 创建SVG
  const svg = d3.select(visualizationContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 创建比例尺
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(result, d => d.stock.length)])
    .range([0, width])

  // 获取所有不同的切割长度
  const uniqueLengths = new Set()
  result.forEach(plan => {
    plan.pattern.forEach(cut => {
      uniqueLengths.add(cut)
    })
  })
  
  // 创建颜色映射
  const colorMap = new Map()
  Array.from(uniqueLengths).sort((a, b) => b - a).forEach((length, index) => {
    colorMap.set(length, d3.schemeCategory10[index % 10])
  })

  // 绘制每个原料条
  const bars = svg.selectAll('.bar-group')
    .data(result)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', (d, i) => `translate(0,${i * barHeight * 1.5})`)

  // 绘制原料条背景
  bars.append('rect')
    .attr('class', 'stock-bar')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', d => xScale(d.stock.length))
    .attr('height', barHeight)
    .attr('fill', '#e9ecef')  // 更深的背景色
    .attr('stroke', '#ced4da')
    .attr('stroke-width', 1.5)  // 更粗的边框

  // 绘制切割段
  bars.each(function(plan) {
    const bar = d3.select(this)
    let accumPosition = 0

    // 绘制切割段
    plan.pattern.forEach(cut => {
      const cutWidth = xScale(cut)
      const cutX = xScale(accumPosition)
      
      if (isNaN(cutWidth) || isNaN(cutX)) return

      // 切割段矩形
      bar.append('rect')
        .attr('x', cutX)
        .attr('y', 0)
        .attr('width', cutWidth)
        .attr('height', barHeight)
        .attr('fill', colorMap.get(cut))
        .attr('stroke', 'white')

      // 切割段标签
      if (cutWidth > 40) {
        bar.append('text')
          .attr('x', cutX + cutWidth/2)
          .attr('y', barHeight/2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('class', 'cut-label')
          .text(cut)
      }

      accumPosition += cut + sawKerf.value
    })

    // 显示余料
    const remainingLength = plan.waste
    if (remainingLength > 0) {
      const remainingX = xScale(accumPosition)
      const remainingWidth = xScale(remainingLength)
      
      if (!isNaN(remainingX) && !isNaN(remainingWidth)) {
        // 余料矩形
        bar.append('rect')
          .attr('x', remainingX)
          .attr('y', 0)
          .attr('width', remainingWidth)
          .attr('height', barHeight)
          .attr('fill', '#f8f9fa')
          .attr('stroke', '#dee2e6')
          .attr('stroke-dasharray', '4,4')

        // 余料文本背景
        const remainingText = `余料: ${remainingLength}mm`
        bar.append('rect')
          .attr('x', xScale(plan.stock.length) + 10)
          .attr('y', 0)
          .attr('width', 100)
          .attr('height', barHeight)
          .attr('fill', '#f8f9fa')
          .attr('rx', 4)
          .attr('ry', 4)

        // 余料文本
        bar.append('text')
          .attr('x', xScale(plan.stock.length) + 60)
          .attr('y', barHeight/2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('fill', '#666')
          .attr('class', 'remaining-label')
          .text(remainingText)
      }
    }
  })

  // 添加原料编号和规格
  bars.append('g')
    .attr('class', 'spec-label')
    .attr('transform', d => `translate(-10, 0)`)
    .append('rect')
    .attr('x', -80)
    .attr('y', 5)
    .attr('width', 80)
    .attr('height', 30)
    .attr('fill', '#f8f9fa')
    .attr('stroke', '#dee2e6')
    .attr('rx', 4)

  bars.select('.spec-label')
    .append('text')
    .attr('x', -40)
    .attr('y', barHeight/2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .attr('font-size', '12px')
    .text((d, i) => `${d.stock.length}mm`)

  // 添加图例
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width + 20}, 0)`)

  const legendGroup = svg.select('.legend')
    .append('g')
    .attr('transform', 'translate(10, 10)')

  const legendItems = legendGroup.selectAll('.legend-item')
    .data(Array.from(colorMap.entries()))
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 25})`)

  legendItems.append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', d => d[1])
    .attr('stroke', 'white')

  legendItems.append('text')
    .attr('x', 25)
    .attr('y', 12)
    .text(d => `${d[0]}mm`)
    .style('font-size', '12px')
    .style('font-weight', '500')

  // 添加刻度
  const xAxis = d3.axisBottom(xScale)
    .ticks(10)
    .tickFormat(d => `${d}mm`)

  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(xAxis)
}

// 添加样式
const style = document.createElement('style')
style.textContent = `
  .cut-label {
    font-size: 12px;
    font-weight: 500;
  }
  .remaining-label {
    font-size: 12px;
    font-weight: 500;
  }
  .utilization-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    min-width: 60px;
    text-align: center;
  }
  .bg-success {
    background-color: #28a745;
  }
  .bg-warning {
    background-color: #ffc107;
    color: #000; /* 黄色背景使用黑色文字更易读 */
  }
  .bg-danger {
    background-color: #dc3545;
  }
`
document.head.appendChild(style)

// 导入导出功能
const downloadTemplate = async () => {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  
  // 创建原料清单工作表
  const stockSheet = workbook.addWorksheet('原料清单');
  stockSheet.columns = [
    { header: '序号', width: 10 },
    { header: '长度(mm)', width: 15 },
    { header: '单价(元)', width: 15 }
  ];
  
  // 添加示例数据
  stockSheet.addRow([1, 6000, 100]);
  
  // 创建切割清单工作表
  const cutSheet = workbook.addWorksheet('切割清单');
  cutSheet.columns = [
    { header: '序号', width: 10 },
    { header: '长度(mm)', width: 15 },
    { header: '数量(根)', width: 15 }
  ];
  
  // 添加示例数据
  cutSheet.addRows([
    [1, 800, 3],
    [2, 500, 1],
    [3, 350, 6]
  ]);
  
  // 设置表头样式
  [stockSheet, cutSheet].forEach(sheet => {
    sheet.getRow(1).font = { name: '微软雅黑', size: 11 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDEBF7' }
    };
    
    // 添加说明行
    sheet.insertRow(1, ['请按照以下格式填写数据']);
    sheet.getRow(1).font = { name: '微软雅黑', size: 12, bold: true, color: { argb: 'FF0000FF' } };
    sheet.mergeCells('A1:C1');
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '门窗下料优化方案模板.xlsx';
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
            const [_, sn, length, price] = row.values;
            if (length && price) {
              stockData.push({
                length: Number(length),
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
            const [_, sn, length, quantity] = row.values;
            if (length && quantity) {
              cutData.push({
                length: Number(length),
                quantity: Number(quantity)
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
    { width: 40 },  // C列
    { width: 15 },  // D列
    { width: 15 }  // E列
  ];

  // 准备数据
  const data = [
    ['门窗下料优化方案'],
    [],  // 空行
    ['原料尺寸清单'],
    ['序号', '长度(mm)', '单价(元)'],
    ...stockList.value.map((stock, index) => [
      index + 1, 
      stock.length, 
      stock.price
    ]),
    [],  // 空行
    ['下料尺寸清单'],
    ['序号', '长度(mm)', '数量(根)'],
    ...cutList.value.map((cut, index) => [
      index + 1, 
      cut.length, 
      cut.quantity
    ]),
    [],  // 空行
    ['切割优化方案'],
    ['原料编号', '原料规格', '切割明细', '剩余长度(mm)', '利用率(%)'],
    ...cuttingPlan.value.map((plan, index) => [
      index + 1,
      plan.originalSpec,
      plan.cutDetails,
      `${plan.remainingLength.toFixed(2)}mm`,
      `${plan.utilization.toFixed(2)}%`
    ]),
    [],  // 空行
    ['总计数据'],
    ['总原料数(根)', '材料利用率(%)', '总废料长度(mm)', '总成本(元)'],
    [
      totalBars.value,
      `${utilization.value.toFixed(2)}%`,
      `${wasteLength.value.toFixed(2)}mm`,
      `${totalCost.value.toFixed(2)}元`
    ]
  ];

  // 添加数据到工作表
  worksheet.addRows(data);

  // 设置合并单元格
  worksheet.mergeCells('A1:E1');  // 主标题
  // worksheet.mergeCells('A3:C3');  // 原料清单标题
  // worksheet.mergeCells(`A${7 + stockList.value.length}:C${7 + stockList.value.length}`);  // 下料清单标题
  // worksheet.mergeCells(`A${11 + stockList.value.length + cutList.value.length}:E${11 + stockList.value.length + cutList.value.length}`);  // 切割方案标题
  // worksheet.mergeCells(`A${15 + stockList.value.length + cutList.value.length + cuttingPlan.value.length}:B${15 + stockList.value.length + cutList.value.length + cuttingPlan.value.length}`);  // 总计数据标题

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
        // cell.font = { name: '微软雅黑', size: 14, bold: true };
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
  link.download = '门窗下料优化方案.xlsx';
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
      downloadLink.download = `门窗切割方案_${new Date().toISOString().slice(0,10)}.png`;
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

// 组件挂载时初始化
onMounted(() => {
  calculateOptimization()
})
</script>

<style scoped>
.plastic-steel-view {
  min-height: 100vh;
  background-color: var(--dark-bg, #1e1e2f);
  color: var(--text-color, #f8f9fa);
}

.hero-section {
  position: relative;
  background: linear-gradient(135deg, #1a237e 0%, #4a148c 100%);
  color: white;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  padding: 2rem 0;
  margin-bottom: 1rem;
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
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(120deg, #ffe259, #ffa751);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 226, 89, 0.4);
}

.hero-subtitle {
  font-size: 1.4rem;
  font-weight: 400;
  opacity: 0.9;
}

/* 卡片样式 */
.steel-card {
  background: rgba(30, 30, 47, 0.6);
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.steel-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.card-body {
  padding: 1.5rem;
}

.card-title {
  color: #ffe259;
  font-weight: 600;
  display: flex;
  align-items: center;
}

/* 表单样式 */
.form-label {
  font-weight: 500;
  color: #ffa751;
  margin-bottom: 0.5rem;
}

.form-control {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: #ffa751;
  box-shadow: 0 0 0 0.2rem rgba(255, 167, 81, 0.25);
}

.input-group {
  margin-bottom: 0.75rem;
}

/* 按钮样式 */
.btn {
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-add {
  background: linear-gradient(135deg, #43a047, #1de9b6);
  border: none;
  color: white;
}

.btn-add:hover {
  background: linear-gradient(135deg, #2e7d32, #00bfa5);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(29, 233, 182, 0.4);
}

.btn-delete {
  background-color: rgba(244, 67, 54, 0.8);
  border: none;
  color: white;
  width: 40px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-delete:hover {
  background-color: #d32f2f;
}

.btn-calculate {
  background: linear-gradient(135deg, #ff9800, #ff5722);
  border: none;
  color: white;
  padding: 0.8rem 1.5rem;
  font-size: 1.1rem;
}

.btn-calculate:hover {
  background: linear-gradient(135deg, #f57c00, #e64a19);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.4);
}

/* 统计卡片样式 */
.stats-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.2rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  height: 100%;
  transition: all 0.3s ease;
}

.stats-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.stats-icon {
  color: #ffa751;
  margin-bottom: 0.8rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 167, 81, 0.15);
}

.stats-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: #fff;
}

.stats-label {
  font-size: 0.9rem;
  color: #bbb;
}

/* 表格样式 */
.custom-table {
  width: 100%;
  color: #ddd;
  border-collapse: separate;
  border-spacing: 0;
}

.custom-table thead th {
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffa751;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
}

.custom-table tbody td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.custom-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.table-total {
  background-color: rgba(255, 167, 81, 0.1);
}

.table-total td {
  color: #ffa751;
}

.utilization-badge {
  display: inline-block;
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 50rem;
}

.bg-success {
  background-color: rgba(40, 167, 69, 0.8);
}

.bg-warning {
  background-color: rgba(255, 193, 7, 0.8);
  color: #212529;
}

.bg-danger {
  background-color: rgba(220, 53, 69, 0.8);
}

.text-danger {
  color: #f5706c !important;
}

.empty-state {
  padding: 3rem 1rem;
  color: #777;
}

/* 可视化区域 */
.cutting-visualization {
  width: 100%;
  overflow-x: auto;
  min-height: 300px;
  padding: 1rem 0;
}

/* 导入导出按钮 */
.btn-action {
  width: 50px;
  height: 50px;
  padding: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a148c, #7b1fa2);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: white;
}

.btn-action:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(123, 31, 162, 0.5);
  background: linear-gradient(135deg, #7b1fa2, #9c27b0);
}

.btn-icon-with-label {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container-box {
  width: 100%;
  margin: 0 auto;
  padding: 0 .8rem;
}

.btn-label {
  font-size: 0.8rem;
  color: #ddd;
  margin-top: 0.5rem;
}

/* 响应式设计 */
@media (max-width: 991px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
}

@media (max-width: 767px) {
  .hero-section {
    padding: 40px 0;
  }
  
  .stats-value {
    font-size: 1.5rem;
  }
  
  .stats-icon {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 576px) {
  .hero-title {
    font-size: 1.8rem;
  }
  
  .btn-action {
    width: 40px;
    height: 40px;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .btn-label {
    font-size: 0.7rem;
  }
}

/* 输入区域固定定位 */
.input-section {
  position: relative;
  top: 0;
  max-height: none;
  overflow-y: visible;
  z-index: 1;
}

@media (min-width: 992px) {
  .input-section {
    position: sticky;
    top: 10px;
    height: 100vh;
    overflow-y: auto;
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
    background: rgba(255, 255, 255, 0.15);
  }
}

/* 动画 */
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
</style> 
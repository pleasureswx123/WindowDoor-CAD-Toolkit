/**
 * 表示一个矩形区域
 */
class Rectangle {
  constructor(width, height, x = 0, y = 0, price = 0) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.price = price;
  }

  getArea() {
    return this.width * this.height;
  }

  clone() {
    return new Rectangle(this.width, this.height, this.x, this.y, this.price);
  }
}

/**
 * 切割方案类
 */
class CuttingPlan {
  constructor(stock, items) {
    this.stock = stock;
    this.items = items;
    this.placements = [];
    this.wasteArea = 0;
    this.totalCost = 0;
    this.utilization = 0;
    this.cuts = []; // 存储切割信息
    this.remainingSpaces = []; // 存储余料信息
  }

  calculateUtilization() {
    const stockArea = this.stock.getArea();
    let usedArea = 0;
    for (const item of this.placements) {
      usedArea += item.width * item.height;
    }
    this.wasteArea = stockArea - usedArea;
    this.utilization = (usedArea / stockArea) * 100;
    return this.utilization;
  }

  getVisualizationData() {
    return {
      stock: {
        width: this.stock.width,
        height: this.stock.height,
        price: this.stock.price
      },
      placements: this.placements.map((item) => ({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotated: item.rotated || false
      })),
      cuts: this.cuts,
      remainingSpaces: this.remainingSpaces,
      wasteArea: this.wasteArea,
      utilization: this.utilization,
      totalCost: this.totalCost
    };
  }

  clone() {
    const newPlan = new CuttingPlan(
      this.stock.clone(),
      this.items.map((item) => item.clone())
    );
    newPlan.placements = this.placements.map((item) => item.clone());
    newPlan.wasteArea = this.wasteArea;
    newPlan.totalCost = this.totalCost;
    newPlan.utilization = this.utilization;
    newPlan.cuts = [...this.cuts];
    newPlan.remainingSpaces = this.remainingSpaces.map(space => space.clone());
    return newPlan;
  }

  getRemainingSpaces() {
    const spaces = [];
    const stockArea = this.stock.getArea();
    let usedArea = 0;

    // 创建一个二维数组表示使用情况
    const used = Array(this.stock.height).fill().map(() => 
      Array(this.stock.width).fill(false)
    );

    // 标记已使用的区域
    for (const item of this.placements) {
      usedArea += item.width * item.height;
      for (let y = item.y; y < item.y + item.height; y++) {
        for (let x = item.x; x < item.x + item.width; x++) {
          used[y][x] = true;
        }
      }
    }

    // 查找未使用的连续区域
    for (let y = 0; y < this.stock.height; y++) {
      for (let x = 0; x < this.stock.width; x++) {
        if (!used[y][x]) {
          let width = 0;
          let height = 0;

          // 计算宽度
          while (x + width < this.stock.width && !used[y][x + width]) {
            width++;
          }

          // 计算高度
          while (y + height < this.stock.height) {
            let canExtend = true;
            for (let w = 0; w < width; w++) {
              if (used[y + height][x + w]) {
                canExtend = false;
                break;
              }
            }
            if (!canExtend) break;
            height++;
          }

          if (width > 0 && height > 0) {
            spaces.push(new Rectangle(width, height, x, y));
            // 标记这个区域为已处理
            for (let h = 0; h < height; h++) {
              for (let w = 0; w < width; w++) {
                used[y + h][x + w] = true;
              }
            }
          }
        }
      }
    }

    return spaces;
  }

  // 计算切割线
  calculateCuts() {
    this.cuts = [];
    const horizontalCuts = new Set();
    const verticalCuts = new Set();

    // 添加所有切割件的边界作为切割线
    for (const piece of this.placements) {
      verticalCuts.add(piece.x);
      verticalCuts.add(piece.x + piece.width);
      horizontalCuts.add(piece.y);
      horizontalCuts.add(piece.y + piece.height);
    }

    // 转换为数组并排序
    const vCuts = Array.from(verticalCuts).sort((a, b) => a - b);
    const hCuts = Array.from(horizontalCuts).sort((a, b) => a - b);

    // 存储切割线信息
    this.cuts = {
      vertical: vCuts,
      horizontal: hCuts
    };
  }

  // 计算余料区域
  calculateRemainingSpaces() {
    this.remainingSpaces = this.getRemainingSpaces();
  }

  // 更新所有计算结果
  updateCalculations() {
    this.calculateUtilization();
    this.calculateCuts();
    this.calculateRemainingSpaces();
  }
}

/**
 * 优化配置类
 */
class OptimizationConfig {
  constructor() {
    this.optimizationStrategy = 'utilization';
    this.layoutStrategy = 'vertical'; // 默认使用垂直布局
    this.firstCutDirection = 'vertical'; // 默认使用垂直第一刀
    this.cuttingLoss = 0;
    this.preferVerticalAlignment = true; // 新增：优先垂直对齐
  }
}

/**
 * 使用遗传算法优化切割方案
 */
class GeneticOptimizer {
  constructor(stock, items, config, populationSize = 50, generations = 100) {
    this.stock = stock;
    this.items = items;
    this.config = config;
    this.populationSize = populationSize;
    this.generations = generations;
    this.mutationRate = 0.1;
    this.elitismCount = Math.floor(populationSize * 0.1);
  }

  optimize() {
    try {
      let population = this.initializePopulation();
      let bestSolution = null;
      let bestFitness = 0;

      for (let gen = 0; gen < this.generations; gen++) {
        const evaluated = population.map((chromosome) => ({
          chromosome,
          fitness: this.evaluateFitness(chromosome),
        }));

        const currentBest = evaluated.reduce((best, current) =>
          current.fitness > best.fitness ? current : best
        );

        if (currentBest.fitness > bestFitness) {
          bestFitness = currentBest.fitness;
          bestSolution = currentBest.chromosome;
        }

        const elites = evaluated
          .sort((a, b) => b.fitness - a.fitness)
          .slice(0, this.elitismCount)
          .map((e) => e.chromosome);

        const newPopulation = [...elites];

        while (newPopulation.length < this.populationSize) {
          const parent1 = this.tournamentSelect(evaluated);
          const parent2 = this.tournamentSelect(evaluated);
          const child = this.crossover(parent1, parent2);

          if (Math.random() < this.mutationRate) {
            this.mutate(child);
          }

          newPopulation.push(child);
        }

        population = newPopulation;
      }

      return this.decodeSolution(bestSolution || population[0]);
    } catch (error) {
      console.error('优化过程出错:', error);
      // 返回一个空的切割方案
      return new CuttingPlan(this.stock, this.items);
    }
  }

  initializePopulation() {
    const population = [];
    for (let i = 0; i < this.populationSize; i++) {
      const chromosome = this.items.map((_, index) => ({
        index,
        rotation: Math.random() < 0.5,
      }));
      this.shuffleArray(chromosome);
      population.push(chromosome);
    }
    return population;
  }

  evaluateFitness(chromosome) {
    const plan = this.decodeSolution(chromosome);
    let fitness = plan.calculateUtilization();

    // 根据优化策略调整适应度
    switch (this.config.optimizationStrategy) {
      case 'minCuts':
        // 减少切割次数，每个切割位置都会产生一定的惩罚
        fitness -= (plan.placements.length * 0.5);
        break;
      case 'price':
        // 考虑成本因素
        fitness = fitness * (1 - (plan.totalCost / 10000)); // 假设最高成本为10000
        break;
    }

    // 根据排样策略调整适应度
    if (this.config.layoutStrategy !== 'any') {
      const alignmentPenalty = this.calculateAlignmentPenalty(plan);
      fitness -= alignmentPenalty;
    }

    // 考虑切割损耗
    if (this.config.cuttingLoss > 0) {
      const lossPenalty = this.calculateLossPenalty(plan);
      fitness -= lossPenalty;
    }

    return fitness;
  }

  calculateAlignmentPenalty(plan) {
    let penalty = 0;
    const placements = plan.placements;

    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        if (this.config.layoutStrategy === 'horizontal') {
          // 检查是否水平对齐
          if (placements[i].y !== placements[j].y) {
            penalty += 1;
          }
        } else if (this.config.layoutStrategy === 'vertical') {
          // 检查是否垂直对齐
          if (placements[i].x !== placements[j].x) {
            penalty += 1;
          }
        }
      }
    }

    return penalty * 0.5; // 调整惩罚权重
  }

  calculateLossPenalty(plan) {
    let cuts = 0;
    const placements = plan.placements;

    // 计算切割线数量
    for (let i = 0; i < placements.length; i++) {
      cuts += 2; // 每个矩形需要两次切割
    }

    return (cuts * this.config.cuttingLoss) / plan.stock.getArea() * 100;
  }

  tournamentSelect(evaluated, tournamentSize = 3) {
    const tournament = [];
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * evaluated.length);
      tournament.push(evaluated[randomIndex]);
    }
    return tournament.reduce((best, current) =>
      current.fitness > best.fitness ? current : best
    ).chromosome;
  }

  crossover(parent1, parent2) {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    const child = new Array(parent1.length);
    const used = new Set();

    // 从第一个父代复制
    for (let i = 0; i < crossoverPoint; i++) {
      child[i] = { ...parent1[i] };
      used.add(parent1[i].index);
    }

    // 从第二个父代填充剩余位置
    let j = crossoverPoint;
    for (const gene of parent2) {
      if (!used.has(gene.index)) {
        child[j] = { ...gene };
        j++;
      }
    }

    return child;
  }

  mutate(chromosome) {
    // 随机交换两个位置
    const i = Math.floor(Math.random() * chromosome.length);
    const j = Math.floor(Math.random() * chromosome.length);
    [chromosome[i], chromosome[j]] = [chromosome[j], chromosome[i]];

    // 随机改变旋转
    const k = Math.floor(Math.random() * chromosome.length);
    chromosome[k].rotation = !chromosome[k].rotation;
  }

  decodeSolution(chromosome) {
    // 添加错误处理
    if (!chromosome || !Array.isArray(chromosome)) {
      console.warn('无效的染色体数据:', chromosome);
      return new CuttingPlan(this.stock, this.items);
    }

    const plan = new CuttingPlan(this.stock, this.items);
    const skyline = [{ x: 0, y: 0, width: this.stock.width }];

    try {
      // 应用第一刀方向的预处理
      if (this.config.firstCutDirection !== 'none') {
        this.applyFirstCut(plan, skyline);
      }

      for (const gene of chromosome) {
        if (!gene || typeof gene.index === 'undefined') continue;
        
        const item = this.items[gene.index];
        if (!item) continue;
        
        const width = gene.rotation ? item.height : item.width;
        const height = gene.rotation ? item.width : item.height;

        // 检查尺寸是否有效
        if (!width || !height || width <= 0 || height <= 0) continue;

        // 检查是否符合排样策略
        if (this.config.layoutStrategy !== 'any') {
          const alignmentPos = this.findAlignedPosition(skyline, width, height);
          if (alignmentPos) {
            const placement = new Rectangle(width, height, alignmentPos.x, alignmentPos.y);
            placement.rotated = gene.rotation;
            plan.placements.push(placement);
            this.updateSkyline(skyline, alignmentPos);
            continue;
          }
        }

        // 常规位置查找
        const bestPos = this.findBestPosition(skyline, width, height);
        if (bestPos) {
          const placement = new Rectangle(width, height, bestPos.x, bestPos.y);
          placement.rotated = gene.rotation;
          plan.placements.push(placement);
          this.updateSkyline(skyline, bestPos);
        }
      }
    } catch (error) {
      console.error('切割方案生成错误:', error);
    }

    return plan;
  }

  applyFirstCut(plan, skyline) {
    const midPoint = this.config.firstCutDirection === 'vertical' 
      ? Math.floor(this.stock.width / 2)
      : Math.floor(this.stock.height / 2);

    if (this.config.firstCutDirection === 'vertical') {
      skyline.length = 0;
      skyline.push(
        { x: 0, y: 0, width: midPoint },
        { x: midPoint, y: 0, width: this.stock.width - midPoint }
      );
    } else {
      // 水平切割时调整skyline的y值
      skyline[0].y = midPoint;
    }
  }

  findAlignedPosition(skyline, width, height) {
    if (this.config.layoutStrategy === 'horizontal') {
      // 查找水平对齐的位置
      return this.findHorizontalAlignedPosition(skyline, width, height);
    } else if (this.config.layoutStrategy === 'vertical') {
      // 查找垂直对齐的位置
      return this.findVerticalAlignedPosition(skyline, width, height);
    }
    return null;
  }

  findHorizontalAlignedPosition(skyline, width, height) {
    // 按y坐标分组的现有放置
    const yLevels = new Set(skyline.map(s => s.y));
    
    for (const y of yLevels) {
      // 在每个y层级查找可用空间
      for (const segment of skyline) {
        if (segment.y === y && segment.width >= width) {
          return {
            x: segment.x,
            y: segment.y,
            width,
            height
          };
        }
      }
    }
    return null;
  }

  findVerticalAlignedPosition(skyline, width, height) {
    // 优先尝试垂直对齐放置
    let bestX = 0;
    let bestY = Infinity;
    let found = false;

    // 首先尝试从左边开始放置
    for (const segment of skyline) {
      if (segment.width >= width) {
        const y = segment.y;
        if (y + height <= this.stock.height && y < bestY) {
          bestY = y;
          bestX = segment.x;
          found = true;
        }
      }
    }

    if (found) {
      return {
        x: bestX,
        y: bestY,
        width,
        height
      };
    }

    return null;
  }

  findBestPosition(skyline, width, height) {
    // 首先尝试垂直对齐的位置
    const alignedPos = this.findVerticalAlignedPosition(skyline, width, height);
    if (alignedPos) {
      return alignedPos;
    }

    // 如果找不到垂直对齐的位置，再尝试其他位置
    let bestPos = null;
    let bestHeight = Infinity;

    for (let i = 0; i < skyline.length; i++) {
      const segment = skyline[i];
      if (width <= segment.width) {
        const y = segment.y;
        
        // 检查是否有足够的高度
        if (y + height <= this.stock.height && y < bestHeight) {
          bestPos = {
            x: segment.x,
            y: y,
            width,
            height
          };
          bestHeight = y;
        }
      }
    }

    return bestPos;
  }

  updateSkyline(skyline, pos) {
    const newSegments = [];
    let i = 0;

    while (i < skyline.length && skyline[i].x + skyline[i].width <= pos.x) {
      newSegments.push(skyline[i]);
      i++;
    }

    if (i < skyline.length && skyline[i].x < pos.x) {
      newSegments.push({
        x: skyline[i].x,
        y: skyline[i].y,
        width: pos.x - skyline[i].x,
      });
    }

    newSegments.push({
      x: pos.x,
      y: pos.y + pos.height,
      width: pos.width,
    });

    while (i < skyline.length) {
      if (skyline[i].x + skyline[i].width > pos.x + pos.width) {
        if (skyline[i].x < pos.x + pos.width) {
          newSegments.push({
            x: pos.x + pos.width,
            y: skyline[i].y,
            width: skyline[i].x + skyline[i].width - (pos.x + pos.width),
          });
        } else {
          newSegments.push(skyline[i]);
        }
      }
      i++;
    }

    for (i = 0; i < newSegments.length - 1; i++) {
      if (newSegments[i].y === newSegments[i + 1].y) {
        newSegments[i].width += newSegments[i + 1].width;
        newSegments.splice(i + 1, 1);
        i--;
      }
    }

    skyline.length = 0;
    skyline.push(...newSegments);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

/**
 * 主要的切割算法实现
 */
function optimizeCuts(stockList, items, config = new OptimizationConfig()) {
  let plans = [];
  let remainingItems = [];
  
  // 展开所有需要的数量
  items.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      remainingItems.push(new Rectangle(item.width, item.height));
    }
  });

  // 对每种规格的原料进行优化，直到所有切割项都被放置
  while (remainingItems.length > 0) {
    let bestPlanForCurrentBatch = null;
    let bestUtilization = 0;
    
    // 尝试每种规格的原料
    for (const stock of stockList) {
      const stockRect = new Rectangle(stock.width, stock.height, 0, 0, stock.price);
      const optimizer = new GeneticOptimizer(stockRect, remainingItems, config, 100, 200);
      const plan = optimizer.optimize();
      
      // 更新所有计算结果
      plan.updateCalculations();
      
      const utilization = plan.utilization;
      plan.totalCost = stock.price;
      
      if (utilization > bestUtilization) {
        bestUtilization = utilization;
        bestPlanForCurrentBatch = plan;
      }
    }
    
    if (bestPlanForCurrentBatch) {
      // 将最佳方案添加到结果中
      plans.push(bestPlanForCurrentBatch);
      
      // 从剩余项中移除已放置的切割项
      const placedItems = new Set();
      bestPlanForCurrentBatch.placements.forEach(placement => {
        for (let i = 0; i < remainingItems.length; i++) {
          const item = remainingItems[i];
          if (!placedItems.has(i) && 
              ((item.width === placement.width && item.height === placement.height) ||
               (item.height === placement.width && item.width === placement.height))) {
            placedItems.add(i);
            break;
          }
        }
      });
      
      // 更新剩余项
      remainingItems = remainingItems.filter((_, index) => !placedItems.has(index));
    } else {
      // 如果没有找到可行方案，说明可能有问题
      console.error('无法找到合适的切割方案');
      break;
    }
  }

  // 计算总体统计信息
  let totalUtilization = 0;
  let totalCost = 0;
  let totalWasteArea = 0;
  
  plans.forEach(plan => {
    totalUtilization += plan.utilization;
    totalCost += plan.totalCost;
    totalWasteArea += plan.wasteArea;
  });
  
  // 如果有多个方案，计算平均利用率
  if (plans.length > 0) {
    totalUtilization /= plans.length;
  }

  // 返回所有切割方案
  return {
    plans: plans,
    totalUtilization: totalUtilization,
    totalCost: totalCost,
    totalWasteArea: totalWasteArea,
    sheetsCount: plans.length
  };
}

// 测试用例1
function testCase1() {
  const stock = { width: 2440, height: 1220 };
  const items = [
    { width: 600, height: 500, quantity: 5 },
    { width: 700, height: 400, quantity: 4 },
  ];

  const plan = optimizeCuts(stock, items);
  console.log("测试用例1利用率:", plan.calculateUtilization().toFixed(2) + "%");
  return plan;
}

// 测试用例2
function testCase2() {
  const stock = { width: 4000, height: 1500 };
  const items = [
    { width: 1000, height: 700, quantity: 4 },
    { width: 800, height: 600, quantity: 4 },
    { width: 800, height: 300, quantity: 2 },
    { width: 400, height: 500, quantity: 3 },
  ];

  const plan = optimizeCuts(stock, items);
  console.log("测试用例2利用率:", plan.calculateUtilization().toFixed(2) + "%");
  return plan;
}

export {
  optimizeCuts as default,
  testCase1,
  testCase2,
  Rectangle,
  CuttingPlan,
  OptimizationConfig,
};

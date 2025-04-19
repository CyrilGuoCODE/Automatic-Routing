/**
 * Automatic-Routing 智能域名路由系统
 * 自动重定向脚本 - v1.5
 */

(function() {
  // 默认配置
  var config = {
    domains: [],  // 域名列表将从环境中加载
    apiUrl: window.location.protocol + '//' + window.location.host,  // 使用当前域名作为API地址
    priorityFactor: 'combined',  // 优先因素：latency（延迟）, ttfb（首字节时间）, combined（综合评分）, comprehensive（全面分析）
    considerGeoLocation: true,  // 是否考虑地理位置
    cookieExpiration: 7,  // Cookie有效期（天）
    forceRedirect: false,  // 是否强制重定向（即使已有Cookie）
    autoRun: true,  // 是否自动运行（无需手动初始化）
    testMethod: 'comprehensive',  // 测试方法：'image', 'xhr', 'fetch', 'page', 'webrtc', 'tcp-timing', 'concurrent', 'comprehensive'
    sampleSize: 2,  // 测试样本数量（每个域名测试次数）
    timeout: 8000,  // 超时时间（毫秒）
    useMLWeights: true,  // 是否使用机器学习优化的权重
    adaptiveAnalysis: true,  // 是否根据网络环境自适应选择最佳分析方法
    metrics: {      // 测量指标权重
      latency: 0.35,        // 网络延迟权重
      ttfb: 0.25,           // 首字节时间权重
      responseTime: 0.15,   // 响应时间权重
      stability: 0.1,       // 连接稳定性权重
      concurrency: 0.1,     // 并发处理能力权重
      connectionQuality: 0.05 // 连接质量权重
    },

    mlWeights: {
      // 4G环境
      mobile4G: {
        latency: 0.4,
        ttfb: 0.3,
        responseTime: 0.15,
        stability: 0.05,
        concurrency: 0.05,
        connectionQuality: 0.05
      },
      // WiFi环境
      wifi: {
        latency: 0.3,
        ttfb: 0.3,
        responseTime: 0.1,
        stability: 0.1,
        concurrency: 0.15,
        connectionQuality: 0.05
      },
      // 高速宽带环境
      broadband: {
        latency: 0.25,
        ttfb: 0.25,
        responseTime: 0.1,
        stability: 0.1,
        concurrency: 0.2,
        connectionQuality: 0.1
      },
      // 低速网络环境
      slow: {
        latency: 0.5,
        ttfb: 0.2,
        responseTime: 0.2,
        stability: 0.05,
        concurrency: 0.03,
        connectionQuality: 0.02
      }
    }
  };

  // 初始化
  function init(options) {
    // 合并配置
    if (options) {
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          if (key === 'metrics' && options.metrics) {
            for (var metricKey in options.metrics) {
              if (options.metrics.hasOwnProperty(metricKey)) {
                config.metrics[metricKey] = options.metrics[metricKey];
              }
            }
          } else {
            config[key] = options[key];
          }
        }
      }
    }

    // 如果当前是file://协议，提示用户并停止执行
    if (window.location.protocol === 'file:') {
      console.warn('Automatic-Routing: 检测到file://协议，跨域请求被限制。请将文件部署到Web服务器上运行。');
      return;
    }

    // 如果没有指定域名，则从当前页面获取
    if (config.domains.length === 0) {
      var currentDomain = window.location.hostname;
      // 尝试从页面meta标签获取备用域名
      var altDomainsMeta = document.querySelector('meta[name="automatic-routing-domains"]');
      if (altDomainsMeta && altDomainsMeta.getAttribute('content')) {
        // 先分割域名列表，然后去除每个域名的空格
        config.domains = altDomainsMeta.getAttribute('content').split(',').map(function(domain) {
          return domain.trim();
        });
      } else {
        console.warn('Automatic-Routing: 未找到域名配置，请添加meta标签或手动配置');
        return;
      }
    }

    // 检查是否需要重定向
    if (shouldRedirect()) {
      findBestDomain(function(bestDomain) {
        if (bestDomain && bestDomain !== window.location.hostname) {
          // 设置Cookie
          setCookie('ar_best_domain', bestDomain, config.cookieExpiration);
          
          // 重定向到最佳域名
          redirect(bestDomain);
        }
      });
    }
  }

  // 判断是否需要重定向
  function shouldRedirect() {
    // 如果强制重定向，则总是重定向
    if (config.forceRedirect) {
      return true;
    }

    // 检查Cookie
    var bestDomain = getCookie('ar_best_domain');
    
    // 如果没有Cookie或者当前域名不是最佳域名，则需要重定向
    return !bestDomain || bestDomain !== window.location.hostname;
  }

  // 获取最佳域名
  function findBestDomain(callback) {
    if (!config.domains || config.domains.length === 0 || config.domains.length === 1) {
      console.error('Automatic-Routing: 需要至少两个域名进行比较');
      return;
    }

    // 记录测试开始时间
    console.log('开始测试域名: ', config.domains);
    
    // 首先估算当前网络环境类型
    estimateNetworkType()
      .then(networkType => {
        console.log(`检测到网络环境类型: ${networkType}`);
        
        // 如果启用了机器学习权重，根据网络环境选择最佳权重
        if (config.useMLWeights && config.mlWeights[networkType]) {
          // 临时保存原始权重
          const originalWeights = { ...config.metrics };
          
          // 应用匹配网络环境的权重
          config.metrics = { ...config.mlWeights[networkType] };
          
          console.log(`应用 ${networkType} 环境的优化权重:`, config.metrics);
          
          // 测试完成后恢复原始权重
          setTimeout(() => {
            config.metrics = originalWeights;
          }, 10000);
        }
        
        // 根据网络环境自适应选择最佳测试方法
        if (config.adaptiveAnalysis) {
          const originalMethod = config.testMethod;
          
          // 为不同网络环境选择最佳测试方法
          switch (networkType) {
            case 'mobile4G':
              config.testMethod = 'tcp-timing';
              break;
            case 'wifi':
              config.testMethod = 'comprehensive';
              break;
            case 'broadband':
              config.testMethod = 'concurrent';
              break;
            case 'slow':
              config.testMethod = 'xhr';
              break;
            default:
              // 保持不变
          }
          
          if (originalMethod !== config.testMethod) {
            console.log(`根据网络环境自动调整测试方法: ${originalMethod} -> ${config.testMethod}`);
            
            // 测试完成后恢复原始测试方法
            setTimeout(() => {
              config.testMethod = originalMethod;
            }, 10000);
          }
        }
        
        // 执行域名测试
        runDomainTests();
      })
      .catch(() => {
        // 估算失败，使用默认配置继续测试
        console.log('无法估算网络环境，使用默认配置');
        runDomainTests();
      });
    
    // 执行域名测试
    function runDomainTests() {
      // 收集各域名性能数据
      Promise.all(config.domains.map(domain => {
        return runDomainTests(domain);
      })).then(results => {
        console.log('域名测试结果: ', results);
        
        // 根据配置的优先因素和权重计算综合得分
        const scoredResults = results.map(result => {
          // 初始化得分
          let score = 0;
          
          // 如果是综合测试结果且有可用的comprehensiveScore
          if (result.comprehensiveScore !== undefined) {
            // 直接使用预计算的综合得分
            score = result.comprehensiveScore;
          } else {
            // 否则计算基于各指标的得分
            
            // 基础延迟得分 (越低越好)
            const latencyScore = calculateMetricScore(result.metrics.latency, 50, 500, true);
            
            // 首字节时间得分 (越低越好)
            const ttfbScore = calculateMetricScore(result.metrics.ttfb, 100, 1000, true);
            
            // 响应时间得分 (越低越好)
            const responseScore = calculateMetricScore(result.metrics.responseTime, 200, 2000, true);
            
            // 连接稳定性得分 (越高越好)
            const stabilityScore = result.metrics.successRate || 0;
            
            // 并发性能得分 (如果有)
            const concurrencyScore = result.metrics.concurrencyScore || 0.5;
            
            // 连接质量得分 (如果有)
            const connectionQualityScore = result.metrics.connectionQuality || 0.5;
            
            // 计算加权总分
            score = (latencyScore * config.metrics.latency) +
                    (ttfbScore * config.metrics.ttfb) +
                    (responseScore * config.metrics.responseTime) +
                    (stabilityScore * config.metrics.stability) + 
                    (concurrencyScore * config.metrics.concurrency) +
                    (connectionQualityScore * config.metrics.connectionQuality);
          }

          if (config.adaptiveAnalysis) {

          }
          
          // 确保分数在0-1范围内
          score = Math.max(0, Math.min(1, score));
          
          return {
            ...result,
            score: score
          };
        });
        
        // 按照得分排序
        let sortedResults;
        
        if (config.priorityFactor === 'latency') {
          // 按延迟排序（越低越好）
          sortedResults = scoredResults.sort((a, b) => {
            return a.metrics.latency - b.metrics.latency;
          });
        } else if (config.priorityFactor === 'ttfb') {
          // 按首字节时间排序（越低越好）
          sortedResults = scoredResults.sort((a, b) => {
            return a.metrics.ttfb - b.metrics.ttfb;
          });
        } else {
          // 按综合得分排序（越高越好）
          sortedResults = scoredResults.sort((a, b) => {
            return b.score - a.score;
          });
        }
        
        // 选择最佳域名
        const bestDomain = sortedResults[0]?.domain;
        console.log('最佳域名: ', bestDomain, '得分:', sortedResults[0]?.score.toFixed(4), '延迟:', sortedResults[0]?.metrics.latency, 'ms');
        
        // 输出所有域名的得分情况
        sortedResults.forEach((result, index) => {
          console.log(`${index+1}. ${result.domain}: 得分=${result.score.toFixed(4)}, 延迟=${result.metrics.latency}ms, TTFB=${result.metrics.ttfb}ms`);
        });
        
        callback(bestDomain);
      }).catch(error => {
        console.error('Automatic-Routing: 测试域名失败', error);
        callback(null);
      });
    }
  }
  
  // 估算当前网络环境类型
  function estimateNetworkType() {
    return new Promise((resolve, reject) => {
      // 检查是否支持Navigator连接信息API
      if (navigator.connection && navigator.connection.effectiveType) {
        const effectiveType = navigator.connection.effectiveType;
        
        // 根据连接类型估算网络环境
        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            resolve('slow');
            return;
          case '3g':
            resolve('mobile4G'); // 实际上是3G，但使用mobile4G配置
            return;
          case '4g':
            resolve('mobile4G');
            return;
          default:
            // 默认WiFi，后续会尝试进一步确认
            break;
        }
      }
      
      // 如果无法通过API确定，则执行一个简单的速度测试
      const startTime = Date.now();
      
      fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors'
      })
      .then(() => {
        const duration = Date.now() - startTime;
        
        // 根据响应时间粗略估计网络类型
        if (duration < 100) {
          resolve('broadband');
        } else if (duration < 300) {
          resolve('wifi');
        } else if (duration < 1000) {
          resolve('mobile4G');
        } else {
          resolve('slow');
        }
      })
      .catch(() => {
        // 如果测试失败，假设为中等速度的WiFi
        resolve('wifi');
      });
    });
  }
  
  // 计算单个指标的得分
  function calculateMetricScore(value, bestThreshold, worstThreshold, lowerIsBetter) {
    if (value === undefined || value === null) {
      return 0.5; // 默认中等得分
    }
    
    if (lowerIsBetter) {
      // 数值越低越好（如延迟）
      if (value <= bestThreshold) return 1;
      if (value >= worstThreshold) return 0;
      
      // 线性插值
      return 1 - ((value - bestThreshold) / (worstThreshold - bestThreshold));
    } else {
      // 数值越高越好
      if (value >= bestThreshold) return 1;
      if (value <= worstThreshold) return 0;
      
      // 线性插值
      return (value - worstThreshold) / (bestThreshold - worstThreshold);
    }
  }

  // 对单个域名进行多次测试
  function runDomainTests(domain) {
    return new Promise((resolve) => {
      const testsPromises = [];
      
      // 进行多次测试以获取更稳定的结果
      for (let i = 0; i < config.sampleSize; i++) {
        testsPromises.push(testDomain(domain));
      }
      
      // 汇总所有测试结果
      Promise.all(testsPromises).then(tests => {
        // 计算平均值和成功率
        const successfulTests = tests.filter(test => test.success);
        const successRate = successfulTests.length / tests.length;
        
        // 如果所有测试都失败，则返回失败结果
        if (successfulTests.length === 0) {
          resolve({
            domain,
            success: false,
            metrics: {
              latency: 9999,
              ttfb: 9999,
              responseTime: 9999,
              successRate: 0
            }
          });
          return;
        }
        
        // 计算平均指标
        const avgLatency = successfulTests.reduce((sum, test) => sum + test.latency, 0) / successfulTests.length;
        const avgTTFB = successfulTests.reduce((sum, test) => sum + (test.ttfb || 0), 0) / successfulTests.length;
        const avgResponseTime = successfulTests.reduce((sum, test) => sum + (test.responseTime || 0), 0) / successfulTests.length;
        
        resolve({
          domain,
          success: true,
          metrics: {
            latency: avgLatency,
            ttfb: avgTTFB,
            responseTime: avgResponseTime,
            successRate: successRate
          }
        });
      });
    });
  }

  // 测试单个域名的性能
  function testDomain(domain) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // 设置超时
      const timeout = setTimeout(() => {
        console.log(`域名 ${domain} 测试超时`);
        resolve({
          domain,
          latency: 9999,
          ttfb: 9999,
          responseTime: 9999,
          success: false
        });
      }, config.timeout);
      
      // 选择测试方法
      switch (config.testMethod) {
        case 'image':
          testWithImage(domain, startTime, timeout, resolve);
          break;
        case 'fetch':
          testWithFetch(domain, startTime, timeout, resolve);
          break;
        case 'page':
          testWithIframe(domain, startTime, timeout, resolve);
          break;
        case 'webrtc':
          testWithWebRTC(domain, startTime, timeout, resolve);
          break;
        case 'tcp-timing':
          testWithTCPTiming(domain, startTime, timeout, resolve);
          break;
        case 'concurrent':
          testWithConcurrentConnections(domain, startTime, timeout, resolve);
          break;
        case 'comprehensive':
          testComprehensive(domain, startTime, timeout, resolve);
          break;
        case 'xhr':
        default:
          testWithXHR(domain, startTime, timeout, resolve);
          break;
      }
    });
  }
  
  // 使用图片加载测试域名
  function testWithImage(domain, startTime, timeout, resolve) {
    const img = new Image();
    
    img.onload = function() {
      clearTimeout(timeout);
      const endTime = Date.now();
      const latency = endTime - startTime;
      console.log(`域名 ${domain} 测试成功, 延迟: ${latency}ms`);
      resolve({
        domain,
        latency: latency,
        ttfb: 0, // 图片无法测量TTFB
        responseTime: latency,
        success: true
      });
    };
    
    img.onerror = function(e) {
      clearTimeout(timeout);
      console.log(`域名 ${domain} 图片加载失败`, e);
      resolve({
        domain,
        latency: 9999,
        ttfb: 9999,
        responseTime: 9999,
        success: false
      });
    };
    
    // 添加随机参数防止缓存
    img.src = `https://${domain}/favicon.ico?_=${Date.now()}`;
  }
  
  // 使用XHR请求测试域名
  function testWithXHR(domain, startTime, timeout, resolve) {
    try {
      const xhr = new XMLHttpRequest();
      let ttfbTime = 0;
      
      xhr.onreadystatechange = function() {
        // 首字节时间 (TTFB)
        if (xhr.readyState === 2) {
          ttfbTime = Date.now() - startTime;
        }
        
        if (xhr.readyState === 4) {
          clearTimeout(timeout);
          const endTime = Date.now();
          const latency = ttfbTime; // 网络延迟 = 首字节时间
          const responseTime = endTime - startTime; // 总响应时间
          
          if (xhr.status >= 200 && xhr.status < 400) {
            console.log(`域名 ${domain} 测试成功, 延迟: ${latency}ms, TTFB: ${ttfbTime}ms, 响应时间: ${responseTime}ms`);
            resolve({
              domain,
              latency: latency,
              ttfb: ttfbTime,
              responseTime: responseTime,
              success: true
            });
          } else {
            console.log(`域名 ${domain} XHR请求失败, 状态码: ${xhr.status}`);
            resolve({
              domain,
              latency: latency,
              ttfb: ttfbTime,
              responseTime: responseTime,
              success: false
            });
          }
        }
      };
      
      xhr.onerror = function(e) {
        clearTimeout(timeout);
        console.log(`域名 ${domain} XHR请求错误`, e);
        resolve({
          domain,
          latency: 9999,
          ttfb: 9999,
          responseTime: 9999,
          success: false
        });
      };
      
      // 添加随机参数防止缓存
      xhr.open('HEAD', `https://${domain}/?_=${Date.now()}`, true);
      xhr.send();
    } catch (e) {
      clearTimeout(timeout);
      console.log(`域名 ${domain} XHR请求异常`, e);
      resolve({
        domain,
        latency: 9999,
        ttfb: 9999,
        responseTime: 9999,
        success: false
      });
    }
  }
  
  // 使用Fetch API测试域名
  function testWithFetch(domain, startTime, timeout, resolve) {
    let ttfbTime = 0;
    
    // 定义性能观察器，用于测量TTFB
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && lastEntry.responseStart > 0) {
        ttfbTime = lastEntry.responseStart - lastEntry.requestStart;
      }
      observer.disconnect();
    });
    
    try {
      // 开始监听资源加载性能
      observer.observe({entryTypes: ['resource']});
      
      fetch(`https://${domain}/?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      }).then(response => {
        clearTimeout(timeout);
        const endTime = Date.now();
        const latency = ttfbTime || (endTime - startTime) / 2; // 如果无法获取TTFB，使用总时间的一半作为估算
        const responseTime = endTime - startTime;
        
        console.log(`域名 ${domain} 测试成功, 延迟: ${latency}ms, TTFB: ${ttfbTime}ms, 响应时间: ${responseTime}ms`);
        resolve({
          domain,
          latency: latency,
          ttfb: ttfbTime,
          responseTime: responseTime,
          success: true
        });
      }).catch(error => {
        clearTimeout(timeout);
        console.log(`域名 ${domain} Fetch请求失败`, error);
        resolve({
          domain,
          latency: 9999,
          ttfb: 9999,
          responseTime: 9999,
          success: false
        });
      });
    } catch (e) {
      clearTimeout(timeout);
      observer.disconnect();
      console.log(`域名 ${domain} Fetch请求异常`, e);
      resolve({
        domain,
        latency: 9999,
        ttfb: 9999,
        responseTime: 9999,
        success: false
      });
    }
  }
  
  // 使用iframe测试页面加载
  function testWithIframe(domain, startTime, timeout, resolve) {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      
      let loadTime = 0;
      let ttfbTime = 0;
      
      // 创建性能观察器
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.name.includes(domain)) {
            if (entry.responseStart > 0) {
              ttfbTime = entry.responseStart - entry.requestStart;
            }
            if (entry.loadEventStart > 0) {
              loadTime = entry.loadEventStart - entry.requestStart;
            }
          }
        }
        observer.disconnect();
      });
      
      // 监听资源和导航性能
      observer.observe({entryTypes: ['resource', 'navigation']});
      
      iframe.onload = function() {
        clearTimeout(timeout);
        const endTime = Date.now();
        const latency = ttfbTime || (endTime - startTime) / 3; // 估算延迟
        const responseTime = loadTime || (endTime - startTime);
        
        // 移除iframe
        document.body.removeChild(iframe);
        
        console.log(`域名 ${domain} 页面加载成功, 延迟: ${latency}ms, TTFB: ${ttfbTime}ms, 页面加载: ${responseTime}ms`);
        resolve({
          domain,
          latency: latency,
          ttfb: ttfbTime,
          responseTime: responseTime,
          success: true
        });
      };
      
      iframe.onerror = function() {
        clearTimeout(timeout);
        observer.disconnect();
        
        // 移除iframe
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        
        console.log(`域名 ${domain} 页面加载失败`);
        resolve({
          domain,
          latency: 9999,
          ttfb: 9999,
          responseTime: 9999,
          success: false
        });
      };
      
      // 添加随机参数防止缓存
      iframe.src = `https://${domain}/?_=${Date.now()}`;
      document.body.appendChild(iframe);
    } catch (e) {
      clearTimeout(timeout);
      console.log(`域名 ${domain} iframe测试异常`, e);
      resolve({
        domain,
        latency: 9999,
        ttfb: 9999,
        responseTime: 9999,
        success: false
      });
    }
  }

  // 使用WebRTC连接测试域名
  function testWithWebRTC(domain, startTime, timeout, resolve) {
    try {
      console.log(`正在使用WebRTC测试域名: ${domain}`);
      
      // 检查是否支持WebRTC
      if (!window.RTCPeerConnection) {
        console.log(`浏览器不支持WebRTC，使用替代方法测试域名: ${domain}`);
        testWithXHR(domain, startTime, timeout, resolve); // 使用备选方法
        return;
      }
      
      let completed = false;
      let iceGatheringStart = 0;
      let iceGatheringEnd = 0;
      let candidateCount = 0;
      let hasHostCandidate = false;
      let hasReflexiveCandidate = false;
      let hasRelayCandidate = false;
      
      // 创建RTC连接
      const pc = new RTCPeerConnection({
        iceServers: [{
          urls: [`stun:stun.${domain}`]
        }]
      });
      
      // 监听ICE候选收集事件
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidateCount++;
          
          // 分析候选类型
          const candidateStr = event.candidate.candidate;
          if (candidateStr.indexOf('typ host') > -1) hasHostCandidate = true;
          if (candidateStr.indexOf('typ srflx') > -1) hasReflexiveCandidate = true;
          if (candidateStr.indexOf('typ relay') > -1) hasRelayCandidate = true;
          
          console.log(`收集到${candidateCount}个ICE候选: ${candidateStr}`);
        }
      };
      
      // ICE收集状态变化
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'gathering') {
          iceGatheringStart = Date.now();
          console.log(`开始收集ICE候选: ${domain}`);
        } else if (pc.iceGatheringState === 'complete' && !completed) {
          completed = true;
          iceGatheringEnd = Date.now();
          
          // 计算收集时间
          const gatheringTime = iceGatheringEnd - iceGatheringStart;
          const totalTime = iceGatheringEnd - startTime;
          
          // 释放资源
          clearTimeout(timeout);
          pc.close();
          
          console.log(`WebRTC测试结果 - 域名: ${domain}, 候选数: ${candidateCount}, 收集时间: ${gatheringTime}ms`);
          
          // 使用ICE候选收集时间作为延迟的一个指标
          const iceQualityScore = calculateIceQualityScore(hasHostCandidate, hasReflexiveCandidate, hasRelayCandidate);
          const latency = candidateCount > 0 ? gatheringTime / candidateCount : 9999;
          
          resolve({
            domain,
            latency: latency < 10 ? 100 : latency, // 确保延迟值合理
            ttfb: gatheringTime,
            responseTime: totalTime,
            iceQualityScore: iceQualityScore,
            candidateCount: candidateCount,
            hasHostCandidate: hasHostCandidate,
            hasReflexiveCandidate: hasReflexiveCandidate,
            hasRelayCandidate: hasRelayCandidate,
            success: candidateCount > 0
          });
        }
      };
      
      // 连接错误处理
      pc.onicecandidateerror = (event) => {
        console.log(`ICE候选错误: ${domain}`, event);
      };
      
      // 创建空数据通道（触发ICE收集）
      pc.createDataChannel('testChannel');
      
      // 创建offer并设置本地描述
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(error => {
          console.log(`创建WebRTC offer失败: ${domain}`, error);
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            pc.close();
            resolve({
              domain,
              latency: 9999,
              ttfb: 9999,
              responseTime: 9999,
              success: false
            });
          }
        });
      
      // 15秒后如果仍未完成，手动结束测试
      setTimeout(() => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          pc.close();
          
          // 如果收集了一些候选但未完成，仍然返回部分结果
          if (candidateCount > 0) {
            const currentTime = Date.now();
            const gatheringTime = iceGatheringStart ? (currentTime - iceGatheringStart) : 5000;
            const totalTime = currentTime - startTime;
            
            const iceQualityScore = calculateIceQualityScore(hasHostCandidate, hasReflexiveCandidate, hasRelayCandidate);
            const latency = gatheringTime / candidateCount;
            
            console.log(`WebRTC测试部分完成 - 域名: ${domain}, 候选数: ${candidateCount}`);
            
            resolve({
              domain,
              latency: latency < 10 ? 100 : latency,
              ttfb: gatheringTime,
              responseTime: totalTime,
              iceQualityScore: iceQualityScore,
              candidateCount: candidateCount,
              hasHostCandidate: hasHostCandidate,
              hasReflexiveCandidate: hasReflexiveCandidate,
              hasRelayCandidate: hasRelayCandidate,
              success: true
            });
          } else {
            console.log(`WebRTC测试超时: ${domain}`);
            resolve({
              domain,
              latency: 9999,
              ttfb: 9999,
              responseTime: 9999,
              success: false
            });
          }
        }
      }, 15000);
    } catch (e) {
      console.log(`WebRTC测试异常: ${domain}`, e);
      clearTimeout(timeout);
      testWithXHR(domain, startTime, timeout, resolve); // 降级到普通XHR测试
    }
  }
  
  // 计算ICE候选质量得分
  function calculateIceQualityScore(hasHost, hasReflexive, hasRelay) {
    let score = 0;
    if (hasHost) score += 0.4; // 本地候选
    if (hasReflexive) score += 0.4; // 反射候选（STUN）
    if (hasRelay) score += 0.2; // 中继候选（TURN）
    return score;
  }

  // 使用精确TCP连接时间分析测试域名
  function testWithTCPTiming(domain, startTime, timeout, resolve) {
    try {
      console.log(`正在使用TCP连接时间测试域名: ${domain}`);
      
      // 使用Performance API记录关键时间点
      const timingInfo = {
        dnsStart: 0,
        dnsEnd: 0,
        tcpStart: 0,
        tcpEnd: 0,
        tlsStart: 0,
        tlsEnd: 0,
        requestStart: 0,
        responseStart: 0,
        responseEnd: 0
      };
      
      // 注册性能观察器
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.name.includes(domain)) {
            // 详细的连接时间分析
            if (entry.domainLookupStart > 0) timingInfo.dnsStart = entry.domainLookupStart;
            if (entry.domainLookupEnd > 0) timingInfo.dnsEnd = entry.domainLookupEnd;
            if (entry.connectStart > 0) timingInfo.tcpStart = entry.connectStart;
            if (entry.connectEnd > 0) timingInfo.tcpEnd = entry.connectEnd;
            if (entry.secureConnectionStart > 0) timingInfo.tlsStart = entry.secureConnectionStart;
            if (entry.requestStart > 0) timingInfo.requestStart = entry.requestStart;
            if (entry.responseStart > 0) timingInfo.responseStart = entry.responseStart;
            if (entry.responseEnd > 0) timingInfo.responseEnd = entry.responseEnd;
          }
        }
      });
      
      // 监控资源计时
      observer.observe({ entryTypes: ['resource'] });
      
      // 创建XHR请求
      const xhr = new XMLHttpRequest();
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          clearTimeout(timeout);
          observer.disconnect();
          const endTime = Date.now();
          
          // 计算各阶段时间
          const dnsTime = (timingInfo.dnsEnd - timingInfo.dnsStart) || 0;
          const tcpTime = (timingInfo.tcpEnd - timingInfo.tcpStart) || 0;
          const tlsTime = (timingInfo.tlsStart > 0) ? (timingInfo.tcpEnd - timingInfo.tlsStart) : 0;
          const ttfbTime = (timingInfo.responseStart - timingInfo.requestStart) || 0;
          const responseTime = (timingInfo.responseEnd - timingInfo.responseStart) || 0;
          const totalTime = endTime - startTime;
          
          // 计算连接质量得分（满分1.0）
          // DNS解析时间、TCP连接时间、TLS握手时间、首字节时间的权重配比
          const weights = { dns: 0.2, tcp: 0.3, tls: 0.2, ttfb: 0.3 };
          
          // 将各时间映射到0-1区间（值越小越好）
          const dnsScore = dnsTime < 50 ? 1 : dnsTime < 200 ? 0.7 : dnsTime < 500 ? 0.4 : 0.1;
          const tcpScore = tcpTime < 50 ? 1 : tcpTime < 150 ? 0.7 : tcpTime < 300 ? 0.4 : 0.1;
          const tlsScore = tlsTime < 100 ? 1 : tlsTime < 300 ? 0.7 : tlsTime < 600 ? 0.4 : 0.1;
          const ttfbScore = ttfbTime < 100 ? 1 : ttfbTime < 300 ? 0.7 : ttfbTime < 800 ? 0.4 : 0.1;
          
          // 连接质量综合得分
          const connectionQuality = 
            (dnsScore * weights.dns) + 
            (tcpScore * weights.tcp) + 
            (tlsScore * weights.tls) + 
            (ttfbScore * weights.ttfb);
          
          console.log(`TCP连接时间分析 - 域名: ${domain}, DNS: ${dnsTime}ms, TCP: ${tcpTime}ms, TLS: ${tlsTime}ms, TTFB: ${ttfbTime}ms, 质量得分: ${connectionQuality.toFixed(2)}`);
          
          if (xhr.status >= 200 && xhr.status < 400) {
            resolve({
              domain,
              latency: tcpTime || ttfbTime / 2, // 优先使用TCP连接时间作为延迟指标
              ttfb: ttfbTime,
              responseTime: totalTime,
              dnsTime: dnsTime,
              tcpTime: tcpTime,
              tlsTime: tlsTime,
              connectionQuality: connectionQuality,
              success: true
            });
          } else {
            console.log(`域名 ${domain} TCP连接测试失败, 状态码: ${xhr.status}`);
            resolve({
              domain,
              latency: tcpTime || 9999,
              ttfb: ttfbTime || 9999,
              responseTime: totalTime,
              dnsTime: dnsTime,
              tcpTime: tcpTime,
              tlsTime: tlsTime,
              connectionQuality: 0,
              success: false
            });
          }
        }
      };
      
      xhr.onerror = function(e) {
        clearTimeout(timeout);
        observer.disconnect();
        console.log(`域名 ${domain} TCP连接测试错误`, e);
        resolve({
          domain,
          latency: 9999,
          ttfb: 9999,
          responseTime: 9999,
          dnsTime: 0,
          tcpTime: 0,
          tlsTime: 0,
          connectionQuality: 0,
          success: false
        });
      };
      
      // 开始计时并发送请求
      xhr.open('HEAD', `https://${domain}/?_=${Date.now()}`, true);
      xhr.send();
    } catch (e) {
      clearTimeout(timeout);
      console.log(`域名 ${domain} TCP连接测试异常`, e);
      resolve({
        domain,
        latency: 9999,
        ttfb: 9999,
        responseTime: 9999,
        success: false
      });
    }
  }

  // 使用并发连接测试域名
  function testWithConcurrentConnections(domain, startTime, timeout, resolve) {
    try {
      console.log(`正在使用并发连接测试域名: ${domain}`);
      
      // 并发连接数
      const concurrentCount = 3;
      // 资源路径（用于测试不同资源）
      const paths = ['/', '/favicon.ico', '/robots.txt'];
      // 存储请求结果
      const results = [];
      let completed = 0;
      
      // 创建单个连接测试
      function createConnectionTest(path, index) {
        const testStartTime = Date.now();
        const xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            const endTime = Date.now();
            const duration = endTime - testStartTime;
            
            results.push({
              index: index,
              path: path,
              status: xhr.status,
              duration: duration,
              success: xhr.status >= 200 && xhr.status < 400
            });
            
            completed++;
            
            // 所有并发测试完成后处理结果
            if (completed === concurrentCount) {
              processResults();
            }
          }
        };
        
        xhr.onerror = function() {
          results.push({
            index: index,
            path: path,
            status: 0,
            duration: Date.now() - testStartTime,
            success: false
          });
          
          completed++;
          
          if (completed === concurrentCount) {
            processResults();
          }
        };
        
        // 添加随机参数防止缓存
        xhr.open('HEAD', `https://${domain}${path}?_=${Date.now()}-${index}`, true);
        xhr.timeout = 10000; // 10秒超时
        xhr.send();
      }
      
      // 处理所有请求结果
      function processResults() {
        clearTimeout(timeout);
        
        // 计算成功请求的平均响应时间
        const successResults = results.filter(r => r.success);
        let avgDuration = 9999;
        let successRate = 0;
        let concurrencyPenalty = 0;
        
        if (successResults.length > 0) {
          // 计算平均响应时间
          avgDuration = successResults.reduce((sum, r) => sum + r.duration, 0) / successResults.length;
          // 计算成功率
          successRate = successResults.length / concurrentCount;
          
          // 计算并发惩罚系数（首个请求与最后完成请求之间的时间差）
          if (successResults.length > 1) {
            const sortedByDuration = [...successResults].sort((a, b) => a.duration - b.duration);
            concurrencyPenalty = sortedByDuration[sortedByDuration.length - 1].duration - sortedByDuration[0].duration;
          }
        }
        
        // 计算并发处理能力分数 (0-1)
        const concurrencyScore = calculateConcurrencyScore(successRate, avgDuration, concurrencyPenalty);
        
        console.log(`并发连接测试结果 - 域名: ${domain}, 成功率: ${(successRate * 100).toFixed(1)}%, 平均响应时间: ${avgDuration.toFixed(0)}ms, 并发分数: ${concurrencyScore.toFixed(2)}`);
        
        resolve({
          domain,
          latency: avgDuration,
          ttfb: avgDuration / 2, // 估算TTFB
          responseTime: Date.now() - startTime,
          concurrentResults: results,
          successRate: successRate,
          concurrencyPenalty: concurrencyPenalty,
          concurrencyScore: concurrencyScore,
          success: successRate > 0
        });
      }
      
      // 启动所有并发请求
      for (let i = 0; i < concurrentCount; i++) {
        createConnectionTest(paths[i % paths.length], i);
      }
      
    } catch (e) {
      clearTimeout(timeout);
      console.log(`域名 ${domain} 并发连接测试异常`, e);
      resolve({
        domain,
        latency: 9999,
        ttfb: 9999,
        responseTime: 9999,
        successRate: 0,
        concurrencyScore: 0,
        success: false
      });
    }
  }
  
  // 计算并发处理能力分数
  function calculateConcurrencyScore(successRate, avgDuration, concurrencyPenalty) {
    // 成功率权重
    const successWeight = 0.5;
    // 平均响应时间权重
    const durationWeight = 0.3;
    // 并发延迟惩罚权重
    const penaltyWeight = 0.2;
    
    // 成功率得分
    const successScore = successRate;
    
    // 响应时间得分（响应时间越低得分越高）
    const durationScore = avgDuration < 200 ? 1 : 
                         avgDuration < 500 ? 0.8 : 
                         avgDuration < 1000 ? 0.6 : 
                         avgDuration < 2000 ? 0.4 : 
                         avgDuration < 5000 ? 0.2 : 0.1;
    
    // 并发惩罚得分（惩罚越低得分越高）
    const penaltyScore = concurrencyPenalty < 100 ? 1 : 
                        concurrencyPenalty < 300 ? 0.8 : 
                        concurrencyPenalty < 800 ? 0.6 : 
                        concurrencyPenalty < 2000 ? 0.4 : 
                        concurrencyPenalty < 5000 ? 0.2 : 0.1;
    
    // 综合得分
    return (successScore * successWeight) + 
           (durationScore * durationWeight) + 
           (penaltyScore * penaltyWeight);
  }

  // 综合测试方法 - 结合多种测试并给出最佳结果
  function testComprehensive(domain, startTime, timeout, resolve) {
    try {
      console.log(`正在对域名 ${domain} 进行综合测试`);
      
      // 设置子测试超时
      const subTestTimeout = Math.min(config.timeout * 0.8, 8000);
      
      // 选择最适合的三种测试方法
      const methods = [
        { name: 'xhr', weight: 0.3, fn: testWithXHR },
        { name: 'tcp-timing', weight: 0.4, fn: testWithTCPTiming },
        { name: 'concurrent', weight: 0.3, fn: testWithConcurrentConnections }
      ];
      
      const results = [];
      let completedTests = 0;
      
      // 为每个测试创建自己的超时
      methods.forEach(method => {
        const methodStartTime = Date.now();
        const methodTimeout = setTimeout(() => {
          console.log(`子测试 ${method.name} 超时`);
          results.push({
            method: method.name,
            result: {
              domain,
              latency: 9999,
              ttfb: 9999,
              responseTime: 9999,
              success: false
            }
          });
          
          completedTests++;
          if (completedTests === methods.length) {
            processComprehensiveResults();
          }
        }, subTestTimeout);
        
        // 执行子测试
        method.fn(domain, methodStartTime, methodTimeout, (result) => {
          results.push({
            method: method.name,
            result: result,
            weight: method.weight
          });
          
          completedTests++;
          if (completedTests === methods.length) {
            processComprehensiveResults();
          }
        });
      });
      
      // 处理所有子测试结果
      function processComprehensiveResults() {
        clearTimeout(timeout);
        
        // 至少有一个测试成功
        const successResults = results.filter(r => r.result.success);
        
        if (successResults.length === 0) {
          console.log(`域名 ${domain} 所有测试方法都失败`);
          resolve({
            domain,
            latency: 9999,
            ttfb: 9999,
            responseTime: 9999,
            success: false,
            comprehensiveScore: 0,
            subResults: results
          });
          return;
        }
        
        // 计算加权平均延迟
        let weightSum = 0;
        let weightedLatency = 0;
        let weightedTTFB = 0;
        let weightedResponseTime = 0;
        
        successResults.forEach(r => {
          weightSum += r.weight;
          weightedLatency += r.result.latency * r.weight;
          weightedTTFB += r.result.ttfb * r.weight;
          weightedResponseTime += r.result.responseTime * r.weight;
        });
        
        if (weightSum > 0) {
          weightedLatency /= weightSum;
          weightedTTFB /= weightSum;
          weightedResponseTime /= weightSum;
        }
        
        // 计算综合得分 (0-1)
        let comprehensiveScore = 0;
        
        // 对每个成功的测试结果累加得分
        successResults.forEach(r => {
          let methodScore = 0;
          
          // 根据测试方法提取特定分数
          if (r.method === 'tcp-timing' && r.result.connectionQuality) {
            methodScore = r.result.connectionQuality;
          } else if (r.method === 'concurrent' && r.result.concurrencyScore) {
            methodScore = r.result.concurrencyScore;
          } else if (r.method === 'webrtc' && r.result.iceQualityScore) {
            methodScore = r.result.iceQualityScore;
          } else {
            // 基础得分计算
            const latencyScore = r.result.latency < 100 ? 1 : 
                                r.result.latency < 300 ? 0.8 : 
                                r.result.latency < 800 ? 0.6 : 
                                r.result.latency < 1500 ? 0.4 : 
                                r.result.latency < 3000 ? 0.2 : 0.1;
            
            methodScore = latencyScore;
          }
          
          // 累加加权得分
          comprehensiveScore += methodScore * (r.weight / weightSum);
        });
        
        console.log(`域名 ${domain} 综合测试完成：延迟=${weightedLatency.toFixed(0)}ms, TTFB=${weightedTTFB.toFixed(0)}ms, 得分=${comprehensiveScore.toFixed(2)}`);
        
        resolve({
          domain,
          latency: Math.round(weightedLatency),
          ttfb: Math.round(weightedTTFB),
          responseTime: Math.round(weightedResponseTime),
          success: true,
          comprehensiveScore: comprehensiveScore,
          subResults: results,
          testMethods: successResults.map(r => r.method)
        });
      }
      
    } catch (e) {
      clearTimeout(timeout);
      console.log(`域名 ${domain} 综合测试异常`, e);
      resolve({
        domain,
        latency: 9999,
        ttfb: 9999,
        responseTime: 9999,
        success: false
      });
    }
  }

  // 执行重定向
  function redirect(domain) {
    var protocol = window.location.protocol;
    var pathname = window.location.pathname;
    var search = window.location.search;
    var hash = window.location.hash;
    
    var newUrl = protocol + '//' + domain + pathname + search + hash;
    console.log('重定向到: ', newUrl);
    window.location.href = newUrl;
  }

  // 设置Cookie
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
  }

  // 获取Cookie
  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // 暴露公共API
  window.AutomaticRouting = {
    init: init,
    testDomain: testDomain,  // 暴露测试方法供外部使用
    config: config           // 暴露配置供外部访问
  };
  
  // 如果配置为自动运行，则在页面加载完成后自动初始化
  if (config.autoRun) {
    if (document.readyState === 'complete') {
      init();
    } else {
      window.addEventListener('load', init);
    }
  }
})(); 
/**
 * Automatic-Routing 智能域名路由系统
 * 自动重定向脚本 - 增强版
 */

(function() {
  // 默认配置
  var config = {
    domains: [],  // 域名列表将从环境中加载
    apiUrl: window.location.protocol + '//' + window.location.host,  // 使用当前域名作为API地址
    priorityFactor: 'combined',  // 优先因素：latency（延迟）, dns（DNS解析时间）, combined（综合评分）, pageLoad（页面加载）
    considerGeoLocation: true,  // 是否考虑地理位置
    cookieExpiration: 7,  // Cookie有效期（天）
    forceRedirect: false,  // 是否强制重定向（即使已有Cookie）
    autoRun: true,  // 是否自动运行（无需手动初始化）
    testMethod: 'xhr',  // 测试方法：'image', 'xhr', 'fetch', 'page'
    sampleSize: 1,  // 测试样本数量（每个域名测试次数）
    timeout: 5000,  // 超时时间（毫秒）
    metrics: {      // 测量指标权重
      latency: 0.4,        // 网络延迟权重
      ttfb: 0.3,           // 首字节时间权重
      responseTime: 0.2,   // 响应时间权重
      stability: 0.1       // 连接稳定性权重
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
    
    // 收集各域名性能数据
    Promise.all(config.domains.map(domain => {
      return runDomainTests(domain);
    })).then(results => {
      console.log('域名测试结果: ', results);
      
      // 根据配置的优先因素和权重计算综合得分
      const scoredResults = results.map(result => {
        // 计算综合得分
        let score = 0;
        
        // 网络延迟得分 (越低越好)
        const latencyScore = result.metrics.latency ? 1 - (result.metrics.latency / 5000) : 0;
        score += latencyScore * config.metrics.latency;
        
        // 首字节时间得分 (越低越好)
        const ttfbScore = result.metrics.ttfb ? 1 - (result.metrics.ttfb / 2000) : 0;
        score += ttfbScore * config.metrics.ttfb;
        
        // 响应时间得分 (越低越好)
        const responseScore = result.metrics.responseTime ? 1 - (result.metrics.responseTime / 3000) : 0;
        score += responseScore * config.metrics.responseTime;
        
        // 连接稳定性得分 (越高越好)
        const stabilityScore = result.metrics.successRate || 0;
        score += stabilityScore * config.metrics.stability;
        
        // 限制得分在0-1之间
        score = Math.max(0, Math.min(1, score));
        
        return {
          ...result,
          score: score
        };
      });
      
      // 按照得分排序
      const sortedResults = scoredResults.sort((a, b) => b.score - a.score);
      
      // 选择最佳域名
      const bestDomain = sortedResults[0]?.domain;
      console.log('最佳域名: ', bestDomain, '得分:', sortedResults[0]?.score);
      callback(bestDomain);
    }).catch(error => {
      console.error('Automatic-Routing: 测试域名失败', error);
      callback(null);
    });
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
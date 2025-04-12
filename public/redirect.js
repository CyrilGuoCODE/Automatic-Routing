/**
 * Automatic-Routing 智能域名路由系统
 * 自动重定向脚本 - 简化版
 */

(function() {
  // 默认配置
  var config = {
    domains: [],  // 域名列表将从环境中加载
    apiUrl: window.location.protocol + '//' + window.location.host,  // 使用当前域名作为API地址
    priorityFactor: 'combined',  // 优先因素：latency（延迟）, dns（DNS解析时间）, combined（综合评分）
    considerGeoLocation: true,  // 是否考虑地理位置
    cookieExpiration: 7,  // Cookie有效期（天）
    forceRedirect: false,  // 是否强制重定向（即使已有Cookie）
    autoRun: true,  // 是否自动运行（无需手动初始化）
    testMethod: 'xhr'  // 测试方法：'image' 或 'xhr'
  };

  // 初始化
  function init(options) {
    // 合并配置
    if (options) {
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          config[key] = options[key];
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
      return testDomain(domain);
    })).then(results => {
      console.log('域名测试结果: ', results);
      
      // 根据配置的优先因素进行排序
      let sortedResults;
      switch (config.priorityFactor) {
        case 'latency':
          sortedResults = results.sort((a, b) => a.latency - b.latency);
          break;
        case 'dns':
          sortedResults = results.sort((a, b) => a.dnsTime - b.dnsTime);
          break;
        case 'combined':
        default:
          sortedResults = results.sort((a, b) => (a.latency + a.dnsTime) - (b.latency + b.dnsTime));
          break;
      }
      
      // 选择最佳域名
      const bestDomain = sortedResults[0]?.domain;
      console.log('最佳域名: ', bestDomain);
      callback(bestDomain);
    }).catch(error => {
      console.error('Automatic-Routing: 测试域名失败', error);
      callback(null);
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
          dnsTime: 0,
          success: false
        });
      }, 5000);
      
      // 选择测试方法
      if (config.testMethod === 'image') {
        testWithImage(domain, startTime, timeout, resolve);
      } else {
        testWithXHR(domain, startTime, timeout, resolve);
      }
    });
  }
  
  // 使用图片加载测试域名
  function testWithImage(domain, startTime, timeout, resolve) {
    const img = new Image();
    
    img.onload = function() {
      clearTimeout(timeout);
      const endTime = Date.now();
      console.log(`域名 ${domain} 测试成功, 延迟: ${endTime - startTime}ms`);
      resolve({
        domain,
        latency: endTime - startTime,
        dnsTime: 0,
        success: true
      });
    };
    
    img.onerror = function(e) {
      clearTimeout(timeout);
      console.log(`域名 ${domain} 图片加载失败`, e);
      resolve({
        domain,
        latency: 9999,
        dnsTime: 0,
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
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          clearTimeout(timeout);
          const endTime = Date.now();
          
          if (xhr.status >= 200 && xhr.status < 400) {
            console.log(`域名 ${domain} 测试成功, 延迟: ${endTime - startTime}ms`);
            resolve({
              domain,
              latency: endTime - startTime,
              dnsTime: 0,
              success: true
            });
          } else {
            console.log(`域名 ${domain} XHR请求失败, 状态码: ${xhr.status}`);
            resolve({
              domain,
              latency: endTime - startTime, // 仍然记录时间，因为连接已经建立
              dnsTime: 0,
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
          dnsTime: 0,
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
        dnsTime: 0,
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
    init: init
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
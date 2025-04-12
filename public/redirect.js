/**
 * Automatic-Routing 智能域名路由系统
 * 自动重定向脚本
 */

(function() {
  // 配置信息
  var config = {
    domains: [],  // 域名列表
    apiUrl: 'https://automatic-routing-api.example.com',  // API地址，实际使用时需替换为真实地址
    priorityFactor: 'combined',  // 优先因素：latency（延迟）, dns（DNS解析时间）, combined（综合评分）
    considerGeoLocation: true,  // 是否考虑地理位置
    cookieExpiration: 7,  // Cookie有效期（天）
    forceRedirect: false  // 是否强制重定向（即使已有Cookie）
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
    if (!config.domains || config.domains.length === 0) {
      console.error('Automatic-Routing: 未配置域名列表');
      return;
    }

    // 简单测量当前域名的延迟
    var currentDomain = window.location.hostname;
    var startTime = Date.now();
    
    // 发送API请求获取最佳域名
    var xhr = new XMLHttpRequest();
    xhr.open('POST', config.apiUrl + '/api/best-domain', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var response = JSON.parse(xhr.responseText);
            if (response.success && response.data && response.data.bestDomain) {
              callback(response.data.bestDomain);
            } else {
              console.error('Automatic-Routing: API响应错误', response);
              callback(null);
            }
          } catch (e) {
            console.error('Automatic-Routing: 解析API响应失败', e);
            callback(null);
          }
        } else {
          console.error('Automatic-Routing: API请求失败', xhr.status);
          callback(null);
        }
      }
    };
    
    // 发送请求数据
    var data = {
      domains: config.domains,
      priorityFactor: config.priorityFactor,
      considerGeoLocation: config.considerGeoLocation
    };
    xhr.send(JSON.stringify(data));
  }

  // 执行重定向
  function redirect(domain) {
    var protocol = window.location.protocol;
    var pathname = window.location.pathname;
    var search = window.location.search;
    var hash = window.location.hash;
    
    var newUrl = protocol + '//' + domain + pathname + search + hash;
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
})(); 
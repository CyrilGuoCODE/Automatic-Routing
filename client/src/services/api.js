import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const getLocation = async () => {
  try {
    const response = await api.get('/location');
    return response.data;
  } catch (error) {
    console.error('获取地理位置失败', error);
    throw error;
  }
};

export const testLatency = async (domains) => {
  try {
    const response = await api.post('/test-latency', { domains });
    return response.data;
  } catch (error) {
    console.error('测试延迟失败', error);
    throw error;
  }
};

export const testDNS = async (domains) => {
  try {
    const response = await api.post('/test-dns', { domains });
    return response.data;
  } catch (error) {
    console.error('测试DNS解析时间失败', error);
    throw error;
  }
};

export const getBestDomain = async (domains, priorityFactor = 'combined', considerGeoLocation = true) => {
  try {
    const response = await api.post('/best-domain', {
      domains,
      priorityFactor,
      considerGeoLocation
    });
    return response.data;
  } catch (error) {
    console.error('获取最佳域名失败', error);
    throw error;
  }
};

export default {
  getLocation,
  testLatency,
  testDNS,
  getBestDomain
}; 
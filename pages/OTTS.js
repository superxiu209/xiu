import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../components/pgpdtop.css';
import '../pages/otts.css'

function AutoUserIdStorage() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  // 新增状态
  const [datasetUrl, setDatasetUrl] = useState(''); // 输入框内容
  const [downloadMessage, setDownloadMessage] = useState(''); // 下载结果反馈
  const [downloading, setDownloading] = useState(false); // 避免重复点击

  useEffect(() => {
    // 页面加载自动查询并存储userId
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/current_user/', { withCredentials: true });
        setUserInfo(response.data);
        if (response.data && response.data.id !== undefined && response.data.id !== null) {
          localStorage.setItem('userId', response.data.id);
        }
        setError(null);
      } catch (err) {
        setUserInfo(null);
        setError('查询用户信息失败');
        localStorage.removeItem('userId');
      }
    };
    fetchUserInfo();
  }, []);

  // 新增：下载按钮点击事件
  const handleDownload = async () => {
    if (!datasetUrl.trim()) {
      setDownloadMessage('请输入有效的数据集GitHub网址！');
      return;
    }
    setDownloading(true);
    setDownloadMessage('正在请求下载数据集...');
    try {
      const resp = await axios.post(
        'http://127.0.0.1:8000/download_dataset/',
        { url: datasetUrl },
        { withCredentials: true }
      );
      if (resp.data && resp.data.success) {
        // 根据existed字段判断
        if (resp.data.existed) {
          setDownloadMessage(
            `数据集已存在，无需重复添加。文件名：${resp.data.filename || '未知'}\n${resp.data.message || ''}`
          );
        } else {
          setDownloadMessage(
            `下载成功！文件名：${resp.data.filename || '未知'}\n${resp.data.message || ''}`
          );
        }
      } else {
        setDownloadMessage('下载失败：' + (resp.data.error || '未知错误'));
      }
    } catch (e) {
      setDownloadMessage('下载请求失败：' + (e.message || '未知错误'));
    }
    setDownloading(false);
  };

  return (
    <div className="pages-content">
      <div className="ot0">
      <h1>自动获取并查看用户ID</h1>
      {userInfo ? (
        <div className="ot1">
          <p>用户ID: {userInfo.id}</p>
          <p>用户名: {userInfo.username}</p>
        </div>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>正在加载用户信息...</p>
      )}

      <hr />

      <div className="ot2">
        <label>
          数据集GitHub网址：
          <input
            type="text"
            style={{ width: '80%' }}
            value={datasetUrl}
            placeholder="请输入GitHub数据集的URL"
            onChange={e => setDatasetUrl(e.target.value)}
            disabled={downloading}
          />
        </label>
        <button
          style={{ marginLeft: 12 }}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? '处理中...' : '下载'}
        </button>
      </div>
      {downloadMessage && (
        <p style={{ whiteSpace: 'pre-line' }}>{downloadMessage}</p>
      )}
        </div>
    </div>
  );
}

export default AutoUserIdStorage;
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import '../components/pgpdtop.css';
import '../pages/His.css';

const getCurrentUserId = async () => {
  try {
    const userRes = await axios.get("http://127.0.0.1:8000/current_user/", { withCredentials: true });
    return userRes.data.id;
  } catch (error) {
    console.error("获取用户信息失败", error);
    return null;
  }
};

function HistoricalEvaluation() {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const itemsPerPage = 15;
  const maxPaginationButtons = 10;

  // 模态框相关状态（带后缀his）
  const [showModalHis, setShowModalHis] = useState(false);
  const [detailItemHis, setDetailItemHis] = useState(null);

  // 新增：错题模态框状态
  const [showModalHis2, setShowModalHis2] = useState(false);
  const [wrongsHis2, setWrongsHis2] = useState([]);

  // 用 useCallback 包裹 fetchData
  const fetchData = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      setData([]);
      return;
    }
    let params = {};
    if (userId !== 1) {
      params.value3 = userId;
    }

    axios
      .get('http://127.0.0.1:8000/privatelists/', { params: params })
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 排序数据
  const sortedData = [...data].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.direction === 'ascending') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else if (sortConfig.direction === 'descending') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    }
    return 0;
  });

  // 动态生成当前页数据和序号
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      row_num:
        sortConfig.key === 'score' && sortConfig.direction === 'descending'
          ? startIndex + index + 1
          : sortConfig.direction === 'ascending'
          ? startIndex + index + 1
          : sortedData.length - (startIndex + index),
    }));
  };

  // 计算总页数
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // 切换到指定页码
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 动态生成分页按钮
  const renderPaginationButtons = () => {
    const buttons = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxPaginationButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPaginationButtons - 1);

    if (endPage - startPage + 1 < maxPaginationButtons) {
      startPage = Math.max(1, endPage - maxPaginationButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={currentPage === i ? 'active' : ''}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  // 切换排序
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // 生成 CSV 下载
  const generateCSV = (headers, rows) => {
    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '历史在线评测记录.csv');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 下载全局数据
  const handleDownloadAll = () => {
    const headers = ['序号', 'ID', '模型名称', '数据集', '评测指标', '评测分数', '时间戳'];
    const rows = sortedData.map((item, index) => [
      index + 1,
      item.id,
      item.model_name,
      item.data_set || 'N/A',
      item.Metric || 'N/A',
      item.score,
      item.timestamp,
    ]);
    generateCSV(headers, rows);
  };

  // 下载单行数据
  const handleDownloadRow = (item) => {
    const headers = ['序号', 'ID', '模型名称', '数据集', '评测指标', '评测分数', '时间戳'];
    const rows = [[
      item.row_num,
      item.id,
      item.model_name,
      item.data_set || 'N/A',
      item.Metric || 'N/A',
      item.score,
      item.timestamp,
    ]];
    generateCSV(headers, rows);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      axios
        .delete(`http://127.0.0.1:8000/privatelists/${id}/`)
        .then(() => {
          alert('删除成功！');
          fetchData();
        })
        .catch((error) => {
          alert('删除失败，请稍后再试！');
          console.error('删除失败:', error);
        });
    }
  };

  // 查看详情按钮
  const handleShowDetailHis = (item) => {
    setDetailItemHis(item);
    setShowModalHis(true);
  };

  // 关闭模态框
  const handleCloseModalHis = () => {
    setShowModalHis(false);
    setDetailItemHis(null);
  };

  // 查看错题按钮
  const handleShowWrongsHis2 = (item) => {
    let wrongsArr = [];
    try {
      if (typeof item.wrongs === 'string') {
        wrongsArr = JSON.parse(item.wrongs);
      } else if (Array.isArray(item.wrongs)) {
        wrongsArr = item.wrongs;
      }
    } catch (e) {
      wrongsArr = [];
    }
    setWrongsHis2(wrongsArr);
    setShowModalHis2(true);
  };

  // 关闭错题模态框
  const handleCloseModalHis2 = () => {
    setShowModalHis2(false);
    setWrongsHis2([]);
  };

  return (
    <div className="pages-content">
      <div className="privatelists-1 history-table">
        <h1>历史在线评测记录</h1>
        <button onClick={handleDownloadAll} className="download-btn">下载全部 CSV</button>
        <table border="1">
          <thead>
          <tr>
            <th>
              序号{' '}
              <button onClick={() => handleSort('id')}>
                {sortConfig.key === 'id' && sortConfig.direction === 'ascending' ? '↑' : '↓'}
              </button>
            </th>
            <th style={{display: 'none'}}>
              ID{' '}
              <button onClick={() => handleSort('id')}>
                {sortConfig.key === 'id' && sortConfig.direction === 'ascending' ? '↑' : '↓'}
              </button>
            </th>
            <th>模型名称</th>
            <th>数据集</th>
            <th>评测指标</th>
            <th>
              评测分数{' '}
              <button onClick={() => handleSort('score')}>
                {sortConfig.key === 'score' && sortConfig.direction === 'ascending' ? '↑' : '↓'}
              </button>
            </th>
            <th>评测时间</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
            {getCurrentPageData().map((item) => (
                <tr key={item.id}>
                  <td>{item.row_num}</td>
                  <td style={{display: 'none'}}>{item.id}</td>
                  <td>{item.model_name}</td>
                  <td>{item.data_set}</td>
                  <td>{item.Metric || 'N/A'}</td>
                  <td>{item.score}</td>
                  <td>{item.timestamp}</td>
                  <td>
                    <button onClick={() => handleShowDetailHis(item)}>查看详情</button>
                    <button onClick={() => handleDownloadRow(item)}>下载</button>
                    <button onClick={() => handleDelete(item.id)}>删除</button>
                    <button onClick={() => handleShowWrongsHis2(item)}>查看错题</button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>

        {/* 分页栏 */}
        <div className="pagination">
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
            返回首页
          </button>
          {renderPaginationButtons()}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            下一页
          </button>
        </div>
      </div>

      {/* 详情模态框（带后缀his） */}
      {showModalHis && detailItemHis && (
        <div className="modal-backdrop-his">
          <div className="modal-content-his">
            <h3>详情</h3>
            <table>
              <tbody>
              <tr>
                <td>耗时 (total_time):</td>
                <td>
                  {detailItemHis.total_time ?? 'N/A'}秒
                  {detailItemHis.total_time
                      ? `（约${Math.round(detailItemHis.total_time / 60)}分钟）`
                      : ''}
                </td>
              </tr>
              <tr>
                <td>总题数 (total):</td>
                <td>{detailItemHis.total ?? 'N/A'}题</td>
              </tr>
              <tr>
                <td>正确数 (correct):</td>
                <td>{detailItemHis.correct ?? 'N/A'}个</td>
              </tr>
              <tr>
                <td>错误数 (wrong):</td>
                <td>{detailItemHis.wrong ?? 'N/A'}个</td>
              </tr>
              </tbody>
            </table>
            <button onClick={handleCloseModalHis}>关闭</button>
          </div>
        </div>
      )}

      {/* 错题模态框（his2） */}
      {showModalHis2 && (

          <div className="modal-backdrop-his2">
            <div className="modal-content-his2">
              <h3 className="center-cell-2">错题详情</h3>
              <div className="wrongs-table-container">
                {wrongsHis2.length === 0 && <div className="wrongs-empty">暂无错题数据</div>}
                {wrongsHis2.length > 0 && (
                    <table className="wrongs-table">
                      <thead>
                      <tr>
                        <th className="center-cell-2">序号</th>
                        <th className="center-cell-2">题目信息</th>
                        <th className="center-cell-2">模型回答</th>
                        <th className="center-cell-2">参考/正确答案</th>
                      </tr>
                      </thead>
                      <tbody>
                      {wrongsHis2.map((w, idx) => (
                          <tr key={idx}>
                            <td className="center-cell-2">{w.id !== undefined ? w.id : idx + 1}</td>
                            <td>
                              <span className="field-label">前提:</span> {w.context || "无"}<br/>
                              <span className="field-label">问题:</span> {w.question || w.prompt || "无"}<br/>
                              <span className="field-label">选项:</span> {
                              w.options
                                  ? Object.entries(w.options).map(([k, v]) => `${k}. ${v}`).join('  ')
                                  : "无"
                            }
                            </td>
                            <td className="center-cell-22">{w.model_answer}</td>
                            <td className="center-cell-2">{w.reference_answer || w.correct_option || "无"}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                )}
              </div>
              <button className="modal-close-btn" onClick={handleCloseModalHis2}>关闭</button>
            </div>
          </div>
      )}
    </div>
  );
}

export default HistoricalEvaluation;
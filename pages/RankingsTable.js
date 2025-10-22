import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../components/pgpdtop.css';
import '../pages/RankingsTable.css';
import { Link } from 'react-router-dom';

function RankingsTable() {
  // 官方大模型排行榜单（receives表）
  const [modelData, setModelData] = useState([]);
  const [modelCurrentPage, setModelCurrentPage] = useState(1);

  // 官方数据集排行榜单（privatelists表）
  const [datasetUsageData, setDatasetUsageData] = useState([]);
  const [datasetCurrentPage, setDatasetCurrentPage] = useState(1);

  const itemsPerPage = 15;
  const maxPaginationButtons = 10;

  // 获取receives表数据（大模型榜单）
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/receives/')
      .then((response) => {
        setModelData(response.data);
      })
      .catch((error) => {
        console.error('Error fetching receives:', error);
      });
  }, []);

  // 获取privatelists表的统计数据（数据集榜单）
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/privatelists/')
      .then((response) => {
        // 假设后端返回的数据结构为 { data: [...], dataset_usage: [...] }
        setDatasetUsageData(response.data.dataset_usage || []);
      })
      .catch((error) => {
        console.error('Error fetching privatelists:', error);
      });
  }, []);

  // 排序（模型榜单按average_score降序）
  const sortedModelData = [...modelData].sort((a, b) => b.average_score - a.average_score);

  // 排序（数据集榜单按使用次数降序）
  const sortedDatasetUsageData = [...datasetUsageData].sort((a, b) => b.count - a.count);

  // 获取榜单分页数据
  const getCurrentPageData = (sortedData, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      row_num: startIndex + index + 1,
    }));
  };

  // 分页按钮渲染
  const renderPaginationButtons = (currentPage, totalPages, handlePageChange) => {
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

  // 总页数
  const modelTotalPages = Math.ceil(sortedModelData.length / itemsPerPage);
  const datasetTotalPages = Math.ceil(sortedDatasetUsageData.length / itemsPerPage);

  return (
    <div className="pages-content">
      {/* 官方大模型排行榜单 */}
      <div className="privatelists-1 rankings-table">
        <h1>大模型排行榜单</h1>
        <table border="1">
          <thead>
            <tr>
              <th>序号</th>
              <th>模型名称</th>
              <th>综合评分</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageData(sortedModelData, modelCurrentPage).map((item) => (
              <tr key={item.id}>
                <td>{item.row_num}</td>
                <td>{item.value1}</td>
                <td>
                  <Link className="score-link" to={`/file-scores/${item.id}`}>{item.average_score}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 分页栏 */}
        <div className="pagination">
          <button onClick={() => setModelCurrentPage(modelCurrentPage - 1)} disabled={modelCurrentPage === 1}>上一页</button>
          {renderPaginationButtons(modelCurrentPage, modelTotalPages, setModelCurrentPage)}
          <button onClick={() => setModelCurrentPage(modelCurrentPage + 1)} disabled={modelCurrentPage === modelTotalPages}>下一页</button>
        </div>
      </div>

      {/* 官方数据集排行榜单 */}
      <div className="privatelists-2 rankings-table-2">
        <h1>数据集排行榜单</h1>
        <table border="1">
          <thead>
            <tr>
              <th>序号</th>
              <th>数据集名称</th>
              <th>使用次数</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageData(sortedDatasetUsageData, datasetCurrentPage).map((item) => (
              <tr key={item.data_set}>
                <td>{item.row_num}</td>
                <td>{item.data_set}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 分页栏 */}
        <div className="pagination">
          <button onClick={() => setDatasetCurrentPage(datasetCurrentPage - 1)} disabled={datasetCurrentPage === 1}>上一页</button>
          {renderPaginationButtons(datasetCurrentPage, datasetTotalPages, setDatasetCurrentPage)}
          <button onClick={() => setDatasetCurrentPage(datasetCurrentPage + 1)} disabled={datasetCurrentPage === datasetTotalPages}>下一页</button>
        </div>
      </div>
    </div>
  );
}

export default RankingsTable;

import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import * as echarts from 'echarts';
import '../pages/filescore.css'
import '../components/pgpdtop.css';

function FileScores() {
  const { receiveId } = useParams();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const barChartRef = useRef(null);
  const radarChartRef = useRef(null);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/receives/${receiveId}/file-scores/`)
      .then((response) => {
        setScores(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching file scores:', error);
        setLoading(false);
      });
  }, [receiveId]);

  useEffect(() => {
    if (scores.length === 0) return;

    const names = scores.map(item => item.file_path.replace(/\.jsonl$/, ''));
    const values = scores.map(item => item.valid_scores);

    let barChart = echarts.init(barChartRef.current);
    barChart.setOption({
      tooltip: {},
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          interval: 0,
          rotate: 90, // 让标签竖直显示，避免遮挡
          fontSize: 13,
          color: '#335a97'
        }
      },
      yAxis: { type: 'value', min: 0, max: 100 },
       series: [{
        data: values,
        type: 'bar',
        itemStyle: { color: '#6a98f0' },
        barWidth: 36,
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          color: '#4961dc'
        }
      }]
    });

    let radarChart = echarts.init(radarChartRef.current);
    radarChart.setOption({
      tooltip: {},
      radar: {
        indicator: names.map(name => ({
          name,
          max: 100
        })),
        radius: 100,
        name: {
          textStyle: {
            color: '#4961dc',   // 设置为黑色
            fontSize: 14
          }
        }
      },
      series: [{
        name: '分数',
        type: 'radar',
        data: [{
          value: values,
          name: '分数',
          label: {
            show: true,
            color: '#4961dc',
            fontSize: 12
          }
        }],
        areaStyle: { color: 'rgba(106,152,240,0.2)' },
        lineStyle: { color: '#6a98f0' },
        symbol: 'circle',
        itemStyle: { color: '#4961dc' }
      }]
    });

    return () => {
      barChart.dispose();
      radarChart.dispose();
    };
  }, [scores]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="pages-content">
      <div className="pages-content-fs">
      <h2>得分详情</h2>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
        <div>
          <div ref={barChartRef} style={{ width: 500, height: 320 }} />
          <div style={{ textAlign: 'center', fontSize: '1.1rem', color: '#335a97' }}>柱状图</div>
        </div>
        <div>
          <div ref={radarChartRef} style={{ width: 370, height: 320 }} />
          <div style={{ textAlign: 'center', fontSize: '1.1rem', color: '#335a97' }}>雷达图</div>
        </div>
      </div>

      <table border="1">
        <thead>
          <tr>
            <th>数据集</th>
            <th>分数</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((item) => (
              <tr key={item.id}>
                <td>{item.file_path.replace(/\.jsonl$/, '')}</td>
                <td>{item.valid_scores}</td>
              </tr>
          ))}
        </tbody>
      </table>
        <Link to="/rankingsTable">返回榜单</Link>
        </div>
    </div>
  );
}

export default FileScores;
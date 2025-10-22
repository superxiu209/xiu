import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import '../components/pgpdtop.css';
import './Charts.css'; // 引入样式文件

const Charts = ({ chartData = [], chartData1 = [] }) => {
    const barChartRef = useRef(null);
    const radarChartRef = useRef(null);

    // 使用 useMemo 包裹 dimensions
    const dimensions = useMemo(() => ['相关性', '覆盖率', '准确性', '逻辑性', '安全性'], []);

    const [showBarLabels, setShowBarLabels] = useState(false);
    const [showRadarLabels, setShowRadarLabels] = useState(false);
    const [isComparisonMode, setIsComparisonMode] = useState(false);
    const [currentChartData, setCurrentChartData] = useState(chartData); // 当前显示的柱状图数据

    // 动态配置颜色
    const currentColors = useMemo(() => {
        return currentChartData === chartData
            ? {
                  barGradient: ['#4caf50', '#81c784'], // 绿色渐变
                  radarLine: '#4caf50', // 雷达图线颜色
                  radarArea: 'rgba(76, 175, 80, 0.4)', // 雷达图区域颜色
                  buttonColor: 'green', // 按钮颜色
              }
            : {
                  barGradient: ['#2196f3', '#64b5f6'], // 蓝色渐变
                  radarLine: '#2196f3', // 雷达图线颜色
                  radarArea: 'rgba(33, 150, 243, 0.4)', // 雷达图区域颜色
                  buttonColor: '#2196f3', // 按钮颜色
              };
    }, [currentChartData, chartData]);

    const renderBarChart = useCallback(() => {
        const barChart = echarts.init(barChartRef.current);
        const series = isComparisonMode
            ? [
                  {
                      name: '模型 1',
                      type: 'bar',
                      data: chartData,
                      itemStyle: {
                          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                              { offset: 0, color: '#4caf50' },
                              { offset: 1, color: '#81c784' },
                          ]),
                          barBorderRadius: [5, 5, 0, 0],
                      },
                      label: {
                          show: showBarLabels,
                          position: 'top',
                          color: '#000',
                          fontSize: 12,
                      },
                  },
                  {
                      name: '模型 2',
                      type: 'bar',
                      data: chartData1,
                      itemStyle: {
                          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                              { offset: 0, color: '#2196f3' },
                              { offset: 1, color: '#64b5f6' },
                          ]),
                          barBorderRadius: [5, 5, 0, 0],
                      },
                      label: {
                          show: showBarLabels,
                          position: 'top',
                          color: '#000',
                          fontSize: 12,
                      },
                  },
              ]
            : [
                  {
                      name: '分数',
                      type: 'bar',
                      data: currentChartData,
                      itemStyle: {
                          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                              { offset: 0, color: currentColors.barGradient[0] },
                              { offset: 1, color: currentColors.barGradient[1] },
                          ]),
                          barBorderRadius: [5, 5, 0, 0],
                      },
                      label: {
                          show: showBarLabels,
                          position: 'top',
                          color: '#000',
                          fontSize: 12,
                      },
                  },
              ];

        barChart.setOption({
            title: { left: 'center', textStyle: { fontSize: 16, color: '#333' } },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: isComparisonMode ? ['模型 1', '模型 2'] : [], top: 'top' },
            xAxis: {
                type: 'category',
                data: dimensions,
                axisLine: { lineStyle: { color: '#aaa' } },
                axisLabel: { fontSize: 12, color: '#666' },
            },
            yAxis: {
                type: 'value',
                name: '分数',
                axisLine: { lineStyle: { color: '#aaa' } },
                axisLabel: { fontSize: 12, color: '#000' },
                splitLine: { lineStyle: { type: 'dashed', color: '#ddd' } },
            },
            series,
        });
        return barChart;
    }, [chartData, chartData1, currentChartData, dimensions, isComparisonMode, showBarLabels, currentColors]);

    const renderRadarChart = useCallback(() => {
        const radarChart = echarts.init(radarChartRef.current);
        const series = isComparisonMode
            ? [
                  {
                      name: '模型 1',
                      type: 'radar',
                      data: [{ value: chartData, name: '模型 1' }],
                      label: {
                          show: showRadarLabels,
                          position: 'top',
                          color: '#000',
                          fontSize: 12,
                          formatter: (params) => `${params.value}`,
                      },
                      areaStyle: { color: 'rgba(76, 175, 80, 0.4)' },
                      lineStyle: { color: '#4caf50' },
                      symbol: 'circle',
                      symbolSize: 6,
                      itemStyle: { color: '#4caf50' },
                  },
                  {
                      name: '模型 2',
                      type: 'radar',
                      data: [{ value: chartData1, name: '模型 2' }],
                      label: {
                          show: showRadarLabels,
                          position: 'top',
                          color: '#000',
                          fontSize: 12,
                          formatter: (params) => `${params.value}`,
                      },
                      areaStyle: { color: 'rgba(33, 150, 243, 0.4)' },
                      lineStyle: { color: '#2196f3' },
                      symbol: 'circle',
                      symbolSize: 6,
                      itemStyle: { color: '#2196f3' },
                  },
              ]
            : [
                  {
                      name: '分数',
                      type: 'radar',
                      data: [{ value: currentChartData, name: '维度分数' }],
                      label: {
                          show: showRadarLabels,
                          position: 'top',
                          color: '#000',
                          fontSize: 12,
                          formatter: (params) => `${params.value}`,
                      },
                      areaStyle: { color: currentColors.radarArea },
                      lineStyle: { color: currentColors.radarLine },
                      symbol: 'circle',
                      symbolSize: 6,
                      itemStyle: { color: currentColors.radarLine },
                  },
              ];

        radarChart.setOption({
            title: { left: 'center', textStyle: { fontSize: 16, color: '#000' } },
            tooltip: {},
            legend: { data: isComparisonMode ? ['模型 1', '模型 2'] : [], top: 'top' },
            radar: {
                indicator: dimensions.map((dim) => ({ name: dim, max: 100 })),
                axisLine: { lineStyle: { color: '#ddd' } },
                axisName: { color: '#000', fontSize: 14 },
                splitLine: { lineStyle: { color: '#ddd', type: 'dashed' } },
                splitArea: { areaStyle: { color: ['#f4f4f4', '#fff'] } },
            },
            series,
        });
        return radarChart;
    }, [chartData, chartData1, currentChartData, dimensions, isComparisonMode, showRadarLabels, currentColors]);

    useEffect(() => {
        const barChart = renderBarChart();
        return () => barChart.dispose();
    }, [renderBarChart]);

    useEffect(() => {
        const radarChart = renderRadarChart();
        return () => radarChart.dispose();
    }, [renderRadarChart]);

    return (
        <div className="pages-content">
            {/*<hr style={{ borderTop: '2px solid black', width: '100%' }} />*/}
            {/* 柱状图 */}
            <div className="chart-container-1">
                <div className="chart-actions">
                    {/* 添加切换按钮 */}
                    <button
                        className="toggle-data-button"
                        style={{ backgroundColor: currentColors.buttonColor }}
                        onClick={() =>
                            setCurrentChartData(
                                currentChartData === chartData ? chartData1 : chartData
                            )
                        }
                    >
                        {currentChartData === chartData ? '切换到模型 2' : '切回到模型 1'}
                    </button>
                    <button
                        className="compare-button"
                        onClick={() => setIsComparisonMode(!isComparisonMode)}
                    >
                        {isComparisonMode ? '退出对比模式' : '进入对比模式'}
                    </button>
                </div>
                <h2 className="chart-title">柱状图</h2>
                <div className="chart" ref={barChartRef}></div>
                <button
                    className="toggle-labels-button"
                    onClick={() => setShowBarLabels(!showBarLabels)}
                >
                    {showBarLabels ? '隐藏柱状图分数' : '显示柱状图分数'}
                </button>
            </div>

            {/* 雷达图 */}
            <div className="chart-container-2">
                <h2 className="chart-title">雷达图</h2>
                <div className="chart" ref={radarChartRef}></div>
                <button
                    className="toggle-labels-button"
                    onClick={() => setShowRadarLabels(!showRadarLabels)}
                >
                    {showRadarLabels ? '隐藏雷达图分数' : '显示雷达图分数'}
                </button>
            </div>
        </div>
    );
};

export default Charts;
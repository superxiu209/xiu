import '../components/pgpdtop.css';
import '../components/customScrollbar.css';


import React from 'react';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate
import '../components/hoc.css'

const HomeContent = () => {
    const navigate = useNavigate(); // 使用 useNavigate 来获取导航函数


    return (
        <div className="pages-content">
            {/*<hr style={{ borderTop: '2px solid black', width: '100%' }} />*/}
            <div className="as">
                <div className="as-0">
                    <h1>Large Model</h1>
                </div>
                <div className="as-1">
                    <h1>Security Evaluation System</h1>
                </div>
                <div className="as-2">
                    <h1>大模型的安全性评测系统</h1>
                </div>
                {/*<img src={logo} className="App-logo" alt="logo" />*/}
                {/* 使用 onClick 绑定跳转事件 */}
                <div className="as-3">
                    <button onClick={() => navigate('/home')}>查看数据集 →</button>
                    <button onClick={() => navigate('/rankingsTable')}>查看排行榜 →</button>
                </div>

            </div>

        </div>
    );
};

export default HomeContent;
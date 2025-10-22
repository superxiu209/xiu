

import React from 'react';
import { useNavigate } from 'react-router-dom';

const Exit = () => {
    const navigate = useNavigate();

    // 退出逻辑
    const handleExit = () => {
        // 清除登录状态或执行退出操作
        navigate('/'); // 跳转到按钮3页面，表示未登录状态
    };

    return (
        <div>
            <h2>You have been logged out</h2>
            <button onClick={handleExit}>Exit</button>
        </div>
    );
};

export default Exit;

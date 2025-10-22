import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../pages/LRF.css';
import login1 from '../assest/login1.png';

const LoginRegisterPage = ({ setIsLoggedIn }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLoginOrRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/login_or_register/',
                { username, password },
                { withCredentials: true }
            );

            if (response.data.status === 'first_login' || response.data.status === 'success') {
                // 核心：存储登录状态和userId
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("userId", response.data.user_id);
                // 通知主导航栏刷新（重要！）
                window.dispatchEvent(new Event("loginSuccess"));

                setMessage(
                    response.data.status === 'first_login'
                        ? '账号已注册成功，正在进入系统...'
                        : '登录成功，正在进入系统...'
                );
                setIsLoggedIn && setIsLoggedIn(true); // 如果有props就同步父组件
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            } else if (response.data.status === 'error') {
                setMessage('账号已注册，但用户名或密码错误，请重新输入');
                setIsLoggedIn && setIsLoggedIn(false);
            } else {
                setMessage('发生未知错误，请稍后再试');
                setIsLoggedIn && setIsLoggedIn(false);
            }
        } catch (error) {
            setMessage('请求失败：' + error.message);
            setIsLoggedIn && setIsLoggedIn(false);
        }
    };

    return (
        <div className="pages-content-container-LRF">
            <div className="pages-content-LRF1">
                <img src={login1} alt="图片"/>
            </div>
            <div className="pages-content-LRF">
                <h1>登录/注册</h1>
                <div className="div1">
                    <form onSubmit={handleLoginOrRegister}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="用户名"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="密码"
                            required
                        />
                        <div className="div2">
                            <button type="submit">立即登录</button>
                        </div>
                    </form>
                </div>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default LoginRegisterPage;


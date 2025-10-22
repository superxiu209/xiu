import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ButtonNavigate.css';

// 获取当前用户ID
const getCurrentUserId = async () => {
  try {
    const userRes = await axios.get("http://127.0.0.1:8000/current_user/", { withCredentials: true });
    return userRes.data.id;
  } catch (error) {
    console.error("获取用户信息失败", error);
    return null;
  }
};

function HiddenButtons({ buttons, onLogout, navigate, onMouseEnter, onMouseLeave }) {
    return (
        <div
            className="absolute-buttons"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {buttons.map((button) => (
                <button
                    key={button.label}
                    className="button-nav abs-button"
                    onClick={() => {
                        if (button.label === '退出登录') {
                            onLogout();
                        } else {
                            navigate(button.path);
                        }
                    }}
                >
                    {button.label}
                </button>
            ))}
        </div>
    );
}

const ButtonNavigate = () => {
    const navigate = useNavigate();
    const [showHiddenButtons, setShowHiddenButtons] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const hideTimeoutRef = useRef(null);

    const buttons = [
        { label: '系统主页', path: '/' },
        { label: '数据集信息', path: '/home' },
        { label: '大模型排行榜', path: '/rankingsTable' },
        { label: '下载数据集', path: '/OTTS' },
        { label: '登录' },
        { label: '用户ID' },
        { label: '历史评测记录', path: '/historicalReview' },
        { label: '官方评测', path: '/VipOnlineTest' },
        { label: '在线评测', path: '/onlineTest' },
        { label: '生成内容评测', path: '/creat' },
        { label: '个人信息', path: '/information' },
        { label: '退出登录' },
    ];

    // 退出登录逻辑
    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserId(null);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
        sessionStorage.clear();
        localStorage.clear();
        navigate('/');
    };

    // 显示隐藏按钮组
    const handleShowHiddenButtons = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setShowHiddenButtons(true);
    };

    // 隐藏隐藏按钮组
    const handleHideHiddenButtons = () => {
        hideTimeoutRef.current = setTimeout(() => {
            setShowHiddenButtons(false);
        }, 500);
    };

    // 检查登录状态和用户ID
    useEffect(() => {
        function syncLoginState() {
            const storedLoginState = localStorage.getItem('isLoggedIn');
            const storedUserId = localStorage.getItem('userId');
            setIsLoggedIn(storedLoginState === 'true');
            setUserId(storedUserId ? Number(storedUserId) : null);
        }
        syncLoginState();
        window.addEventListener('storage', syncLoginState);
        window.addEventListener('loginSuccess', syncLoginState);
        return () => {
            window.removeEventListener('storage', syncLoginState);
            window.removeEventListener('loginSuccess', syncLoginState);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    // 登录成功后自动从后端获取用户ID（如果需要）
    useEffect(() => {
        const fetchUserIdIfNeeded = async () => {
            if (isLoggedIn && !userId) {
                const id = await getCurrentUserId();
                setUserId(id);
                localStorage.setItem('userId', id);
            }
        };
        fetchUserIdIfNeeded();
    }, [isLoggedIn, userId]);

    // 左侧按钮过滤（管理员id=1有“下载数据集”，普通用户没有）
    const leftButtons = buttons.filter((btn) => {
        if (!isLoggedIn) {
            // 未登录不显示“下载数据集”
            return ['系统主页', '数据集信息', '大模型排行榜'].includes(btn.label);
        }
        if (userId === 1) {
            // 管理员显示全部左侧
            return ['系统主页', '数据集信息', '大模型排行榜', '下载数据集'].includes(btn.label);
        }
        // 普通用户不显示“下载数据集”
        return ['系统主页', '数据集信息', '大模型排行榜'].includes(btn.label);
    });

    // 隐藏按钮过滤（管理员有“动态评测”，普通用户没有）
    const hiddenButtons = buttons.filter((btn) => {
        if (userId === 1) {
            // 管理员全部显示
            return ['历史评测记录', '官方评测', '在线评测', '生成内容评测', '个人信息', '退出登录'].includes(btn.label);
        }
        // 普通用户不显示“动态评测”
        return ['历史评测记录', '在线评测', '生成内容评测', '个人信息', '退出登录'].includes(btn.label);
    });

    return (
        <div className="button-nav-container">
            {/* 左侧按钮 */}
            <div className="nav-left">
                {leftButtons.map((button) => (
                    <button
                        key={button.label}
                        className="button-nav"
                        onClick={() => navigate(button.path)}
                    >
                        {button.label}
                    </button>
                ))}
            </div>

            {/* 右侧按钮 */}
            <div className="nav-right">
                {!isLoggedIn ? (
                    // 未登录显示登录按钮
                    <button
                        key="登录"
                        className="button-nav"
                        onClick={() => {
                            navigate('/loginregisterform');
                        }}
                    >
                        登录
                    </button>
                ) : (
                    // 登录后显示用户ID和隐藏按钮
                    <>
                        <button
                            key="用户ID"
                            className="button-nav"
                            onMouseEnter={handleShowHiddenButtons}
                            onMouseLeave={handleHideHiddenButtons}
                        >
                            用户ID {userId}
                        </button>
                        {showHiddenButtons && (
                            <HiddenButtons
                                buttons={hiddenButtons}
                                onLogout={handleLogout}
                                navigate={navigate}
                                onMouseEnter={handleShowHiddenButtons}
                                onMouseLeave={handleHideHiddenButtons}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ButtonNavigate;




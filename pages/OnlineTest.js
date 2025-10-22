import React, {useEffect, useState} from "react";
import DropdownComponent from "../components/DropdownComponent"; // 引入抽离的组件
import { originalLeftListData as originalLeftListDataStatic, newLeftListData as newLeftListDataStatic } from "../components/ListData";
import axios from "axios";
import "../components/DC.css"; // 引入抽离的 CSS 样式
import "../components/pgpdtop.css"

const OnlineTest = () => {
    const [value1, setValue1] = useState(""); // 存储第一个输入框的实际值
    const [value2, setValue2] = useState(""); // 存储第二个输入框的实际值
    const [displayValues, setDisplayValues] = useState(null); // 显示选中的值
    const [errorMessage, setErrorMessage] = useState(""); // 错误提示信息
    const [uploadStatus, setUploadStatus] = useState(""); // 上传状态信息

    // 静态+动态合并
    const [originalLeftListData, setOriginalLeftListData] = useState(originalLeftListDataStatic);
    const [newLeftListData, setNewLeftListData] = useState(newLeftListDataStatic);

    useEffect(() => {
        // original: 只补充新分组
        axios.get("http://127.0.0.1:8000/left-list-data/?type=original")
            .then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setOriginalLeftListData([...originalLeftListDataStatic, ...res.data]);
                } else {
                    setOriginalLeftListData(originalLeftListDataStatic);
                }
            })
            .catch(() => {
                setOriginalLeftListData(originalLeftListDataStatic);
            });
        // new 数据完全后端可配
        axios.get("http://127.0.0.1:8000/left-list-data/?type=new")
            .then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    // setNewLeftListData(res.data);
                    // 这里合并静态和后端
                setNewLeftListData([...newLeftListDataStatic, ...res.data]);
                } else {
                    setNewLeftListData(newLeftListDataStatic);
                }
            })
            .catch(() => {
                setNewLeftListData(newLeftListDataStatic);
            });
    }, []);

    useEffect(() => {
    if (uploadStatus) {
        const timer = setTimeout(() => setUploadStatus(""), 7500);
        return () => clearTimeout(timer);
    }
}, [uploadStatus]);

    useEffect(() => {
    if (displayValues) {
        const timer = setTimeout(() => {
            setDisplayValues(null);
        }, 10000);
        return () => clearTimeout(timer);
    }
}, [displayValues]);

    // 确定按钮点击事件
    const handleConfirm = () => {
        if (!value1 || !value2) {
            setErrorMessage("请先选择两个输入框的内容！");
            return;
        }

        // 清空错误信息
        setErrorMessage("");

        // 显示选中的值
        setDisplayValues({
            first: value1,
            second: value2,
        });
    };

    // 上传数据到后端
    const handleUpload = async () => {
        if (!value1 || !value2) {
            setUploadStatus("评测失败：请先选择两个输入框的内容！");
            return;
        }

        // const response = await axios.post('/login', { ... });
        // const data = response.data;
        // localStorage.setItem("userId", data.user_id); // 登录成功时
        // 先请求 /current_user/ 拿到 user_id
        const userRes = await axios.get("http://127.0.0.1:8000/current_user/", { withCredentials: true });
        // const userId = userRes.data.user_id; // 根据你的后端字段实际取
        const userId = userRes.data.id;
        // const userId = localStorage.getItem("userId"); // 这里获取
        console.log("userId", userId); // 这里加一行调试

        try {
            // 发送 POST 请求到后端接口
            const response = await axios.post("http://127.0.0.1:8000/data_upload/", {
            //   const response = await axios.post("http://192.168.50.176:8000/data_upload/", {
                value1: value1, // 第一个输入框的值
                value2: value2, // 第二个输入框的值
                value3: userId,
            });

            // 根据后端返回的状态更新上传状态
            if (response.status === 200) {
                setUploadStatus("评测成功！");
            } else {
                setUploadStatus("评测失败：后端返回错误");
            }
        } catch (error) {
            setUploadStatus("评测失败：网络或服务器错误");
            console.error("数据评测失败", error);
        }
    };

    return (
        <div className="pages-content">
            {/* 第一个下拉选择框 */}
            <DropdownComponent
                leftListData={originalLeftListData}
                onSelectionChange={(newValue) => setValue1(newValue)} // 更新第一个输入框的值
            />
            {/* 第二个下拉选择框 */}
            <div style={{ marginLeft: "404px", width: "1200px" }}>
                <DropdownComponent
                    leftListData={newLeftListData}
                    onSelectionChange={(newValue) => setValue2(newValue)} // 更新第二个输入框的值
                />
            </div>

            <div style={{ marginLeft: "404px", marginTop: "210px"}}>

            {/* 确定按钮 */}
            <button
                className="confirm-button"
                onClick={handleConfirm}
            >
                确定
            </button>


            {/* 上传按钮 */}
            <button
                className="upload-button"
                onClick={handleUpload}
            >
                评测
            </button>

                {/* 提示信息 */}
            {errorMessage && (
                <p className="error-message">{errorMessage}</p>
            )}
            {/* 显示选中的值 */}
            {displayValues && (
                <div style={{ marginTop: "20px" }}>
                    <p>第一个输入框的选中值: {displayValues.first}</p>
                    <p>第二个输入框的选中值: {displayValues.second}</p>
                </div>
            )}
            {/* 上传状态 */}
            {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
            </div>
        </div>
    );
};

export default OnlineTest;

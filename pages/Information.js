import React, { useState, useEffect } from "react";
import "../components/pgpdtop.css";
import "../pages/i.css";
import axios from "axios";

const Information = () => {
    // 从 localStorage 获取初始用户信息，如果没有则设置为空对象
    const [userInfo, setUserInfo] = useState(() => {
        const savedUserInfo = localStorage.getItem("userInfo");
        return savedUserInfo ? JSON.parse(savedUserInfo) : {
            id: null,
            name: "",
            gender: "",
            age: "",
            phone: "",
            email: "",
            password: "******",
        };
    });

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // 每次 userInfo 更新时，将其保存到 localStorage
    useEffect(() => {
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
    }, [userInfo]);

    // 处理表单字段变化
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo((prevInfo) => ({
            ...prevInfo,
            [name]: value,
        }));
    };

    // 查询按钮点击事件（自动用当前邮箱查询）
    const handleQueryClick = async () => {
        if (!userInfo.email || !userInfo.email.trim()) {
            setMessage({ type: "error", text: "当前用户没有邮箱，无法查询。" });
            return;
        }
        try {
            const response = await axios.get(
                `http://127.0.0.1:8000/information/?email=${encodeURIComponent(userInfo.email)}`
            );
            if (response.status === 200) {
                setUserInfo(response.data.user);
                setMessage({ type: "success", text: "用户信息已加载。" });
                setIsEditing(false);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setMessage({ type: "error", text: "未查到用户，请先填写信息后保存。" });
                // 信息保持不变，也可以切为编辑模式
                setIsEditing(true);
            } else {
                setMessage({ type: "error", text: "查询失败：" + error.message });
            }
        }
    };

    // 保存按钮点击事件
    const handleSaveClick = async () => {
        if (!userInfo.name.trim()) {
            setMessage({ type: "error", text: "姓名不能为空，请填写姓名！" });
            return;
        }

        try {
            const response = await axios.post("http://127.0.0.1:8000/information/", userInfo, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200 || response.status === 201) {
                setUserInfo(response.data.updatedUser); // 更新用户信息
                localStorage.setItem("userInfo", JSON.stringify(response.data.updatedUser)); // 强制同步localStorage
                setMessage({ type: "success", text: "用户信息保存成功！" });
                setIsEditing(false); // 退出编辑模式
            } else {
                setMessage({ type: "error", text: "发生未知错误，请稍后重试！" });
            }
        } catch (error) {
            if (error.response) {
                setMessage({ type: "error", text: `保存失败：${error.response.data.error}` });
            } else {
                setMessage({ type: "error", text: `保存失败：${error.message}` });
            }
        }
    };

    // 切换密码显示/隐藏
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // 用户点击退出登录时，清空 localStorage
    const handleLogout = () => {
        localStorage.removeItem("userInfo");
        setUserInfo({
            id: null,
            name: "",
            gender: "",
            age: "",
            phone: "",
            email: "",
            password: "******",
        });
        setMessage({ type: "info", text: "您已退出显示！" });
    };

    return (
        <div className="page-1">
            <div className="px-1">
                <div className="px-11">
                    {isEditing ? (
                        <div>
                            <label>
                                姓名:
                                <input
                                    type="text"
                                    name="name"
                                    value={userInfo.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </label>
                            <label>
                                性别:
                                <select
                                    name="gender"
                                    value={userInfo.gender}
                                    onChange={handleInputChange}
                                >
                                    <option value="">请选择</option>
                                    <option value="male">男</option>
                                    <option value="female">女</option>
                                </select>
                            </label>
                            <label>
                                年龄:
                                <input
                                    type="number"
                                    name="age"
                                    value={userInfo.age}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                电话:
                                <input
                                    type="text"
                                    name="phone"
                                    value={userInfo.phone}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                邮箱:
                                <input
                                    type="email"
                                    name="email"
                                    value={userInfo.email}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                密码:
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={userInfo.password}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        style={{
                                            marginLeft: "10px",
                                            cursor: "pointer",
                                            background: "transparent",
                                            border: "none",
                                            color: "#007BFF",
                                        }}
                                    >
                                        {showPassword ? "隐藏" : "显示"}
                                    </button>
                            </label>
                        </div>
                    ) : (
                        <div>
                            {/*<p>ID: {userInfo.id}</p>*/}
                            {/*<p>ID: {userInfo.id !== null && userInfo.id !== undefined ? userInfo.id + 6 : ""}</p>*/}
                            <p>
                                ID: {
                                userInfo.id === 14
                                    ? 1
                                    : (userInfo.id !== null && userInfo.id !== undefined
                                        ? userInfo.id + 6
                                        : "")
                            }
                            </p>
                            <p>姓名: {userInfo.name}</p>
                            <p>性别: {userInfo.gender === "male" ? "男" : userInfo.gender === "female" ? "女" : "未填写"}</p>
                            <p>年龄: {userInfo.age}</p>
                            <p>电话: {userInfo.phone}</p>
                            <p>邮箱: {userInfo.email}</p>
                            <p>密码: ******</p>
                        </div>
                    )}
                </div>
                <div className="px-12">
                    {/* 查询按钮在“修改”左边 */}
                    <button onClick={handleQueryClick} className="edit-button" style={{ marginRight: "8px" }}>
                        查询
                    </button>
                    {isEditing ? (
                        <button onClick={handleSaveClick} className="save-button">
                            保存
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="edit-button">
                                修改
                            </button>
                            <button onClick={handleLogout} className="logout-button">
                                退出显示
                            </button>
                        </>
                    )}
                </div>
                {message && <p className={`message ${message.type}`}>{message.text}</p>}
            </div>
        </div>
    );
};

export default Information;

// import React, { useState, useEffect } from "react";
// import "../components/pgpdtop.css";
// import "../pages/i.css";
// import axios from "axios";
//
// const Information = () => {
//     // 从 localStorage 获取初始用户信息，如果没有则设置为空对象
//     const [userInfo, setUserInfo] = useState(() => {
//         const savedUserInfo = localStorage.getItem("userInfo");
//         return savedUserInfo ? JSON.parse(savedUserInfo) : {
//             id: null,
//             name: "",
//             gender: "",
//             age: "",
//             phone: "",
//             email: "",
//             password: "******",
//         };
//     });
//
//     const [isEditing, setIsEditing] = useState(false);
//     const [message, setMessage] = useState(null);
//     const [showPassword, setShowPassword] = useState(false);
//
//     // 新增：用于查询的email字段
//     const [queryEmail, setQueryEmail] = useState("");
//
//     // 每次 userInfo 更新时，将其保存到 localStorage
//     useEffect(() => {
//         localStorage.setItem("userInfo", JSON.stringify(userInfo));
//     }, [userInfo]);
//
//     // 处理表单字段变化
//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setUserInfo((prevInfo) => ({
//             ...prevInfo,
//             [name]: value,
//         }));
//     };
//
//     // 新增：处理查询按钮点击
//     const handleQueryClick = async () => {
//         if (!queryEmail.trim()) {
//             setMessage({ type: "error", text: "请输入邮箱进行查询！" });
//             return;
//         }
//         try {
//             const response = await axios.get(
//                 `http://127.0.0.1:8000/information/?email=${encodeURIComponent(queryEmail)}`
//             );
//             if (response.status === 200) {
//                 setUserInfo(response.data.user);
//                 setMessage({ type: "success", text: "用户信息已加载。" });
//                 setIsEditing(false);
//             }
//         } catch (error) {
//             if (error.response && error.response.status === 404) {
//                 setMessage({ type: "error", text: "未查到用户，请先填写信息后保存。" });
//                 setUserInfo({
//                     id: null,
//                     name: "",
//                     gender: "",
//                     age: "",
//                     phone: "",
//                     email: queryEmail,
//                     password: "******",
//                 });
//                 setIsEditing(true);
//             } else {
//                 setMessage({ type: "error", text: "查询失败：" + error.message });
//             }
//         }
//     };
//
//     // 保存按钮点击事件
//     const handleSaveClick = async () => {
//         if (!userInfo.name.trim()) {
//             setMessage({ type: "error", text: "姓名不能为空，请填写姓名！" });
//             return;
//         }
//
//         try {
//             const response = await axios.post("http://127.0.0.1:8000/information/", userInfo, {
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//             });
//
//             if (response.status === 200 || response.status === 201) {
//                 setUserInfo(response.data.updatedUser); // 更新用户信息
//                 localStorage.setItem("userInfo", JSON.stringify(response.data.updatedUser)); // 强制同步localStorage
//                 setMessage({ type: "success", text: "用户信息保存成功！" });
//                 setIsEditing(false); // 退出编辑模式
//             } else {
//                 setMessage({ type: "error", text: "发生未知错误，请稍后重试！" });
//             }
//         } catch (error) {
//             if (error.response) {
//                 setMessage({ type: "error", text: `保存失败：${error.response.data.error}` });
//             } else {
//                 setMessage({ type: "error", text: `保存失败：${error.message}` });
//             }
//         }
//     };
//
//     // 切换密码显示/隐藏
//     const togglePasswordVisibility = () => {
//         setShowPassword(!showPassword);
//     };
//
//     // 用户点击退出登录时，清空 localStorage
//     const handleLogout = () => {
//         localStorage.removeItem("userInfo");
//         setUserInfo({
//             id: null,
//             name: "",
//             gender: "",
//             age: "",
//             phone: "",
//             email: "",
//             password: "******",
//         });
//         setMessage({ type: "info", text: "您已退出显示！" });
//     };
//
//     return (
//         <div className="page-1">
//             {/* 查询区域 */}
//             <div style={{ marginBottom: "20px" }}>
//                 <input
//                     type="email"
//                     placeholder="请输入邮箱进行查询"
//                     value={queryEmail}
//                     onChange={e => setQueryEmail(e.target.value)}
//                     style={{ marginRight: "10px" }}
//                 />
//                 <button onClick={handleQueryClick}>查询</button>
//             </div>
//             <div className="px-1">
//                 <div className="px-11">
//                     {isEditing ? (
//                         <div>
//                             <label>
//                                 姓名:
//                                 <input
//                                     type="text"
//                                     name="name"
//                                     value={userInfo.name}
//                                     onChange={handleInputChange}
//                                     required
//                                 />
//                             </label>
//                             <label>
//                                 性别:
//                                 <select
//                                     name="gender"
//                                     value={userInfo.gender}
//                                     onChange={handleInputChange}
//                                 >
//                                     <option value="">请选择</option>
//                                     <option value="male">男</option>
//                                     <option value="female">女</option>
//                                 </select>
//                             </label>
//                             <label>
//                                 年龄:
//                                 <input
//                                     type="number"
//                                     name="age"
//                                     value={userInfo.age}
//                                     onChange={handleInputChange}
//                                 />
//                             </label>
//                             <label>
//                                 电话:
//                                 <input
//                                     type="text"
//                                     name="phone"
//                                     value={userInfo.phone}
//                                     onChange={handleInputChange}
//                                 />
//                             </label>
//                             <label>
//                                 邮箱:
//                                 <input
//                                     type="email"
//                                     name="email"
//                                     value={userInfo.email}
//                                     onChange={handleInputChange}
//                                 />
//                             </label>
//                             <label>
//                                 密码:
//                                     <input
//                                         type={showPassword ? "text" : "password"}
//                                         name="password"
//                                         value={userInfo.password}
//                                         onChange={handleInputChange}
//                                     />
//                                     <button
//                                         type="button"
//                                         onClick={togglePasswordVisibility}
//                                         style={{
//                                             marginLeft: "10px",
//                                             cursor: "pointer",
//                                             background: "transparent",
//                                             border: "none",
//                                             color: "#007BFF",
//                                         }}
//                                     >
//                                         {showPassword ? "隐藏" : "显示"}
//                                     </button>
//                             </label>
//                         </div>
//                     ) : (
//                         <div>
//                             <p>ID: {userInfo.id}</p>
//                             <p>姓名: {userInfo.name}</p>
//                             <p>性别: {userInfo.gender === "male" ? "男" : userInfo.gender === "female" ? "女" : "未填写"}</p>
//                             <p>年龄: {userInfo.age}</p>
//                             <p>电话: {userInfo.phone}</p>
//                             <p>邮箱: {userInfo.email}</p>
//                             <p>密码: ******</p>
//                         </div>
//                     )}
//                 </div>
//                 <div className="px-12">
//                     {isEditing ? (
//                         <button onClick={handleSaveClick} className="save-button">
//                             保存
//                         </button>
//                     ) : (
//                         <>
//                             <button onClick={() => setIsEditing(true)} className="edit-button">
//                                 修改
//                             </button>
//                             <button onClick={handleLogout} className="logout-button">
//                                 退出显示
//                             </button>
//                         </>
//                     )}
//                 </div>
//                 {message && <p className={`message ${message.type}`}>{message.text}</p>}
//             </div>
//         </div>
//     );
// };
//
// export default Information;
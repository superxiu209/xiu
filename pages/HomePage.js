import React, { useState, useEffect, useCallback, useRef } from "react";
import "../pages/hp.css"; // 引入 CSS 文件
import "../components/pgpdtop.css";
import HPheader from "../components/HPheader";
import axios from "axios";

// 初始化内容数据
const initialContentData = {
  1: {
    button: { id: 1, name: "按钮1" },
    contents: [
      { name: "acc", description: null, source: null, publishedAt: null },
      { name: "BBA", description: null, source: null, publishedAt: null },
      { name: "CCD", description: null, source: null, publishedAt: null },
      { name: "BA", description: null, source: null, publishedAt: null },
      { name: "EFG", description: null, source: null, publishedAt: null },
      { name: "HIJ", description: null, source: null, publishedAt: null },
      { name: "KLMooYUUIoo", description: null, source: null, publishedAt: null },
      { name: "NOP", description: null, source: null, publishedAt: null },
      { name: "QRS", description: null, source: null, publishedAt: null },
      { name: "TUV", description: null, source: null, publishedAt: null },
    ],
  },
  2: {
    button: { id: 2, name: "按钮2" },
    contents: [
      { name: "acc", description: null, source: null, publishedAt: null },
      { name: "BA", description: null, source: null, publishedAt: null },
    ],
  },
  3: {
    button: { id: 3, name: "按钮3" },
    contents: [
      { name: "CCD", description: null, source: null, publishedAt: null },
      { name: "BA", description: null, source: null, publishedAt: null },
      { name: "XYZ", description: null, source: null, publishedAt: null },
      { name: "123", description: null, source: null, publishedAt: null },
      { name: "456", description: null, source: null, publishedAt: null },
      { name: "789", description: null, source: null, publishedAt: null },
      { name: "ABC", description: null, source: null, publishedAt: null },
      { name: "DEF", description: null, source: null, publishedAt: null },
      { name: "GHI", description: null, source: null, publishedAt: null },
      { name: "JKL", description: null, source: null, publishedAt: null },
    ],
  },
  4: {
    button: { id: 4, name: "按钮4" },
    contents: [
      {
        name: "religion",
        description: "评估LLM在问答中宗教偏见",
        source: "https://github.com/nyu-mll/BBQ/blob/main/data/Religion.jsonl",
        publishedAt: "2025-04-15",
      },
        {
        name: "age",
        description: "评估LLM在问答中年龄偏见",
        source: "https://github.com/nyu-mll/BBQ/blob/main/data/Age.jsonl",
        publishedAt: "2025-04-15",
      },
      {
        name: "uuy",
        description: "uuy 是一款现代化的工具，提供了最新的技术支持。",
        source: "由 GitHub 开发并提供支持。",
        publishedAt: "2025-04-01",
      },
      {
        name: "uuy2",
        description: "uuy2 是 uuy 的升级版本，功能更强大。",
        source: "由社区贡献并完善。",
        publishedAt: "2025-04-15",
      },
    ],
  },
  5: {
    button: { id: 5, name: "按钮5" },
    contents: [
      {
        name: "aaaa",
        description: "示例内容aaaa",
        source: "管理员添加",
        publishedAt: "2025-04-22",
      },
    ],
  },
};

const getCurrentUserId = async () => {
  try {
    const userRes = await axios.get("http://127.0.0.1:8000/current_user/", { withCredentials: true });
    return userRes.data.id;
  } catch (error) {
    console.error("获取用户信息失败", error);
    return null;
  }
};

const HP = () => {
  const [activeButton, setActiveButton] = useState(1); // 当前选中的按钮 ID
  const [searchTerm, setSearchTerm] = useState(""); // 搜索关键字
  const [currentPage, setCurrentPage] = useState(1); // 当前分页页码
  const [selectedItem, setSelectedItem] = useState(null); // 保存选中的内容（用于模态框显示）
  const [showAddModal, setShowAddModal] = useState(false); // 控制新增模态框的显示
  const [newContent, setNewContent] = useState({
    buttonId: activeButton,
    name: "",
    description: "",
    source: "",
    publishedAt: "",
  });
  const [contentData, setContentData] = useState(initialContentData); // 初始化内容数据
  const itemsPerPage = 9; // 每页显示内容的数量
  const [userId, setUserId] = useState(null); // 新增用户ID状态
  const lastUpdate = useRef(null); // 使用 useRef 来存储 lastUpdate

  // 获取用户ID，仅在组件挂载时执行一次
  useEffect(() => {
    getCurrentUserId().then(setUserId);
  }, []);

  // 定义按钮显示文本的映射
  const buttonDisplayMap = {
    1: "全部",
    2: "幻觉",
    3: "常识",
    4: "偏见与歧视",
    5: "内容合规性",
  };

  useEffect(() => {
    setNewContent((prev) => ({
      ...prev,
      buttonId: activeButton,
    }));
  }, [activeButton]);

  const fetchDatabaseContent = useCallback(async () => {
    try {
      const requestBody = lastUpdate.current
        ? { lastUpdate: lastUpdate.current } // 如果有 lastUpdate，则传递时间戳
        : {}; // 如果没有 lastUpdate，则请求所有内容

      const response = await fetch("http://127.0.0.1:8000/fetch_content/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const databaseData = await response.json();

      // 合并后端数据到现有的内容数据中
      const mergedData = { ...contentData };

      databaseData.forEach((dbButton) => {
        if (mergedData[dbButton.button.id]) {
          const existingNames = new Set(
            mergedData[dbButton.button.id].contents.map((item) => item.name)
          );
          const newContents = dbButton.contents.filter(
            (item) => !existingNames.has(item.name)
          );
          mergedData[dbButton.button.id].contents = [
            ...newContents,
            ...mergedData[dbButton.button.id].contents,
          ];
        } else {
          mergedData[dbButton.button.id] = {
            button: { id: dbButton.button.id, name: dbButton.button.name },
            contents: dbButton.contents,
          };
        }
      });

      // 更新内容数据，仅在数据有变化时更新
      setContentData((prevData) => {
        if (JSON.stringify(prevData) !== JSON.stringify(mergedData)) {
          return mergedData;
        }
        return prevData;
      });

      // 更新 lastUpdate 值
      lastUpdate.current = new Date().toISOString();
    } catch (error) {
      console.error("加载数据库内容失败：", error);
    }
  }, [contentData]);

  useEffect(() => {
    fetchDatabaseContent();
  }, [fetchDatabaseContent]);

  // 获取当前按钮对应的内容，并根据搜索关键字过滤
  const getCurrentContent = () => {
    const currentContent = contentData[activeButton]?.contents || [];
    return currentContent.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 获取当前页的内容
  const getCurrentPageContent = () => {
    const filteredContent = getCurrentContent();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredContent.slice(startIndex, endIndex);
  };

  // 新增内容的处理逻辑
  const handleAddContent = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/add_content/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContent),
      });

      if (response.ok) {
        fetchDatabaseContent(); // 重新加载数据
        setShowAddModal(false); // 关闭新增模态框
        setNewContent({ buttonId: activeButton, name: "", description: "", source: "", publishedAt: "" }); // 重置新增表单
      } else {
        alert("新增失败，请重试！");
      }
    } catch (error) {
      console.error("新增内容失败：", error);
    }
  };

  const [deleteMessage, setDeleteMessage] = useState(""); // 用于显示删除成功的提示信息

  // 删除内容的处理逻辑
  const handleDeleteContent = async (contentId) => {
    if (!window.confirm("确定要删除这条内容吗？")) {
      return; // 用户取消删除
    }

    try {
      // 发送删除请求到后端
      const response = await fetch("http://127.0.0.1:8000/delete_content/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contentId }),
      });

      if (response.ok) {
        const result = await response.json();
        setDeleteMessage(result.message || "删除成功，请刷新网页"); // 设置提示信息
        fetchDatabaseContent(); // 删除成功后重新加载数据

        // 在 2 秒后清除提示信息并关闭模态框
        setTimeout(() => {
          setDeleteMessage("");
          setSelectedItem(null); // 关闭模态框
        }, 2000);
      } else {
        alert("删除失败，请重试！");
      }
    } catch (error) {
      console.error("删除内容失败：", error);
    }
  };

  // 渲染分页按钮
  const renderPaginationButtons = () => {
    const buttons = [];
    const totalNumbers = getCurrentContent().length;
    const totalPages = Math.ceil(totalNumbers / itemsPerPage); // 总页数
    const maxVisiblePages = 5; // 最多显示 5 个分页按钮
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    }

    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? "active" : ""}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  const [isEditing, setIsEditing] = useState(false); // 是否处于编辑状态
  const [editContent, setEditContent] = useState(null); // 用于存储编辑中的内容

  // 处理“修改”按钮点击
  const handleEditContent = () => {
    setIsEditing(true);
    setEditContent({ ...selectedItem }); // 将当前选中内容复制到编辑状态
  };

  // 处理输入框内容变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditContent((prev) => ({ ...prev, [name]: value }));
  };

  // 处理保存修改
  const handleSaveContent = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/update_content/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editContent), // 发送修改后的内容到后端
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || "修改成功");
        fetchDatabaseContent(); // 修改成功后重新加载数据
        setIsEditing(false); // 退出编辑状态
        setSelectedItem(null); // 关闭模态框
      } else {
        alert("修改失败，请重试！");
      }
    } catch (error) {
      console.error("修改内容失败：", error);
    }
  };

 return (
    <div className="pages-content" style={{zIndex: selectedItem ? 1 : "auto"}}>
      <div className="title-word-1">
        <h2>数据集社区</h2>
      </div>
      <HPheader/>
      <div className="pages-content-hp">
        {/* 按钮部分 */}
        <div className="button-container">
          {Object.values(contentData).map(({button}) => (
            <button
              key={button.id}
              className={`btn ${activeButton === button.id ? "active" : ""}`}
              onClick={() => {
                setActiveButton(button.id);
                setSearchTerm("");
                setCurrentPage(1);
              }}
            >
              {buttonDisplayMap[button.id] || button.name}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索和新增按钮 */}
      <div className="search-container">
        <div className="search-container-1">
          <input
            type="text"
            placeholder="搜索..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="search-container-2">
          <div className="search-container-3">
            {/* 仅管理员显示“新增”按钮 */}
            {userId === 1 && (
              <button onClick={() => setShowAddModal(true)}>新增</button>
            )}
          </div>
        </div>
      </div>

      {/* 内容展示部分 */}
      <div className="blue-box">
        {getCurrentPageContent().length > 0 ? (
          <div className="content-row">
            {getCurrentPageContent().map((item, index) => (
              <div
                key={index}
                className="content-item-1"
                onClick={() => setSelectedItem(item)}
                style={{cursor: "pointer"}}
              >
                <h3>{item.name}</h3>
                {item.description && (
                  <p className="description-text">
                    <strong>介绍：</strong> {item.description}
                  </p>
                )}
                {item.publishedAt && (
                  <p className="published-date">
                    <strong>发布时间：</strong> {item.publishedAt}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="content-item-1">未找到匹配的内容</div>
        )}
      </div>

      {/* 分页部分 */}
      <div className="pagination-container">
        <button
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          回到首页
        </button>
        <button
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          上一页
        </button>
        {renderPaginationButtons()}
        <button
          className="pagination-btn"
          disabled={currentPage === Math.ceil(getCurrentContent().length / itemsPerPage)}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          下一页
        </button>
      </div>


      {/* 选中内容的模态框 */}
      {selectedItem && (
        <div className="modal">
          <div className="modal-content">
            {isEditing ? (
              // 编辑状态
              <>
                <input
                  type="text"
                  name="name"
                  value={editContent.name}
                  onChange={handleInputChange}
                  placeholder="请输入名称"
                />
                <textarea
                  name="description"
                  value={editContent.description}
                  onChange={handleInputChange}
                  placeholder="请输入描述"
                />
                <input
                  type="text"
                  name="source"
                  value={editContent.source}
                  onChange={handleInputChange}
                  placeholder="请输入来源"
                />
                <input
                  type="date"
                  name="publishedAt"
                  value={editContent.publishedAt}
                  onChange={handleInputChange}
                />
                <button className="save-btn" onClick={handleSaveContent}>
                  保存
                </button>
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                  取消
                </button>
              </>
            ) : (
              // 非编辑状态
              <>
                <h2>{selectedItem.name}</h2>
                {selectedItem.description && (
                  <p>
                    <strong>介绍：</strong> {selectedItem.description}
                  </p>
                )}
                {selectedItem.source && (
                  <p>
                    <strong>来源：</strong>{" "}
                    {/^https?:\/\//.test(selectedItem.source) ? (
                      <a href={selectedItem.source} target="_blank" rel="noopener noreferrer">
                        {selectedItem.source}
                      </a>
                    ) : (
                      selectedItem.source
                    )}
                  </p>
                )}
                {selectedItem.publishedAt && (
                  <p>
                    <strong>发布时间：</strong> {selectedItem.publishedAt}
                  </p>
                )}
                {/* 仅管理员显示“修改/删除”按钮 */}
                {userId === 1 && (
                  <>
                    <button className="edit-btn-hp" onClick={handleEditContent}>
                      修改
                    </button>
                    <button
                      className="delete-btn-hp"
                      onClick={() => handleDeleteContent(selectedItem.id)}
                    >
                      删除
                    </button>
                  </>
                )}
                {/* 删除成功提示 */}
                {deleteMessage && (
                  <div className="delete-message">
                    {deleteMessage}
                  </div>
                )}
                <button className="close-btn" onClick={() => setSelectedItem(null)}>
                  关闭
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 新增内容的模态框 */}
      {showAddModal && userId === 1 && (
        <div className="modal">
          <div className="modal-content">
            <h2>新增内容</h2>
            <form>
              <label>
                名称:
                <input
                  type="text"
                  value={newContent.name}
                  onChange={(e) => setNewContent({...newContent, name: e.target.value})}
                />
              </label>
              <label>
                描述:
                <input
                  type="text"
                  value={newContent.description}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                />
              </label>
              <label>
                来源:
                <input
                  type="text"
                  value={newContent.source}
                  onChange={(e) => setNewContent({...newContent, source: e.target.value})}
                />
              </label>
              <label>
                发布时间:
                <input
                  type="date"
                  value={newContent.publishedAt}
                  onChange={(e) => setNewContent({...newContent, publishedAt: e.target.value})}
                />
              </label>
              <button type="button" onClick={handleAddContent}>
                确定
              </button>
              <button type="button" onClick={() => setShowAddModal(false)}>
                取消
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HP;

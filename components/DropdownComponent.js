import React, { useState } from "react";
import "../components/DC.css"; // 引入样式文件
import "../components/pgpdtop.css"


const DropdownComponent = ({ leftListData, onSelectionChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(""); // 显示的选中值
    const [actualValue, setActualValue] = useState(""); // 实际的选中值
    const [rightOptions, setRightOptions] = useState([]); // 右侧选项列表

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const handleLeftListClick = (options) => {
        const updatedOptions = options.map((option) => ({
            display: option.display,
            value: option.value,
            isSelected: option.value === actualValue,
        }));
        setRightOptions(updatedOptions);
    };

    const handleRightOptionClick = (index) => {
        const clickedOption = rightOptions[index];
        if (clickedOption.isSelected) {
            clearSelection();
            return;
        }

        const newValue = clickedOption.value;
        const newDisplayValue = clickedOption.display;

        setSelectedValue(newDisplayValue); // 更新显示值
        setActualValue(newValue); // 更新实际值
        onSelectionChange(newValue); // 通知父组件实际值的变化

        // 更新右侧选项状态
        const updatedOptions = rightOptions.map((option, i) => ({
            ...option,
            isSelected: i === index,
        }));
        setRightOptions(updatedOptions);
    };

    const clearSelection = () => {
        setSelectedValue("");
        setActualValue("");
        onSelectionChange(""); // 通知父组件清空选中值
        setRightOptions((prevOptions) =>
            prevOptions.map((option) => ({
                ...option,
                isSelected: false,
            }))
        );
    };


    // 左侧分组滚动条样式
    const leftListStyle = {
        width: "100px",
        borderRight: "1px solid #ccc",
        overflowY: leftListData.length > 6 ? "auto" : "visible",
        maxHeight: leftListData.length > 6 ? "220px" : "none", // 每项高度约 40px，6 项为 240px
    };

    // 右侧选项滚动条样式
    const rightOptionsStyle = {
        flex: 1,
        padding: "8px",
        overflowY: rightOptions.length > 6 ? "auto" : "visible",
        maxHeight: rightOptions.length > 6 ? "240px" : "none", // 每项高度约 40px，6 项为 240px
    };

        return (
        <div
            className="pages-content"
            style={{ position: "relative", width: "400px", marginBottom: "20px" }}
        >
            {/* 输入框 */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #ccc",
                    padding: "8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                }}
                onClick={toggleDropdown}
            >
                {selectedValue ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            fontSize: "14px",
                        }}
                    >
                        <span>{selectedValue}</span>
                        <button
                            style={{
                                marginLeft: "8px",
                                background: "none",
                                border: "none",
                                fontSize: "16px",
                                color: "#aaa",
                                cursor: "pointer",
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                clearSelection();
                            }}
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <span style={{ color: "#aaa" }}>请选择.....</span>
                )}
            </div>

            {/* 下拉框 */}
            {isDropdownOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        backgroundColor: "#f9f9f9",
                        border: "1px solid #ccc",
                        width: "400px",
                        display: "flex",
                        zIndex: 1000,
                    }}
                >
                    {/* 左侧分组 */}
                    <div style={leftListStyle}>
                        {leftListData.map((group) => (
                            <div
                                key={group.group}
                                onClick={() => handleLeftListClick(group.options)}
                                style={{
                                    padding: "8px",
                                    cursor: "pointer",
                                    backgroundColor:
                                        rightOptions.length > 0 &&
                                        rightOptions.some((opt) =>
                                            group.options.some(
                                                (grpOpt) => grpOpt.value === opt.value
                                            )
                                        )
                                            ? "#bae7ff"
                                            : "transparent",
                                }}
                            >
                                {group.group}
                            </div>
                        ))}
                    </div>

                    {/* 右侧选项 */}
                    <div style={rightOptionsStyle}>
                        {rightOptions.map((option, index) => (
                            <div
                                key={option.value}
                                onClick={() => handleRightOptionClick(index)}
                                style={{
                                    padding: "8px",
                                    cursor: "pointer",
                                    backgroundColor: option.isSelected
                                        ? "#bae7ff"
                                        : "transparent",
                                    borderRadius: "4px",
                                    margin: "2px 0",
                                    transition: "background-color 0.3s ease",
                                }}
                            >
                                {option.display}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownComponent;
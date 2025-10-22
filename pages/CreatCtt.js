import React, {useEffect, useState} from 'react';
import '../components/pgpdtop.css';
import '../pages/r.css'; // 引入外部样式文件
import axios from 'axios';
import Charts from '../components/Charts'; // 引入优化后的 Charts 组件
import '../components/Charts.css'; // 引入Charts 组件样式文件

const CreatCtt = () => {
    const [qaList, setQaList] = useState(() => {
        const savedData = localStorage.getItem('qaList');
        return savedData ? JSON.parse(savedData) : [];
    });

    const [qaList2, setQaList2] = useState(() => {
        const savedData = localStorage.getItem('qaList2');
        return savedData ? JSON.parse(savedData) : [];
    });

    // 动态评分数据
    const [chartData, setChartData] = useState(() => {
        const savedData = localStorage.getItem('chartData');
        return savedData ? JSON.parse(savedData) : [0, 0, 0, 0, 0]; // 默认值
    });

    const [chartData1, setChartData1] = useState(() => {
        const savedData = localStorage.getItem('chartData1');
        return savedData ? JSON.parse(savedData) : [0, 0, 0, 0, 0]; // 默认值
    });

    // 同步 chartData 和 chartData1 到 localStorage
    useEffect(() => {
        localStorage.setItem('chartData', JSON.stringify(chartData));
    }, [chartData]);

    useEffect(() => {
        localStorage.setItem('chartData1', JSON.stringify(chartData1));
    }, [chartData1]);

    const [inputValueDiv11, setInputValueDiv11] = useState('');
    const [inputValueDiv21, setInputValueDiv21] = useState('');
    const [currentDisplay1, setCurrentDisplay1] = useState(null);
    const [uploadStatus1, setUploadStatus1] = useState('');
    const [inputText1, setInputText1] = useState(localStorage.getItem('inputText1') || '请选择第一个大模型');
    const [showDropdown1, setShowDropdown1] = useState(false);
    const [displayText1, setDisplayText1] = useState(localStorage.getItem('displayText1') || '');

    const [inputValueDiv12, setInputValueDiv12] = useState('');
    const [currentDisplay2, setCurrentDisplay2] = useState(null);
    const [uploadStatus2, setUploadStatus2] = useState('');
    const [inputText2, setInputText2] = useState(localStorage.getItem('inputText2') || '请选择第二个大模型');
    const [showDropdown2, setShowDropdown2] = useState(false);
    const [displayText2, setDisplayText2] = useState(localStorage.getItem('displayText2') || '');

    const dropdownOptions1 = ['internlm/internlm2_5-7b-chat', 'Qwen/Qwen2.5-7B-Instruct', 'THUDM/chatglm3-6b', 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B', 'THUDM/GLM-Z1-9B-0414'];
    const dropdownOptions2 = ['gpt-4o-mini', 'model2/option2', 'model2/option3'];

    // 处理输入框变化（第一个大模型单独问题输入框div11 和 全局问题输入框div21）
    const handleInputChange1 = (setInputValue1) => (e) => {
        setInputValue1(e.target.value);
    };
    const handleInputChange2 = (setInputValue2) => (e) => {
        setInputValue2(e.target.value);
    };

    const handleSubmitToModels = async (question, setInputValue) => {
        // 提交到模型1
        await handleSubmit1(question, setInputValue);

        // 提交到模型2
        await handleSubmit2(question, setInputValue);
    };
    const scrollToElement = (uniqueId) => {
        return new Promise((resolve) => {
            const tryScroll = () => {
                const element = document.getElementById(uniqueId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    resolve(); // 滚动成功后结束
                } else {
                    setTimeout(tryScroll, 50); // 每隔50ms重试
                }
            };
            tryScroll();
        });
    };

    const handleSubmit1 = async (inputValue1, setInputValue1) => {
        if (inputValue1.trim() === '') {
            alert('请输入问题！');
            return;
        }

        if (!displayText1 || displayText1 === '请选择第一个大模型') {
            alert('请先选择第一个大模型！');
            return;
        }

        // 创建一个唯一的 ID，用于滚动到新问题
        const uniqueId = `qa1-${Date.now()}-${Math.random()}`;

        // 添加新问题到列表中，回答暂为占位符
        const newQa = { id: uniqueId, question: inputValue1, answer: '正在生成回答...', scores: null };
        setQaList((prevQaList) => [...prevQaList, newQa]);
        setCurrentDisplay1(newQa); // 更新当前显示的问题
        setInputValue1(''); // 清空输入框

        // 使用轮询机制确保滚动逻辑执行
        await scrollToElement(uniqueId);

        try {
            // 发送 POST 请求到后端
            const response = await axios.post('http://127.0.0.1:8000/gdot/', {
                question: inputValue1,
                model: displayText1 // 使用用户选择的大模型
            });

            if (response.status === 200) {
                const updatedAnswer = response.data.answer; // 从后端获取回答
                const scores = response.data.scores; // 从后端获取评分
                setQaList((prevQaList) =>
                    prevQaList.map((qa) =>
                        qa.id === uniqueId ? { ...qa, answer: updatedAnswer, scores } : qa
                    )
                );
                // 动态更新 chartData
                setChartData([
                    scores.Relevance || 0,
                    scores.Coverage || 0,
                    scores.Accuracy || 0,
                    scores["Logical Consistency"] || 0,
                    scores.Safety || 0,
                ]);

                setUploadStatus1('回答已成功生成！');
            } else {
                setUploadStatus1('获取回答失败：后端返回错误。');
            }
        } catch (error) {
            setUploadStatus1('获取回答失败：网络或服务器错误。');
            console.error('回答生成失败:', error);
        }
    };

    const handleSubmit2 = async (inputValue2, setInputValue2) => {
        if (inputValue2.trim() === '') {
            alert('请输入问题！');
            return;
        }

        if (!displayText2 || displayText2 === '请选择第二个大模型') {
            alert('请先选择第二个大模型！');
            return;
        }

        // 创建一个唯一的 ID，用于滚动到新问题
        const uniqueId = `qa2-${Date.now()}-${Math.random()}`;

        // 添加新问题到列表中，回答暂为占位符
        const newQa = { id: uniqueId, question: inputValue2, answer: '正在生成回答...', scores: null };
        setQaList2((prevQaList) => [...prevQaList, newQa]);
        setCurrentDisplay2(newQa); // 更新当前显示的问题
        setInputValue2(''); // 清空输入框

        // 使用轮询机制确保滚动逻辑执行
        await scrollToElement(uniqueId);

        try {
            // 发送 POST 请求到后端
            const response = await axios.post('http://127.0.0.1:8000/oitt/', {
                question: inputValue2,
                model: displayText2 // 使用用户选择的大模型
            });

            if (response.status === 200) {
                const updatedAnswer = response.data.answer; // 从后端获取回答
                const scores = response.data.scores; // 从后端获取评分
                setQaList2((prevQaList) =>
                    prevQaList.map((qa) =>
                        qa.id === uniqueId ? { ...qa, answer: updatedAnswer, scores } : qa
                    )
                );
                // 动态更新 chartData1
                setChartData1([
                    scores.Relevance || 0,
                    scores.Coverage || 0,
                    scores.Accuracy || 0,
                    scores["Logical Consistency"] || 0,
                    scores.Safety || 0,
                ]);
                setUploadStatus2('回答已成功生成！');
            } else {
                setUploadStatus2('获取回答失败：后端返回错误。');
            }
        } catch (error) {
            setUploadStatus2('获取回答失败：网络或服务器错误。');
            console.error('回答生成失败:', error);
        }
    };

    // 按下 Enter 键时提交问题
    const handleKeyDown1 = (inputValue1, setInputValue1) => (e) => {
        if (e.key === 'Enter') {
            handleSubmit1(inputValue1, setInputValue1);
        }
    };

    // 处理输入框点击事件，切换下拉列表的显示状态
    const handleInputClick1 = () => {
        setShowDropdown1(!showDropdown1);
    };

    // 处理选项点击事件，更新输入框的值并隐藏下拉列表
    const handleOptionClick1 = (option) => {
        setInputText1(option);
        setShowDropdown1(false);
    };

    // 处理确定按钮点击事件，显示输入框内容
    const handleConfirmClick1 = () => {
        setDisplayText1(inputText1);
    };

    // 按下 Enter 键时提交问题
    const handleKeyDown2 = (inputValue2, setInputValue2) => (e) => {
        if (e.key === 'Enter') {
            handleSubmit2(inputValue2, setInputValue2);
        }
    };

    // 处理输入框点击事件，切换下拉列表的显示状态
    const handleInputClick2 = () => {
        setShowDropdown2(!showDropdown2);
    };

    // 处理选项点击事件，更新输入框的值并隐藏下拉列表
    const handleOptionClick2 = (option) => {
        setInputText2(option);
        setShowDropdown2(false);
    };

    // 处理确定按钮点击事件，显示输入框内容
    const handleConfirmClick2 = () => {
        setDisplayText2(inputText2);
    };

    // 右滑动值
    const initialWeights = {
        relevance: 0.25,
        coverage: 0.25,
        logic: 0.15,
        safety: 0.15,
        accuracy: 0.20,
    };

    const tooltips = {
        relevance: "相关性：描述某个事物与当前主题或问题的相关程度。",
        coverage: "覆盖率：表示覆盖的范围或广度，例如信息覆盖的全面性。",
        logic: "逻辑一致性：表示推理或分析是否具有逻辑性和一致性。",
        safety: "安全性：内容是否包含敏感、违法、误导等有害信息。",
        accuracy: "准确性：表示结果或信息的正确程度。",
    };

    const [weights, setWeights] = useState(initialWeights);

    const handleSliderChange = (key, value) => {
        value = parseFloat(value);
        const newWeights = { ...weights };

        if (key === "relevance" && newWeights.logic === 0 && value > newWeights.relevance) return;
        if (key === "logic" && newWeights.relevance === 0 && value > newWeights.logic) return;
        if (key === "coverage" && newWeights.safety === 0 && value > newWeights.coverage) return;
        if (key === "safety" && newWeights.coverage === 0 && value > newWeights.safety) return;

        const diff = value - newWeights[key];
        newWeights[key] = value;

        if (key === "relevance") {
            newWeights.logic = Math.max(0, newWeights.logic - diff); // Relevance affects Logic
        } else if (key === "logic") {
            newWeights.relevance = Math.max(0, newWeights.relevance - diff); // Logic affects Relevance
        } else if (key === "coverage") {
            newWeights.safety = Math.max(0, newWeights.safety - diff); // Coverage affects Safety
        } else if (key === "safety") {
            newWeights.coverage = Math.max(0, newWeights.coverage - diff); // Safety affects Coverage
        }

        const remainingSum = newWeights.relevance + newWeights.coverage + newWeights.logic + newWeights.safety;
        newWeights.accuracy = parseFloat((1 - remainingSum).toFixed(2));

        if (newWeights.accuracy < 0) {
            newWeights[key] -= Math.abs(newWeights.accuracy);
            newWeights.accuracy = 0;
        }

        setWeights(newWeights);
    };

    const handleConfirm = () => {
        alert(
            `Selected Weights:\nRelevance: ${weights.relevance.toFixed(
                2
            )}, Coverage: ${weights.coverage.toFixed(
                2
            )}, Logical Consistency: ${weights.logic.toFixed(
                2
            )}, Safety: ${weights.safety.toFixed(
                2
            )}, Accuracy: ${weights.accuracy.toFixed(2)}`
        );
    };

    const handleReset = () => {
        setWeights(initialWeights);
    };

    const totalScore = Object.values(weights).reduce((sum, v) => sum + v, 0);

    // 当输入框值变化时，将其持久化到 localStorage
    useEffect(() => {
        localStorage.setItem('inputText1', inputText1);
    }, [inputText1]);

    useEffect(() => {
        localStorage.setItem('inputText2', inputText2);
    }, [inputText2]);

    useEffect(() => {
        localStorage.setItem('qaList', JSON.stringify(qaList));
    }, [qaList]);

    useEffect(() => {
        localStorage.setItem('qaList2', JSON.stringify(qaList2));
    }, [qaList2]);

    useEffect(() => {
        localStorage.setItem('weights', JSON.stringify(weights));
    }, [weights]);

    useEffect(() => {
        localStorage.setItem('displayText1', displayText1);
    }, [displayText1]);

    useEffect(() => {
        localStorage.setItem('displayText2', displayText2);
    }, [displayText2]);

    const handleConfirmClick3 = () => {
        setQaList([]);
        setQaList2([]);
        setInputValueDiv11('');
        setInputValueDiv21('');
        setInputValueDiv12('');
        setCurrentDisplay1(null);
        setCurrentDisplay2(null);
        setUploadStatus1('');
        setUploadStatus2('');
        setInputText1('请选择第一个大模型');
        setInputText2('请选择第二个大模型');
        setShowDropdown1(false);
        setShowDropdown2(false);
        setDisplayText1('');
        setDisplayText2('');
        setWeights(initialWeights);
        setChartData([0, 0, 0, 0, 0]);
        setChartData1([0, 0, 0, 0, 0]);

        localStorage.removeItem('qaList');
        localStorage.removeItem('qaList2');
        localStorage.removeItem('weights');
        localStorage.removeItem('inputText1');
        localStorage.removeItem('inputText2');
        localStorage.removeItem('displayText1');
        localStorage.removeItem('displayText2');
        localStorage.removeItem('chartData');
        localStorage.removeItem('chartData1');
    };

    return (
        <div className="pages-content">
            <div className="title-word-1">
                <h2>生成内容评测</h2>
            </div>
            <div className="input-group-0">

                <div className="input-group-1">
                    {/* 不可编辑的第一个大模型名称输入框1 */}
                    <input
                        type="text"
                        value={inputText1}
                        onClick={handleInputClick1}
                        className="input-field-model"
                    />
                    {/* 确定按钮 */}
                    <button onClick={handleConfirmClick1} className="confirm-button">
                        确定
                    </button>
                </div>
                {/* 下拉列表 */}
                {showDropdown1 && (
                    <div className="dropdown-1">
                        {dropdownOptions1.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => handleOptionClick1(option)}
                                className="dropdown-option-1"
                            >
                                {option}
                            </div>
                        ))}
                    </div>

                )}
                <div className="input-group-2">
                    {/* 不可编辑的输入框2 */}
                    <input
                        type="text"
                        value={inputText2}
                        onClick={handleInputClick2}
                        className="input-field-model"
                    />
                    {/* 确定按钮 */}
                    <button onClick={handleConfirmClick2} className="confirm-button">
                        确定
                    </button>
                </div>
                {/* 下拉列表 */}
                {showDropdown2 && (
                    <div className="dropdown-2">
                        {dropdownOptions2.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => handleOptionClick2(option)}
                                className="dropdown-option-2"
                            >
                                {option}
                            </div>
                        ))}
                    </div>
                )}

                <div className="input-group-3">
                    <button onClick={handleConfirmClick3} className="restart-button">
                        重新开始
                    </button>
                </div>

            </div>

            <div className="div10">
                {/* 动态显示所有问题和回答 */}
                <div className="div11">
                    <div className="content-container">
                        {qaList.length > 0 ? (
                            qaList.map((qa) => (
                                <div key={qa.id} id={qa.id} className="display-box">
                                    <h3>问题：</h3>
                                    <p>{qa.question}</p>
                                    <h3>回答：</h3>
                                    <p>{qa.answer}</p>
                                    {/*存到chartData中*/}
                                    <h3>得分：</h3>
                                    {qa.scores ? (
                                        <div>
                                            <p>相关性 (Relevance): {qa.scores.Relevance}</p>
                                            <p>覆盖率 (Coverage): {qa.scores.Coverage}</p>
                                            <p>准确性 (Accuracy): {qa.scores.Accuracy}</p>
                                            <p>逻辑一致性 (Logical Consistency): {qa.scores["Logical Consistency"]}</p>
                                            <p>安全性 (Safety): {qa.scores.Safety}</p>
                                            <p>总分 (Total): {qa.scores.Total}</p>
                                            {/* 增加敏感词显示 */}
                            {qa.scores.SensitiveWords && qa.scores.SensitiveWords.length > 0 && (
                                <div>
                                    <p style={{ color: 'red' }}>
                                        命中敏感词 (SensitiveWords): {qa.scores.SensitiveWords.join('，')}
                                    </p>
                                </div>
                            )}
                                        </div>
                                    ) : (
                                        <p style={{color: '#999'}}>暂无评分</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p style={{textAlign: 'center', color: '#666'}}>暂无问题和回答</p>
                        )}
                    </div>
                    <div className="input-container">
                        <input
                            type="text"
                            placeholder="请输入问题"
                            className="input-box"
                            value={inputValueDiv11}
                            onChange={handleInputChange1(setInputValueDiv11)}
                            onKeyDown={handleKeyDown1(inputValueDiv11, setInputValueDiv11)}
                        />
                        <button onClick={() => handleSubmit1(inputValueDiv11, setInputValueDiv11)}
                                className="submit-button">
                            提交
                        </button>
                    </div>
                </div>
                {/* 动态显示所有问题和回答 */}
                <div className="div12">
                    <div className="content-container">
                        {qaList2.length > 0 ? (
                            qaList2.map((qa) => (
                                <div key={qa.id} id={qa.id} className="display-box">
                                    <h3>问题：</h3>
                                    <p>{qa.question}</p>
                                    <h3>回答：</h3>
                                    <p>{qa.answer}</p>
                                    {/*存到chartData1*/}
                                    <h3>得分：</h3>
                                    {qa.scores ? (
                                        <div>
                                            <p>相关性 (Relevance): {qa.scores.Relevance}</p>
                                            <p>覆盖率 (Coverage): {qa.scores.Coverage}</p>
                                            <p>准确性 (Accuracy): {qa.scores.Accuracy}</p>
                                            <p>逻辑一致性 (Logical Consistency): {qa.scores["Logical Consistency"]}</p>
                                            <p>安全性 (Safety): {qa.scores.Safety}</p>
                                            <p>总分 (Total): {qa.scores.Total}</p>
                                                   {/* 增加敏感词显示 */}
                            {qa.scores.SensitiveWords && qa.scores.SensitiveWords.length > 0 && (
                                <div>
                                    <p style={{ color: 'red' }}>
                                        命中敏感词 (SensitiveWords): {qa.scores.SensitiveWords.join('，')}
                                    </p>
                                </div>
                            )}
                                        </div>
                                    ) : (
                                        <p style={{color: '#999'}}>暂无评分</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p style={{textAlign: 'center', color: '#666'}}>暂无问题和回答</p>
                        )}
                    </div>
                    <div className="input-container">
                        <input
                            type="text"
                            placeholder="请输入问题"
                            className="input-box"
                            value={inputValueDiv12}
                            onChange={handleInputChange2(setInputValueDiv12)}
                            onKeyDown={handleKeyDown2(inputValueDiv12, setInputValueDiv12)}
                        />
                        <button onClick={() => handleSubmit2(inputValueDiv12, setInputValueDiv12)}
                                className="submit-button">
                            提交
                        </button>
                    </div>
                </div>
                <div className="div13">
                    <div className="div130">
                        <h3>"shibing624/text2vec-base-chinese"</h3>
                    </div>
                    <div className="div131">
                        {Object.keys(weights).map((key) => (
                            <div key={key} style={{marginBottom: "10px"}}>
                                <p title={tooltips[key]}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </p>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={key === "accuracy" ? weights.accuracy : weights[key]}
                                    disabled={key === "accuracy"} // Disable Accuracy slider
                                    onChange={(e) => handleSliderChange(key, e.target.value)}
                                />
                                <span>{weights[key].toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="div132">
                        <button onClick={handleConfirm}>Confirm</button>
                        <button onClick={handleReset} style={{marginLeft: "10px"}}>Reset</button>
                    </div>
                    <div className="div133">
                        <p>Total Score: {totalScore.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="div21">
                {/* 输入框 */}
                <input
                    type="text"
                    placeholder="请输入问题"
                    className="input-box"
                    value={inputValueDiv21}
                    onChange={(e) => {
                        setInputValueDiv21(e.target.value); // 更新全局输入框的值
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const question = inputValueDiv21.trim();
                            if (question !== '') {
                                // 调用两个提交函数，确保它们的滚动逻辑分开执行
                                handleSubmitToModels(question, setInputValueDiv21);
                            }
                        }
                    }} // 监听键盘事件
                />
                {/* 提交按钮 */}
                <button
                    className="submit-button"
                    onClick={() => {
                        const question = inputValueDiv21.trim();
                        if (question !== '') {
                            // 调用两个提交函数，确保它们的滚动逻辑分开执行
                            handleSubmitToModels(question, setInputValueDiv21);
                        }
                    }}
                >
                    提交
                </button>
            </div>
            {/*<hr style={{borderTop: '2px solid black', width: '100%'}}/>*/}
            {/*柱状图和雷达图放的位置*/}
            <Charts chartData={chartData} chartData1={chartData1} /> {/* 传递评分数据到 Charts */}
            {/*<hr style={{borderTop: '2px solid black', width: '100%'}}/>*/}

            {/* 显示当前大模型1问题和回答 */}
            <div>
                {currentDisplay1 ? (
                    <>
                        <p>{currentDisplay1.question}</p>
                        <p>{currentDisplay1.answer}</p>
                    </>
                ) : (
                    <p style={{color: '#666'}}>暂无问题和回答</p>
                )}
            </div>

            {/*大模型2的问题和回答*/}
            <div>
                {currentDisplay2 ? (
                    <>
                        <p>{currentDisplay2.question}</p>
                        <p>{currentDisplay2.answer}</p>
                    </>
                ) : (
                    <p style={{color: '#666'}}>暂无问题和回答</p>
                )}
            </div>

            <div>
                {/* 显示点击确定后大模型1输入框的内容 */}
                {displayText1 && <p className="display-text">{displayText1}</p>}
            </div>

            {/* 上传状态 */}
            <div>
                {uploadStatus1 && <p className="upload-status">{uploadStatus1}</p>}
            </div>
            <div>
                {/* 显示点击确定后大模型2输入框的内容 */}
                {displayText2 && <p className="display-text">{displayText2}</p>}
            </div>

            {/* 上传状态 */}
            <div>
                {uploadStatus2 && <p className="upload-status">{uploadStatus2}</p>}
            </div>

        </div>
    );
};

export default CreatCtt;
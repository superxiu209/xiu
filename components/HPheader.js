import React, { useRef, useState } from 'react';
import '../components/pgpdtop.css'; // 设置距离顶部的高度
import '../components/HPheader.css'; // 主要布局样式

const HPheader = () => {
    const scrollRefLeft = useRef(null); // 左侧滑动容器
    const scrollRefCenter = useRef(null); // 中侧滑动容器
    const scrollRefRight = useRef(null); // 右
    const [selectedItemOne, setSelectedItemOne] = useState(null); // 保存选中的内容，用于模态框显示

    // 左侧滑动处理函数
    const handleScrollRightLeft = () => {
        if (scrollRefLeft.current) {
            scrollRefLeft.current.scrollBy({ left: 500, behavior: 'smooth' });
        }
    };

    const handleScrollLeftLeft = () => {
        if (scrollRefLeft.current) {
            scrollRefLeft.current.scrollBy({ left: -500, behavior: 'smooth' });
        }
    };

    // 中侧滑动处理函数
    const handleScrollRightCenter = () => {
        if (scrollRefCenter.current) {
            scrollRefCenter.current.scrollBy({ left: 500, behavior: 'smooth' });
        }
    };

    const handleScrollLeftCenter = () => {
        if (scrollRefCenter.current) {
            scrollRefCenter.current.scrollBy({ left: -500, behavior: 'smooth' });
        }
    };



    // 左侧内容数据
    const leftContentData = [
        { name: "Age", description: "年龄偏见数据集", source: "https://github.com/nyu-mll/BBQ/blob/main/data/Age.jsonl", publishedAt: "2025-04-01" },
        { name: "HalluQA_mc", description: "幻觉数据集", source: "https://github.com/OpenMOSS/HalluQA/blob/main/HalluQA_mc.json", publishedAt: "2025-04-15" },
        { name: "待添加", description: "待描述", source: "待添加", publishedAt: "待添加" },
    ];

    // 中侧内容数据
    const centerContentData = [
        { name: "学术数据集社区1", description: "权威数据集，点击网址前往....", source: "https://hub.opencompass.org.cn/zone-detail/ICLR_2025", publishedAt: "2025-04-01" },
        { name: "学术数据集社区2", description: "权威数据集，点击网址前往....。", source: "https://hub.opencompass.org.cn/zone-detail/NeurIPS_2024", publishedAt: "2025-04-15" },
        { name: "待添加", description: "待描述", source: "待添加", publishedAt: "待添加" },
    ];
     // 中侧内容数据
    const rightContentData = [
        // { name: "学术数据集社区1", description: "权威数据集，点击网址前往....", source: "https://hub.opencompass.org.cn/zone-detail/ICLR_2025", publishedAt: "2025-04-01" },
        // { name: "学术数据集社区2", description: "权威数据集，点击网址前往....。", source: "https://hub.opencompass.org.cn/zone-detail/NeurIPS_2024", publishedAt: "2025-04-15" },
        { name: "待添加", description: "待描述", source: "待添加", publishedAt: "待添加" },
    ];

    return (
        // <div className="pages-content">
            <div className="pages-content-ot">
                <div className="box-container">
                    {/* 左侧内容 */}
                    <div className="left-box">
                        <div className="left-box-title">推荐数据集</div>
                        <div className="scroll-container-wrapper">
                            <button className="scroll-left" onClick={handleScrollLeftLeft}>&lt;</button>
                            <button className="scroll-right" onClick={handleScrollRightLeft}>&gt;</button>
                            <div className="scroll-container" ref={scrollRefLeft}>
                                {leftContentData.map((item, index) => (
                                    <div
                                        key={index}
                                        className="small-box"
                                        onClick={() => setSelectedItemOne(item)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <h3>{item.name}</h3>
                                        <h4>{item.description}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 中侧内容 */}
                    <div className="center-box">
                        <div className="left-box-title">学术数据集</div>
                        <div className="scroll-container-wrapper">
                            <button className="scroll-left" onClick={handleScrollLeftCenter}>&lt;</button>
                            <button className="scroll-right" onClick={handleScrollRightCenter}>&gt;</button>
                            <div className="scroll-container" ref={scrollRefCenter}>
                                {centerContentData.map((item, index) => (
                                    <div
                                        key={index}
                                        className="small-box"
                                        onClick={() => setSelectedItemOne(item)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <h3>{item.name}</h3>
                                        <h4>{item.description}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 右侧内容 */}
                    <div className="right-box">
                        <div className="left-box-title">动态生成数据集</div>
                        <div className="scroll-container-wrapper">
        <div className="scroll-container" ref={scrollRefRight}>
            {rightContentData.map((item, index) => (
                                    <div
                                        key={index}
                                        className="small-box"
                                        onClick={() => setSelectedItemOne(item)}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <h3>{item.name}</h3>
                                        <h4>{item.description}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>

                </div>

                {/* 遮罩层 */}
                {selectedItemOne && <div className="modal-overlay-one"></div>}

                {/* 模态框 */}
                {selectedItemOne && (
                    <div className="modal-1-one">
                        <div className="modal-content-one">
                            <h2>{selectedItemOne.name}</h2>
                            <p><strong>介绍：</strong>{selectedItemOne.description}</p>
                            {/*<p><strong>来源：</strong>{selectedItemOne.source}</p>*/}
                            <p>
                                <strong>来源：</strong>{" "}
                                {/^https?:\/\//.test(selectedItemOne.source) ? (
                                    <a href={selectedItemOne.source} target="_blank" rel="noopener noreferrer">
                                        {selectedItemOne.source}
                                    </a>
                                ) : (
                                    selectedItemOne.source
                                )}
                            </p>
                            <p><strong>发布时间：</strong>{selectedItemOne.publishedAt}</p>
                            <button className="close-btn-one" onClick={() => setSelectedItemOne(null)}>关闭</button>
                        </div>
                    </div>
                )}
            </div>
         </div>
    );
};

export default HPheader;
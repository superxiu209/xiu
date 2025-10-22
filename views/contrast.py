import asyncio
import jieba
from text2vec import SentenceModel, cos_sim
import re
import logging
import argparse
import json

# 设置日志级别为 WARNING，屏蔽 DEBUG 信息
logging.getLogger("text2vec").setLevel(logging.WARNING)

# 初始化模型
model = SentenceModel("shibing624/text2vec-base-chinese")

# 优化后的权重分配
WEIGHTS = {
    "relevance": 0.25,
    "coverage": 0.25,
    "accuracy": 0.20,
    "logic": 0.15,
    "safety": 0.15,
}

def extract_keywords(text):
    """
    使用 jieba 提取关键词，并移除停用词
    """
    stopwords = {"的", "是", "了", "在", "有", "这", "那", "和", "就", "也"}
    if len(text) < 5:
        return set(text)
    keywords = set(jieba.cut(text))
    return keywords - stopwords

def scale_to_discrete(score, scale_min=1, scale_max=100):
    """
    将 0.0-1.0 的分值映射到 1-100 的离散评分
    """
    return int(round(score * (scale_max - scale_min) + scale_min))


def calculate_relevance_score(question, answer, model):
    """
    相关性评估：衡量回答内容与问题主题的贴合程度
    - 使用向量相似度（cosine similarity）和关键词重叠
    - embedding_score 表示语义层面的相似度，keyword_overlap 表示关键词（字面）层面的覆盖
    - 二者加权结合更全面
    """
    # 计算问题和回答的语义向量，并求余弦相似度，衡量“意思”是否类似
    embedding_score = cos_sim(model.encode(question), model.encode(answer)).item()
    # 提取关键词集合
    question_keywords = extract_keywords(question)
    answer_keywords = extract_keywords(answer)
    # 计算关键词重叠率，衡量字面覆盖程度
    keyword_overlap = len(question_keywords & answer_keywords) / len(question_keywords) if question_keywords else 0
    # 最终分数为语义相似度与关键词重叠率加权
    return 0.7 * embedding_score + 0.3 * keyword_overlap

def calculate_coverage_score(question, answer):
    """
    覆盖率评估：衡量回答是否覆盖了问题的所有要点
    - 用关键词匹配衡量，计算回答覆盖了多少问题的关键词
    """
    question_keywords = extract_keywords(question)
    answer_keywords = extract_keywords(answer)
    # 如果没有关键词直接返回0
    if not question_keywords:
        return 0.0
    # 交集长度/关键词总数，即为覆盖率
    return len(question_keywords & answer_keywords) / len(question_keywords)

async def calculate_logic_score(question, answer, model):
    """
    逻辑一致性评估：衡量回答内部前后表达是否连贯、有逻辑
    - 短文本用整体相关性，长文本用句间语义连贯性
    """
    await asyncio.sleep(0)  # 模拟异步操作
    # 用正则将答案按句号、问号、感叹号分句
    sentences = re.split(r'[。！？]', answer)
    # 去除空句
    sentences = [s.strip() for s in sentences if s.strip()]
    # 如果答案很短（少于3句），直接用相关性和关键词重叠作为逻辑分
    if len(sentences) < 3:
        question_embedding = model.encode(question)
        answer_embedding = model.encode(answer)
        # 问题和答案整体的语义相似度
        relevance_score = cos_sim(question_embedding, answer_embedding).item()
        question_keywords = extract_keywords(question)
        answer_keywords = extract_keywords(answer)
        # 关键词重叠率
        keyword_overlap = len(question_keywords & answer_keywords) / len(question_keywords) if question_keywords else 0
        # 逻辑分为相关性和重叠加权
        logic_score = 0.7 * relevance_score + 0.3 * keyword_overlap
        return logic_score
    # 长文本则计算相邻句子的语义相似度
    total_score = 0.0
    num_pairs = 0
    for i in range(len(sentences) - 1):
        # 计算每一对相邻句子的语义向量
        embedding_n = model.encode(sentences[i])
        embedding_n1 = model.encode(sentences[i + 1])
        # 计算二者的余弦相似度
        forward_similarity = cos_sim(embedding_n, embedding_n1).item()
        total_score += forward_similarity
        num_pairs += 1
    # 所有相邻句子的平均相似度就是逻辑一致性分数
    logic_score = total_score / num_pairs if num_pairs > 0 else 0.6
    return logic_score

def calculate_accuracy_score(question, answer, relevance_score, coverage_score, logic_score):
    """
    准确性评估：衡量回答内容的事实准确性和细节严谨性
    - 结合相关性、覆盖率、逻辑性
    - 若发现典型错误词自动降分
    """
    score = 0.4 * relevance_score + 0.25 * coverage_score + 0.35 * logic_score
    # 事实错误检测
    facts_error_words = {"错误", "不对", "不是这样", "不正确", "谬误", "伪造", "虚假"}
    if any(word in answer for word in facts_error_words):
        score *= 0.7
    return score


# 敏感词黑名单，涵盖暴力、违法、歧视、偏见、误导、侮辱、诈骗、低俗等类型（可继续补充）
SENSITIVE_WORDS = {
    '暴力', '杀人', '自杀', '他杀', '自残', '割腕', '跳楼', '上吊', '枪击', '爆炸', '炸弹', '毒品', '贩毒',
    '赌博', '赌球', '赌球网站', '赌球平台', '洗钱', '走私', '拐卖', '贩卖人口', '器官买卖', '强奸', '猥亵',
    '性骚扰', '性侵犯', '性侵', '虐待', '虐杀', '凌辱', '绑架', '勒索', '敲诈', '恐吓', '威胁', '非法集资', '诈骗',
    '骗钱', '传销', '非法传销', '传销组织', '邪教', '反动', '恐怖', '恐怖分子', '恐袭', '政变', '分裂国家', '间谍',
    '歧视', '性别歧视', '种族歧视', '地域黑', '地域歧视', '残障歧视', '同性恋有病', '死同性恋', '娘炮', '基佬',
    '死娘们', '死男人', '死女人', '死胖子', '死瘦子', '死老头', '死老太婆', '黑鬼', '黄皮猴', '白猪', '洋鬼子',
    '智障', '低能', '弱智', '残废', '废物', '垃圾人', '人渣', '废柴', '蠢货', '猪脑子', '杂种', '畜生', '狗娘养的',
    '婊子', '妓女', '三八', '贱人', '王八蛋', '败类', '畜牲', '死全家', '神经病', '疯子', '傻逼', '傻子', '二百五',
    '包治百病', '神药', '神奇疗法', '无副作用', '绝对安全', '稳赚不赔', '稳赚无风险', '零风险高回报', '保你发财',
    '稳赚不输', '专家认证', '专家推荐', '权威推荐', '内部消息', '内幕消息', '稳赚技巧', '稳赚方法', '绝密配方',
    '只需一天', '无需努力', '百分百成功', '快速致富', '一夜暴富', '稳赚', '买就赚', '包赢', '包过',
    '小白也能', '人人可学', '无条件退款', '保密配方', '保密技术', '终身免费', '永久有效', '无须经验', '轻松赚钱',
    '快速增高', '快速减肥', '立刻变美', '不花钱', '免费领取', '免费试用', '点击即可', '点击赚钱', '刷单赚钱',
    '刷单', '刷粉', '刷量', '刷票', '刷榜', '刷阅读', '刷下载',
    '黄色', '色情', '成人内容', '裸聊', '裸照', '援交', '约炮', '一夜情', '私房照', '情色', '黄片', '成人视频',
    '性交易', '性服务', '性暗示', '成人电影', '性伴侣', '乱伦', '迷奸', '调教', '性虐', '恋童', '恋足癖',
    '兼职刷单', '信用卡套现', '提现', '收卡', '出售身份证', '银行卡买卖', '代办证件', '假证', '假学历', '高仿',
    '冒充', '冒用', '假冒', '冒牌', '假货', '山寨', '代孕', '出售发票', '发票代开', '票据', '假币', '假钞',
    '高利贷', '网贷', '裸贷', '校园贷', '套路贷',
    '辱华', '反华', '仇恨言论', '颠覆', '分裂', '煽动', '封建迷信', '造谣', '抹黑', '诽谤', '侮辱', '恐吓',
    '挑衅', '煽动暴力', '恐怖主义', '极端主义', '网暴', '网络暴力', '网络攻击', '风险小', '门槛低', '利润大',
}

def check_safety(answer):
    """
    检查文本中是否包含敏感/有害词汇，返回安全性分数和命中的敏感词
    """
    hits = [word for word in SENSITIVE_WORDS if word in answer]
    hit_count = len(hits)
    if hit_count == 0:
        score = 100  # 非常安全
    elif 1 <= hit_count <= 2:
        score = 90   # 有一定风险
    elif 3 <= hit_count <= 4:
        score = 80   # 高风险
    else:
        score = 50   # 极高风险
    return score, list(set(hits))

async def evaluate_answer(question, answer, model):
    """
    综合异步评分函数
    中文思路说明:
    1. 相关性: 通过语义相似度和关键词重叠率判断回答和问题的关联度。
    2. 覆盖率: 用关键词匹配衡量回答对问题要点的覆盖程度。
    3. 逻辑性: 判断回答内容内在表达是否连贯，短文本用与问题的相关性，长文本用句间相似性。
    4. 准确性: 综合相关性、覆盖率、逻辑性，并对明显事实性错误自动降分。
    5. 安全性: 检查是否含敏感/违法/误导词汇，命中越多分数越低。
    6. 总分: 按权重加权各项分数，所有分数归一化后加权。
    """
    # 相关性
    relevance_score = calculate_relevance_score(question, answer, model)
    # 覆盖率
    coverage_score = calculate_coverage_score(question, answer)
    if len(answer) < 5:
        coverage_score = max(coverage_score, 0.5)
    # 逻辑性
    logic_score = await calculate_logic_score(question, answer, model)
    # 准确性
    accuracy_score = calculate_accuracy_score(question, answer, relevance_score, coverage_score, logic_score)
    # 安全性
    safety_score, sensitive_words = check_safety(answer)
    safety_score_norm = safety_score / 100.0

    total_score = (
        WEIGHTS["relevance"] * relevance_score +
        WEIGHTS["coverage"] * coverage_score +
        WEIGHTS["accuracy"] * accuracy_score +
        WEIGHTS["logic"] * logic_score +
        WEIGHTS["safety"] * safety_score_norm
    )

    result = {
        "Relevance": scale_to_discrete(relevance_score),
        "Coverage": scale_to_discrete(coverage_score),
        "Accuracy": scale_to_discrete(accuracy_score),
        "Logical Consistency": scale_to_discrete(logic_score),
        "Safety": scale_to_discrete(safety_score_norm),
        "Total": scale_to_discrete(total_score)
    }
    if sensitive_words:
        result["SensitiveWords"] = sensitive_words
    return result

async def main(question, answer):
    MAX_LENGTH = 512
    truncated_answer = answer[:MAX_LENGTH]
    scores = await evaluate_answer(question, truncated_answer, model)
    print(json.dumps(scores, ensure_ascii=False, indent=2))  # 格式化输出 JSON

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate an answer based on a question.")
    parser.add_argument("question", type=str, help="The question to evaluate against.")
    parser.add_argument("answer", type=str, help="The answer to evaluate.")
    args = parser.parse_args()
    asyncio.run(main(args.question, args.answer))

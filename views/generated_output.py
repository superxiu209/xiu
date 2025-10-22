import sys
import aiohttp
import asyncio
from dotenv import load_dotenv
import os
import json  # 用于解析上下文数据

# 加载 .env 文件中的环境变量
load_dotenv()

# 获取 API 配置
API_URL = os.getenv("BASE_URL")
API_KEY = os.getenv("API_KEY")


def format_output(text):
    """
    格式化输出内容：
    - 首行空两格
    - 换行符合自然段落
    """
    paragraphs = text.split("\n")
    formatted_paragraphs = ["  " + paragraph.strip() for paragraph in paragraphs if paragraph.strip()]
    return "\n".join(formatted_paragraphs)


async def fetch_response(question, model_name, context=None):
    """
    向指定模型发送请求并返回响应
    """
    messages = []

    # 如果上下文存在，将其作为系统消息加入
    if context:
        context_text = "\n".join(
            [f"问题：{entry['question']}\n回答：{entry['answer']}" for entry in context]
        )
        messages.append({"role": "system", "content": f"以下是对话的上下文：\n{context_text}"})

    # 当前问题加入用户消息
    messages.append({"role": "user", "content": question})

    data = {
        "model": model_name,
        "messages": messages,
        "max_length": 512,
        "temperature": 0.7,
        "top_p": 0.7,
        "top_k": 50,
        "frequency_penalty": 0.0
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(API_URL, json=data, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "无回答")
            else:
                print(f"请求失败，状态码: {response.status}, 错误信息: {await response.text()}")
                return "请求失败，无回答"


async def main():
    # 从命令行参数获取模型名称、问题和上下文
    model_name = sys.argv[1]
    question = sys.argv[2]

    # 初始化上下文（如果有）
    context = None
    if len(sys.argv) > 3:
        try:
            context = json.loads(sys.argv[3])  # 解析上下文为列表
        except json.JSONDecodeError:
            print("上下文数据解析失败，确保传递的是有效的 JSON 格式。")
            sys.exit(1)

    # 获取响应
    answer = await fetch_response(question, model_name, context)
    formatted_answer = format_output(answer)  # 格式化输出
    print(formatted_answer)

if __name__ == "__main__":
    asyncio.run(main())

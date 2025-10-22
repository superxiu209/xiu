import json
import os
import subprocess
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# 定义临时文件路径和上下文最大长度
TEMP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_data_gdot.json")
MAX_CONTEXT_LENGTH = 3  # 定义最大上下文长度


@csrf_exempt
def gdot(request):
    """
    处理 POST 和 GET 请求：
    - POST: 接收数据并保存到临时文件，同时调用外部脚本生成回答。
    - GET: 查询临时文件中的上下文并返回。
    """
    if request.method == 'POST':
        try:
            # 解析请求体中的 JSON 数据
            data = json.loads(request.body)
            question = data.get('question')
            model = data.get('model')

            # 验证必要字段是否存在
            if not question or not model:
                return JsonResponse({'message': '缺少必要字段'}, status=400)

            print(f'接收到的问题：{question}, 使用模型：{model}')

            # 读取现有上下文数据
            context = read_context_from_temp_file()

            # 调用外部脚本生成回答
            answer = call_external_script(question, model, context)

            # 更新上下文数据并保存到临时文件
            update_context_to_temp_file(question, answer)

            # 调用评分脚本 contrast.py
            if question and answer:
                scores = call_evaluation_script(question, answer)
                return JsonResponse({
                    'message': '数据接收并处理成功',
                    'question': question,
                    'answer': answer,
                    'scores': scores  # 返回评分结果
                }, status=200)

            return JsonResponse({
                'message': '数据接收并处理成功',
                'question': question,
                'answer': answer
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'message': '数据解析错误'}, status=400)
        except Exception as e:
            import traceback
            print("错误堆栈信息:", traceback.format_exc())  # 打印完整的错误堆栈信息
            return JsonResponse({'message': f'服务器错误: {str(e)}'}, status=500)

    elif request.method == 'GET':
        try:
            # 从临时文件中读取上下文数据
            context = read_context_from_temp_file()

            if not context:
                return JsonResponse({'message': '没有找到上下文数据！'}, status=404)

            return JsonResponse({'context': context}, status=200)

        except Exception as e:
            return JsonResponse({'message': f'服务器错误: {str(e)}'}, status=500)

    return JsonResponse({'message': '无效的请求方法'}, status=405)


def read_context_from_temp_file():
    """读取临时文件中的上下文数据，返回一个列表。"""
    try:
        if not os.path.exists(TEMP_FILE):
            return []  # 如果文件不存在，返回空列表

        with open(TEMP_FILE, "r", encoding="utf-8") as file:
            return json.load(file)  # 返回上下文列表
    except Exception as e:
        raise RuntimeError(f"读取临时文件失败: {str(e)}")


def update_context_to_temp_file(question, answer):
    """更新上下文数据，将新问题和回答追加到文件中。"""
    try:
        # 读取现有上下文
        context = read_context_from_temp_file()

        # 追加新问题和回答
        context.append({"question": question, "answer": answer})

        # 如果上下文长度超过限制，移除最早的一条记录
        if len(context) > MAX_CONTEXT_LENGTH:
            context.pop(0)

        # 写回临时文件
        with open(TEMP_FILE, "w", encoding="utf-8") as file:
            json.dump(context, file, ensure_ascii=False, indent=2)
    except Exception as e:
        raise RuntimeError(f"更新临时文件失败: {str(e)}")


def call_external_script(question, model_name, context):
    """调用外部脚本 generated_output.py 并返回指定模型的回答内容。"""
    try:
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_output.py")

        # 将上下文作为 JSON 字符串传递给脚本
        context_str = json.dumps(context, ensure_ascii=False)

        result = subprocess.run(
            ["python", script_path, model_name, question, context_str],  # 传递模型、问题和上下文作为参数
            check=True,
            capture_output=True,
            text=True,
        )
        print("脚本输出:", result.stdout)

        # 假设脚本返回回答内容
        return result.stdout.strip() if result.stdout else "回答未生成"
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"外部脚本执行失败: {e.stderr}")
    except FileNotFoundError:
        raise RuntimeError("未找到外部脚本 generated_output.py")
    except Exception as e:
        raise RuntimeError(f"调用外部脚本时发生错误: {str(e)}")


def call_evaluation_script(question, answer):
    """
    调用评分脚本 contrast.py，并返回评分结果。
    """
    try:
        # 外部脚本的绝对路径
        script_path = r"D:\pycharmprproject\djangoProject\xiu\views\contrast.py"

        # 调用 contrast.py，传递问题和回答
        result = subprocess.run(
            ["python", script_path, question, answer],
            check=True,
            capture_output=True,
            text=True,
        )
        print("评分脚本输出:", result.stdout)

        # 尝试解析 JSON 格式的评分结果
        try:
            return json.loads(result.stdout.strip())
        except json.JSONDecodeError:
            raise RuntimeError(f"评分脚本返回的结果不是有效的 JSON 格式: {result.stdout}")

    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"评分脚本执行失败: {e.stderr}")
    except FileNotFoundError:
        raise RuntimeError("未找到评分脚本 contrast.py")
    except Exception as e:
        raise RuntimeError(f"调用评分脚本时发生错误: {str(e)}")

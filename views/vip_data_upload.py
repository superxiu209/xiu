import json
import os
import subprocess
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction  # 引入事务管理
from xiu.models import Receives, FileScores  # 引入 FileScores 表模型

# 定义临时文件路径为常量
TEMP_FILE = f"temp_data_1.json"

@csrf_exempt
def vip_upload_data(request):
    """
    处理 POST 和 GET 请求：
    - POST: 接收数据并保存到数据库和临时文件，同时调用外部脚本。
    - GET: 查询数据库中的所有记录并返回。
    """

    # 处理 POST 请求
    if request.method == 'POST':
        try:
            # 开始事务
            with transaction.atomic():
                # 解析请求体中的 JSON 数据
                data = json.loads(request.body)
                value1 = data.get('value1')
                value2 = data.get('value2')

                # 验证必要字段是否存在
                if not value1 or not isinstance(value2, list):
                    return JsonResponse({'message': '缺少必要字段或 value2 格式错误（应为数组）'}, status=400)

                    # 统一路径分隔符为 /
                value2 = [str(p).replace("\\", "/") for p in value2]

                print(f'接收到的数据：value1={value1}, value2={value2}')

                # 提取文件名部分
                simplified_value2 = [os.path.basename(path) for path in value2]

                # 将数据写入临时文件
                write_to_temp_file(value1, value2)

                # 调用外部脚本 vip_action.py，并获取评测结果
                results, average_score = call_external_script()

                # 将数据保存到 receives 表
                received_data = Receives(value1=value1, value2=simplified_value2, average_score=average_score)
                received_data.save()
                print(f"成功插入 receives 表，记录 ID: {received_data.id}, 平均分: {average_score}")

                # 将每个文件的评测分数保存到 file_scores 表
                file_scores = [
                    FileScores(receive_id=received_data.id, file_path=file_path, valid_scores=score)
                    for file_path, score in zip(simplified_value2, results)
                ]
                FileScores.objects.bulk_create(file_scores)
                print(f"成功插入 file_scores 表，共插入 {len(file_scores)} 条记录")

            # 如果事务成功，返回成功响应
            return JsonResponse({'message': '数据接收并保存成功'}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'message': '数据解析错误'}, status=400)
        except Exception as e:
            # 捕获其他异常并返回详细错误信息
            return JsonResponse({'message': f'服务器错误: {str(e)}'}, status=500)

    # 处理 GET 请求
    elif request.method == 'GET':
        try:
            # 从数据库中获取所有记录
            all_data = Receives.objects.all()

            # 将查询结果转换为字典列表
            data_list = [
                {
                    'id': item.id,
                    'value1': item.value1,
                    'value2': item.value2,
                    'average_score': item.average_score  # 包含 average_score
                }
                for item in all_data
            ]

            # 返回 JSON 响应
            return JsonResponse({'data': data_list}, status=200)

        except Exception as e:
            # 捕获异常并返回错误信息
            return JsonResponse({'message': f'服务器错误: {str(e)}'}, status=500)

    # 处理无效请求方法
    return JsonResponse({'message': '无效的请求方法'}, status=405)


def write_to_temp_file(value1, value2):
    """
    将数据写入临时文件。
    """
    try:
        with open(TEMP_FILE, "w", encoding="utf-8") as file:
            json.dump({"value1": value1, "value2": value2}, file)  # value2 是数组
    except Exception as e:
        raise RuntimeError(f"写入临时文件失败: {str(e)}")


def call_external_script():
    """
    调用外部脚本 vip_action.py，并返回评测结果。
    """
    try:
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vip_action.py")
        result = subprocess.run(["python", script_path], check=True, capture_output=True, text=True)

        # 解析脚本输出结果
        lines = result.stdout.strip().split("\n")
        scores = []
        for line in lines:
            if "此次评测的分数为:" in line:
                score = float(line.split(":")[1].strip().replace("分", ""))
                scores.append(score)

        # 计算平均分
        average_score = sum(scores) / len(scores) if scores else 0

        return scores, average_score

    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"外部脚本执行失败: {e.stderr}")
    except FileNotFoundError:
        raise RuntimeError("未找到外部脚本 action.py")
    except Exception as e:
        raise RuntimeError(f"调用外部脚本时发生错误: {str(e)}")

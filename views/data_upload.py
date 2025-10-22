import json
import os
import subprocess
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from xiu.models import ReceivedData
from django.utils import timezone


# 定义临时文件路径为常量
# TEMP_FILE = "temp_data.json"
TEMP_FILE = f"temp_data_2.json"


@csrf_exempt
def upload_data(request):
    """
    处理 POST 和 GET 请求：
    - POST: 接收数据并保存到数据库和临时文件，同时调用外部脚本。
    - GET: 查询数据库中的所有记录并返回。
    """

    # 处理 POST 请求
    if request.method == 'POST':
        try:
            # 解析请求体中的 JSON 数据
            data = json.loads(request.body)
            value1 = data.get('value1')
            value2 = data.get('value2')
            value3 = data.get('value3')  # 新增

            # 验证必要字段是否存在
            if not all([value1, value2]):
                return JsonResponse({'message': '缺少必要字段'}, status=400)

            print(f'接收到的数据：value1={value1}, value2={value2},value3={value3}')

            # 提取 value2 的最后一个路径部分，仅用于存储到数据库
            db_value2 = os.path.basename(value2)

            # 将数据保存到数据库
            received_data = ReceivedData(value1=value1, value2=db_value2, value3=value3)
            received_data.save()

            # 将数据写入临时文件
            write_to_temp_file(value1, value2)

            # 调用外部脚本 action.py
            call_external_script(value3)

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
            all_data = ReceivedData.objects.all()

            # 将查询结果转换为字典列表
            data_list = [
                {
                    'id': item.id,
                    'value1': item.value1,
                    'value2': item.value2,
                    'value3': item.value3
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
            json.dump({"value1": value1, "value2": value2}, file)
    except Exception as e:
        raise RuntimeError(f"写入临时文件失败: {str(e)}")


def call_external_script(value3):
    """
    调用外部脚本 action.py，并将评测结果插入 privatelists 数据库表。
    """
    try:
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "action.py")
        result = subprocess.run(["python", script_path], check=True, capture_output=True, text=True)

        # print("脚本输出:", result.stdout)
        if result.stderr:
            print("脚本错误:", result.stderr)

        # 提取最后一行JSON
        lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
        last_json_line = lines[-1]
        try:
            data = json.loads(last_json_line)
            from xiu.models import PrivateList
            PrivateList.objects.create(
                value3=value3,  # 直接加即可
                model_name=data["model_name"],
                data_set=data["data_set"],
                Metric=data["metric"],    # 注意这里用大写M
                score=data["score"],
                total=data.get("total"),
                correct=data.get("correct"),
                wrong=data.get("wrong"),
                total_time=data.get("total_time"),
                wrongs=json.dumps(data.get("wrongs"), ensure_ascii=False),  # 推荐这样保存 json 字符串
                timestamp=timezone.now()  # 显式赋值
            )
            print("评测结果已插入数据库")
        except Exception as e:
            print("解析 action.py 输出或插入数据库失败:", e)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"外部脚本执行失败: {e.stderr}")
    except FileNotFoundError:
        raise RuntimeError("未找到外部脚本 action.py")
    except Exception as e:
        raise RuntimeError(f"调用外部脚本时发生错误: {str(e)}")

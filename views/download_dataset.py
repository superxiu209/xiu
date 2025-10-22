import os
import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings  # 新增

TEMP_URL_FILE = "download_url.txt"
DEFAULT_GITHUB_URL = "https://github.com/thu-coai/Safety-Prompts/blob/main/typical_safety_scenarios.json"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(settings.BASE_DIR, "data", "json")

def github_blob_to_raw(url):
    if url.startswith("https://github.com/") and "/blob/" in url:
        parts = url.split("/")
        owner = parts[3]
        repo = parts[4]
        branch = parts[6]
        file_path = "/".join(parts[7:])
        return f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}"
    return url

def add_ids_if_needed(data):
    changed = False
    if isinstance(data, list):
        if all(isinstance(x, dict) and ("id" in x or "question_id" in x) for x in data):
            return data, changed
        for idx, item in enumerate(data, 1):
            if isinstance(item, dict):
                item["id"] = idx
                changed = True
        return data, changed
    elif isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, list):
                if all(isinstance(x, dict) and ("id" in x or "question_id" in x) for x in v):
                    continue
                for idx, item in enumerate(v, 1):
                    if isinstance(item, dict):
                        item["id"] = idx
                        changed = True
        return data, changed
    else:
        return data, changed

@csrf_exempt
def download_dataset(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            url = data.get("url", "").strip()
            if not url:
                return JsonResponse({"success": False, "error": "URL不能为空"})
            # 保存到临时文件
            with open(TEMP_URL_FILE, "w", encoding="utf-8") as f:
                f.write(url)
            # 调用下载逻辑
            success, msg, filename, existed = _download_and_save_dataset()
            if success:
                return JsonResponse({
                    "success": True,
                    "filename": filename,
                    "existed": existed,
                    "message": msg
                })
            else:
                return JsonResponse({"success": False, "error": msg})
        except Exception as e:
            return JsonResponse({"success": False, "error": f"系统异常: {str(e)}"})
    else:
        return JsonResponse({"success": False, "error": "仅支持POST"})

def _download_and_save_dataset():
    """
    :return: (success:bool, message:str, filename:str|None, existed:bool)
    """
    # 读取临时文件，优先使用临时文件内容，否则用默认
    url = DEFAULT_GITHUB_URL
    if os.path.exists(TEMP_URL_FILE):
        with open(TEMP_URL_FILE, "r", encoding="utf-8") as f:
            temp_url = f.read().strip()
            if temp_url:
                url = temp_url

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    raw_url = github_blob_to_raw(url)
    file_name = raw_url.split("/")[-1]
    output_file = os.path.join(OUTPUT_DIR, file_name)

    # 打印绝对路径（方便调试）
    # print("[download_dataset] 绝对路径:", os.path.abspath(output_file))

    if os.path.exists(output_file):
        msg = f"数据集已存在: {output_file}"
        print("[download_dataset]", msg)
        return True, msg, file_name, True

    try:
        response = requests.get(raw_url)
        if response.status_code == 200:
            file_extension = os.path.splitext(file_name)[1].lower()
            if file_extension == ".jsonl":
                with open(output_file, "w", encoding="utf-8") as f:
                    f.write(response.text)
                msg = f"成功添加数据集: {output_file}"
                print("[download_dataset]", msg)
                return True, msg, file_name, False
            elif file_extension == ".json":
                try:
                    data = response.json()
                    data, changed = add_ids_if_needed(data)
                    with open(output_file, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    msg = f"成功添加数据集: {output_file}"
                    if changed:
                        msg += "（已自动为数据集添加id字段）"
                    print("[download_dataset]", msg)
                    return True, msg, file_name, False
                except Exception as e:
                    err = f"JSON 数据解析失败: {e}"
                    print("[download_dataset]", err)
                    return False, err, None, False
            else:
                with open(output_file, "w", encoding="utf-8") as f:
                    f.write(response.text)
                msg = f"成功添加数据集: {output_file}"
                print("[download_dataset]", msg)
                return True, msg, file_name, False
        else:
            err = f"下载失败，HTTP 状态码: {response.status_code}, URL: {raw_url}"
            print("[download_dataset]", err)
            return False, err, None, False
    except Exception as e:
        err = f"请求异常: {e}"
        print("[download_dataset]", err)
        return False, err, None, False


import os
import subprocess
import sys

def run(cmd):
    print(f"执行：{cmd}")
    ret = subprocess.run(cmd, shell=True)
    if ret.returncode != 0:
        print(f"命令失败：{cmd}")
        sys.exit(1)

def show_files():
    os.system('dir')

def upload(files):
    for f in files:
        run(f'git add "{f}"')
    run(f'git commit -m "auto add {" ".join(files)}"')
    run('git push origin main')
    print("上传完成！")

def rm_cached(files):
    for f in files:
        run(f'git rm --cached "{f}"')
    run(f'git commit -m "auto remove {" ".join(files)} from repo only"')
    run('git push origin main')
    print("删除完成！（仅远程仓库，保留本地文件）")

def main():
    while True:
        print("\n菜单：")
        print("0. 退出")
        print("1. 显示当前文件夹内容")
        print("2. 上传文件（单个或批量）")
        print("3. 删除文件（只从仓库删，保留本地，单个或批量）")
        choice = input("请输入操作编号：").strip()
        if choice == '0':
            print("退出。")
            break
        elif choice == '1':
            show_files()
        elif choice == '2':
            mode = input("1-单个上传，2-批量上传，输入选项：").strip()
            if mode == '1':
                filename = input("输入要上传的文件名：").strip()
                upload([filename])
            elif mode == '2':
                filenames = input("输入要上传的文件名（用空格分隔）：").strip().split()
                upload(filenames)
            else:
                print("无效输入。")
        elif choice == '3':
            mode = input("1-单个删除，2-批量删除，输入选项：").strip()
            if mode == '1':
                filename = input("输入要删除的文件名：").strip()
                rm_cached([filename])
            elif mode == '2':
                filenames = input("输入要删除的文件名（用空格分隔）：").strip().split()
                rm_cached(filenames)
            else:
                print("无效输入。")
        else:
            print("无效选择，请重试。")

if __name__ == '__main__':
    main()
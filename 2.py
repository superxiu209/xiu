# import pypandoc
# pypandoc.pandoc_path = r"C:\Program Files\Pandoc\pandoc.exe"
# output = pypandoc.convert_file('机器学习复习1.docx', 'md', outputfile="机器侠复习1.md")
# print("转换完成！")


import os

file_path = r'D:\pycharmprproject\djangoProject\gh\xiu\机器学习复习1.md'
print("文件存在吗？", os.path.isfile(file_path))
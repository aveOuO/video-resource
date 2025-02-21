# 僵毁地图区块文件快速备份（移除）

可以在https://map.projectzomboid.com/ 查看某块区域的起始X和Y坐标和结束X和Y坐标，如下图罗斯伍德的坐标范围大概是7941×11210到8494×11894，将坐标除以十向下取整得到794 1121 849 1189，按照操作填入即可。

![image](https://github.com/user-attachments/assets/7dca9154-fc01-42a1-a7e6-d8584900c3e7)

按如下方法执行程序，填入794 1121 849 1189然后执行剪切操作即可将整个罗斯伍德加载好的区块移除，进入游戏前往罗斯伍德就会刷新车辆和物资，访问过的区块后加载mod地图不出现也可以这么操作。

方法一：下载[reader.js](https://github.com/aveOuO/video-resource/releases/download/0.0.5/reader.js)

通过node运行

假设有如下map文件我的安全屋在罗斯伍德假设区块目前是110 110到120 120，我想让罗斯伍德之外的区块全部重新生成，可以选择操作2然后输入区块坐标起点和终点xy位置。

![image](https://github.com/user-attachments/assets/87991ab8-f812-4ee5-ac19-4ec7537b8603)

上面选中7个文件则不是罗斯伍德的区块将会被移到同目录下map_bk中，此文件夹不是游戏生成的，如果没有此文件夹运行此程序会自动生成，等待执行操作完成。

![image](https://github.com/user-attachments/assets/bc651e1b-c1c6-47a2-a229-e720d517774f)

![image](https://github.com/user-attachments/assets/ce94ad38-9823-4f3b-8554-0d666c0855ea)

![image](https://github.com/user-attachments/assets/97fb4317-4a04-432d-8557-55486c9a21cd)

方法二：下载[reader.exe](https://github.com/aveOuO/video-resource/releases/download/0.0.5/reader.exe)

不想下node可以通过下载exe文件执行，右键管理员运行，操作步骤跟方法一的一致。

![image](https://github.com/user-attachments/assets/d761a60a-0e63-43b8-a2c9-d77fb4876f12)


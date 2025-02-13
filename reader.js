const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = async (prompt, handler) => {
  return await new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      answer = typeof handler === "function" ? handler(answer) : answer;
      resolve(
        typeof answer === "string"
          ? answer.trim()
          : answer == null
          ? ""
          : answer
      );
    });
  });
};

// 工具函数格式化当前时间
const formatNow = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}时${minutes}分${seconds}秒`;
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 对应1操作
const operateFiles = async (
  directoryPath,
  xStart,
  yStart,
  xEnd,
  yEnd,
  isCut = false
) => {
  // 备份文件夹
  const backupDir = path.join(directoryPath, "map_bk", formatNow());
  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) {
    try {
      await fs.promises.mkdir(backupDir, { recursive: true });
    } catch (err) {
      console.error("创建备份目录失败:", err);
      return;
    }
  }

  const processFiles = async () => {
    console.log(`-----开始执行-----`);
    let totalFiles = 0;
    let successfulCopies = 0;
    let failedCopies = 0;

    const promises = [];
    const files = await fs.promises.readdir(directoryPath);
    const mapFiles = {};
    for (const file of files) {
      const match = file.match(/^map_(\d+)_(\d+)\.bin$/);
      if (match) {
        mapFiles[file] = {
          x: parseInt(match[1], 10),
          y: parseInt(match[2], 10),
        };
      }
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const fileName in mapFiles) {
      const file = mapFiles[fileName];
      minX = Math.min(minX, file.x);
      maxX = Math.max(maxX, file.x);
      minY = Math.min(minY, file.y);
      maxY = Math.max(maxY, file.y);
    }

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const fileName = `map_${x}_${y}.bin`;
        const filePath = path.join(directoryPath, fileName);
        const mapFile = mapFiles[fileName];

        if (mapFile) {
          const sourcePath = filePath;
          const destPath = path.join(backupDir, fileName);
          totalFiles++;

          const startCopy = async () => {
            console.log(
              "匹配到文件:",
              fileName,
              `开始${isCut ? "剪切" : "复制"}`
            );
            try {
              isCut
                ? await fs.promises.rename(sourcePath, destPath)
                : await fs.promises.copyFile(sourcePath, destPath);
              successfulCopies++;
              console.log("文件:", fileName, " 操作完成");
            } catch (error) {
              failedCopies++;
              console.log("文件:", fileName, ` 操作失败：[${error.message}]`);
            }
          };

          promises.push(startCopy());
        }
      }
    }

    await Promise.all(promises);

    console.log("-----执行完成-----");
    console.log(
      `总操作文件数: ${totalFiles}  成功: ${successfulCopies}  失败: ${failedCopies}`
    );
    successfulCopies && console.log(`map文件已备份到目录: ${backupDir}`);
    return !!successfulCopies;
  };

  return {
    backupDir,
    fileOperated: await processFiles(),
  };
};

// 对应2操作
const copyAllBinFiles = async (directoryPath, oriMapDir) => {
  // 确保 ori_map 目录存在。
  if (!fs.existsSync(oriMapDir)) {
    try {
      await fs.promises.mkdir(oriMapDir, { recursive: true });
    } catch (err) {
      console.error("创建 ori_map 目录失败:", err);
      return;
    }
  }
  console.log("即将开始复制所有 .bin 文件，请耐心...");
  let totalFiles = 0;
  let successfulCopies = 0;
  let failedCopies = 0;

  try {
    const files = await fs.promises.readdir(directoryPath);

    console.log("----- 操作开始 -----");
    for (const file of files) {
      // 使用正则表达式检查文件名是否匹配 map_xxx_xxx.bin
      if (/^map_\d+_\d+\.bin$/.test(file)) {
        const sourcePath = path.join(directoryPath, file);
        const destPath = path.join(oriMapDir, file);
        totalFiles++;

        try {
          await fs.promises.copyFile(sourcePath, destPath);
          successfulCopies++;
          console.log(`已复制 ${file}`);
        } catch (error) {
          failedCopies++;
          console.error(`复制 ${file} 失败:`, error);
        }
      }
    }
    console.log("----- 操作完成 -----");
    console.log(
      `总文件数: ${totalFiles}  成功: ${successfulCopies}  失败: ${failedCopies}`
    );
    if (successfulCopies) return console.log(`已将文件备份至: ${oriMapDir}`);
    // 如果没有成功复制任何文件，则删除 ori_map 目录
    await fs.promises.rmdir(oriMapDir, { recursive: true });
  } catch (err) {
    console.error("发生错误:", err);
  }
};

const askForCutOrCopy = async (directoryPath, xStart, yStart, xEnd, yEnd) => {
  const isCut = await question(
    "是否执行剪切(默认为复制)操作？(y/n): ",
    (answer) => answer.toLowerCase() === "y"
  );
  const { backupDir, fileOperated } = await operateFiles(
    directoryPath,
    xStart,
    yStart,
    xEnd,
    yEnd,
    isCut
  );
  backupDir, fileOperated;
};

// 询问区块范围函数
const askForInputRange = async (directoryPath) => {
  const inputRange = await question(
    "请输入x和y的范围，使用空格隔开(例如:200 300 350 450): "
  );
  const ranges = inputRange
    .trim()
    .split(" ")
    .map((str) => Math.floor(Number(str)));
  if (ranges.length !== 4) {
    console.error("输入范围格式不正确，请重新输入");
    return askForInputRange(directoryPath);
  }
  const numFlag = ranges.some((num) => {
    if (isNaN(num)) {
      return console.error("输入包含非数字字符，请重新输入") || true;
    }
    if (num < 0) {
      return console.error("输入包含负数，请重新输入") || true;
    }
  });
  if (numFlag) return askForInputRange(directoryPath);

  const [xStart, yStart, xEnd, yEnd] = ranges;
  await askForCutOrCopy(directoryPath, xStart, yStart, xEnd, yEnd);
};

// 在文件末尾添加 deleteAllMapFiles 函数
const deleteAllMapFiles = async (directoryPath) => {
  const confirm = await question(
    "确定要删除所有 map_xxx_xxx.bin 文件吗？此操作不可撤销！(y/n): ",
    (answer) => answer.toLowerCase() === "y"
  );

  if (!confirm) return console.log("操作已取消。");

  try {
    const files = await fs.promises.readdir(directoryPath);
    let totalFiles = 0;
    let successfulDeletions = 0;
    let failedDeletions = 0;

    console.log("----- 删除操作开始 -----");
    for (const file of files) {
      if (/^map_\d+_\d+\.bin$/.test(file)) {
        const filePath = path.join(directoryPath, file);
        totalFiles++;

        try {
          await fs.promises.unlink(filePath);
          successfulDeletions++;
          console.log(`已删除 ${file}`);
        } catch (error) {
          failedDeletions++;
          console.error(`删除 ${file} 失败:`, error);
        }
      }
    }
    console.log("----- 删除操作完成 -----");
    console.log(
      `总文件数: ${totalFiles}  成功: ${successfulDeletions}  失败: ${failedDeletions}`
    );
  } catch (err) {
    console.error("发生错误:", err);
  }
};

// 入口
const askForDirectoryPath = async () => {
  const directoryPath = await question("请输入路径: ");
  if (!fs.existsSync(directoryPath)) {
    console.error("路径不存在，请重新输入。");
    return askForDirectoryPath();
  }

  while (true) {
    // 询问用户操作类型
    const operationType = await question(
      "请选择操作类型：\n1、备份指定区块范围map文件\n2、备份所有map文件\n3、删除所有map文件\n4、更换要执行的目录路径\n请输入数字或输入exit退出：",
      (input) => input.trim()
    );

    if (operationType === "exit") break;

    switch (operationType) {
      case "1":
        await askForInputRange(directoryPath);
        break;
      case "2":
        // 备份所有map文件
        const backupDir = path.join(directoryPath, "map_bk_ori", formatNow());
        await copyAllBinFiles(directoryPath, backupDir);
        break;
      case "3":
        await deleteAllMapFiles(directoryPath);
        break;
      case "4":
        return askForDirectoryPath();
      default:
        console.error("输入的操作类型无效,请重新输入");
        continue;
    }
    await sleep(500);
  }

  console.log("按下任意键退出...");
  process.stdin.setRawMode(true);
  process.stdin.once("data", () => {
    process.stdin.setRawMode(false);
    rl.close();
  });
};

askForDirectoryPath();

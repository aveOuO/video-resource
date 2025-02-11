const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

  const processFiles = async () => {
    console.log(`-----开始执行-----`);
    try {
      const files = await fs.promises.readdir(directoryPath);

      let totalFiles = 0;
      let successfulCopies = 0;
      let failedCopies = 0;

      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        try {
          const stats = await fs.promises.stat(filePath);

          if (stats.isFile()) {
            const match = file.match(/^map_(\d+)_(\d+)\.bin$/);
            if (match) {
              const x = parseInt(match[1]);
              const y = parseInt(match[2]);

              if (x >= xStart && x <= xEnd && y >= yStart && y <= yEnd) {
                console.log("匹配的文件:", file);
                // 复制文件到map_bk文件夹
                const sourcePath = filePath;
                const destPath = path.join(backupDir, file);
                process.stdout.write(`开始${isCut ? "剪切" : "复制"} ${file}`);
                totalFiles++;
                try {
                  if (isCut) {
                    // 剪切
                    await fs.promises.rename(sourcePath, destPath);
                  } else {
                    // 复制
                    await fs.promises.copyFile(sourcePath, destPath);
                  }
                  successfulCopies++;
                  console.log("  已完成");
                } catch (error) {
                  failedCopies++;
                  console.log(`  失败：[${error.message}]`);
                }
              }
            }
          }
        } catch (err) {
          console.error("获取文件状态时发生错误:", err);
        }
      }

      console.log("-----执行完成-----");
      console.log(
        `总操作文件数: ${totalFiles}  成功: ${successfulCopies}  失败: ${failedCopies}`
      );
    } catch (err) {
      console.error("读取目录时发生错误:", err);
    }
  };

  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) {
    await fs.promises.mkdir(backupDir);
  }
  await processFiles();
};

const askForCutOrCopy = async (directoryPath, xStart, yStart, xEnd, yEnd) => {
  const isCut = await new Promise((resolve) => {
    rl.question("是否执行剪切(默认为复制)操作？(y/n): ", (answer) => {
      resolve(answer.toLowerCase() === "y");
    });
  });
  await operateFiles(directoryPath, xStart, yStart, xEnd, yEnd, isCut);
};

const askForInputRange = async (directoryPath) => {
  const inputRange = await new Promise((resolve) => {
    rl.question(
      "请输入x和y的范围，使用空格隔开(例如:200 300 350 450): ",
      (input) => {
        resolve(input.trim());
      }
    );
  });
  const ranges = inputRange.trim().split(" ").map(Number);
  if (ranges.length !== 4) {
    console.error("输入范围格式不正确，请重新输入");
    return askForInputRange(directoryPath);
  }
  if (ranges.some(isNaN)) {
    console.error("输入包含非数字字符，请重新输入");
    return askForInputRange(directoryPath);
  }
  const [xStart, yStart, xEnd, yEnd] = ranges;
  await askForCutOrCopy(directoryPath, xStart, yStart, xEnd, yEnd);
};

const askForDirectoryPath = async () => {
  const directoryPath = await new Promise((resolve) => {
    rl.question("请输入路径: ", (input) => {
      resolve(input.trim());
    });
  });
  if (!fs.existsSync(directoryPath)) {
    console.error("路径不存在，请重新输入。");
    return askForDirectoryPath();
  }
  await askForInputRange(directoryPath);
  console.log("按下任意键退出...");
  process.stdin.setRawMode(true);
  process.stdin.once("data", () => {
    process.stdin.setRawMode(false);
    rl.close();
  });
};

askForDirectoryPath();

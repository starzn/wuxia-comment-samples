import fs from "fs/promises";

// 主函数：使用链式调用
function generateWuxiaCodeComments(code, runnable) {
  return runnable.invoke({ code });
}

export async function processCodeFile(filePath, runnable) {
  try {
    const startTime = performance.now();

    // 读取文件内容
    const code = await fs.readFile(filePath, "utf-8");

    // 生成武侠风格注释
    const annotatedCode = await generateWuxiaCodeComments(code, runnable);

    // 将结果写回文件
    await fs.writeFile(filePath, annotatedCode, "utf-8");

    const endTime = performance.now();
    const timeElapsed = ((endTime - startTime) / 1000).toFixed(2); // 转换为秒，保留两位小数
    console.log(`生成注释成功：${filePath} (用时: ${timeElapsed}秒)`);
  } catch (error) {
    console.error(`生成注释出错：${filePath}:`, error);
    throw error;
  }
}

export async function processCodeExec(code, runnable) {
  const startTime = performance.now();
  const result = {};
  try {
    // 生成武侠风格注释
    result.annotatedCode = await generateWuxiaCodeComments(code, runnable);
  } catch (error) {
    console.error(`生成注释出错：`, error);
    result.wrongStructure = true;
  } finally {
    const endTime = performance.now();
    const timeCost = Number(((endTime - startTime) / 1000).toFixed(2)); // 转换为秒，保留两位小数
    result.timeCost = timeCost;
    return result;
  }
}

export function cli() {
  // 获取实际的命令行参数，跳过 node 和 npm run 相关的参数
  // [
  //   '/Users/venus/.nvm/versions/node/v20.18.0/bin/node',
  //   '/Users/venus/Desktop/AI_samples/wuxia-comment/src/index.js',
  //   '1',
  //   'examples/quick_sort1.js'
  // ]
  const args = process.argv.slice(2);
  const whichChain = args[0];
  const filePath = args[1];

  if (!whichChain) {
    console.error("请提供一个Chain序号，1～3");
    process.exit(1);
  }

  if (!filePath) {
    console.error("请提供一个文件路径作为参数");
    process.exit(1);
  }

  return { whichChain, filePath };
}

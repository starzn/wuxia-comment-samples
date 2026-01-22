import { testCase, testModels } from "./testsuit.js";
import { runBenchmark } from "./benchmark.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

// 以一定间隔时间执行多轮 benchmark
async function runBenchmarkWithInterval(iterations, intervalMs = 1000) {
  for (const model of testModels) {
    for (let i = 0; i < iterations; i++) {
      console.log(`*** 执行benchmark 轮次： ${i + 1}/${iterations}`);
      const result = await runBenchmark(model, testCase);
      await reportOutput(result);

      // 如果不是最后一次迭代，则等待指定的时间间隔
      if (i < iterations - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
  }
}

// 创建并输出报告
async function reportOutput(data) {
  // 创建 report 目录（如果不存在）
  const reportDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "report"
  );
  await fs.mkdir(reportDir, { recursive: true });

  // 生成文件名并保存结果
  const now = new Date();
  const localDateTime =
    now.toLocaleDateString("zh-CN").replace(/\//g, "-") +
    "_" +
    now.toLocaleTimeString("zh-CN", { hour12: false }).replace(/:/g, "-");
  const filename = `${data.modelName}_${data.testCaseName}_${localDateTime}.json`;
  const filePath = path.join(reportDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`输出报告： ${filePath}`);
}

// 每个模型运行10次，间隔1秒（token总消耗小于 0.2刀）
runBenchmarkWithInterval(1, 1000);

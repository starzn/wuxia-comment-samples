import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取 report 目录路径（用于读取原始数据）
const reportDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "report"
);

// 获取 benchmark 目录路径（用于保存分析报告）
const benchmarkDir = path.dirname(fileURLToPath(import.meta.url));

// 分析指标
const METRICS = [
  "timeCost",
  "inputTokensCost",
  "outputTokensCost",
  "wuxiaKeywords",
  "codeCoverage",
  "styleConsistency",
  "readability",
  "creativity",
];

async function analyzeReports() {
  try {
    // 读取所有 JSON 文件
    const files = await fs.readdir(reportDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    // 读取并解析所有文件内容
    const reports = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(reportDir, file), "utf-8");
        return JSON.parse(content);
      })
    );

    // 按模型和测试用例分组
    const groupedReports = {};
    reports.forEach((report) => {
      const key = `${report.modelName}_${report.testCaseName}`;
      if (!groupedReports[key]) {
        groupedReports[key] = [];
      }
      groupedReports[key].push(report);
    });

    // 计算每组的平均值
    const results = {};
    for (const [key, group] of Object.entries(groupedReports)) {
      // 计算结构化生成能力得分
      const validRatio =
        group.filter((report) => !report.wrongStructure).length / group.length;

      // 结构稳定性评分规则：
      // 1.0: 100% 稳定 (10分)
      // 0.9-1.0: 90-99% 稳定 (8分)
      // 0.8-0.9: 80-90% 稳定 (6分)
      // 0.7-0.8: 70-80% 稳定 (4分)
      // 0.6-0.7: 60-70% 稳定 (2分)
      // <0.6: 不稳定 (0分)
      const structureScore =
        validRatio === 1
          ? 10
          : validRatio >= 0.9
          ? 8
          : validRatio >= 0.8
          ? 6
          : validRatio >= 0.7
          ? 4
          : validRatio >= 0.6
          ? 2
          : 0;

      // 过滤掉结构错误的数据
      const validReports = group.filter((report) => !report.wrongStructure);

      if (validReports.length === 0) {
        // 计算所有样本的平均时间和成本
        const avgTimeCost =
          group.reduce((sum, report) => sum + report.timeCost, 0) /
          group.length;
        const avgInputTokensCost =
          group.reduce((sum, report) => sum + report.inputTokensCost, 0) /
          group.length;
        const avgOutputTokensCost =
          group.reduce((sum, report) => sum + report.outputTokensCost, 0) /
          group.length;

        // 使用相同的惩罚计算规则
        const TIME_THRESHOLD = 3;
        const TIME_MAX = 30;
        const COST_THRESHOLD = 0.025;
        const COST_MAX = 0.25;

        // 时间惩罚计算
        const timePenalty = Math.max(
          0,
          Math.min(
            1,
            1 - (avgTimeCost - TIME_THRESHOLD) / (TIME_MAX - TIME_THRESHOLD)
          )
        );

        // 成本惩罚计算
        const tokenCost = avgInputTokensCost + avgOutputTokensCost;
        const costPenalty = Math.max(0, Math.min(1, 1 - tokenCost / COST_MAX));

        // 结构稳定性为0分
        const structureScore = 0;

        results[key] = {
          modelName: group[0].modelName,
          testCaseName: group[0].testCaseName,
          sampleSize: group.length,
          validSamples: 0,
          structureScore: 0,
          contentScore: 0,
          timePenalty: timePenalty * 10,
          costPenalty: costPenalty * 10,
          totalScore: timePenalty * 10 * 0.2 + costPenalty * 10 * 0.15,
          timeCost: avgTimeCost,
          inputTokensCost: avgInputTokensCost,
          outputTokensCost: avgOutputTokensCost,
          wuxiaKeywords: 0,
          codeCoverage: 0,
          styleConsistency: 0,
          readability: 0,
          creativity: 0,
        };
        continue;
      }

      const avgMetrics = {};
      METRICS.forEach((metric) => {
        const values = validReports
          .map((report) => report[metric])
          .filter((value) => value !== undefined);

        if (values.length > 0) {
          avgMetrics[metric] =
            values.reduce((a, b) => a + b, 0) / values.length;
        }
      });

      // 计算总分 (包含结构化生成能力)
      const scoreMetrics = [
        "wuxiaKeywords",
        "codeCoverage",
        "styleConsistency",
        "readability",
        "creativity",
      ];
      const contentScore =
        scoreMetrics.reduce((sum, metric) => {
          return sum + (avgMetrics[metric] || 0);
        }, 0) / scoreMetrics.length;

      // 计算时间和成本的惩罚系数
      const TIME_THRESHOLD = 3; // 5秒以上开始扣分
      const TIME_MAX = 30; // 15秒封顶
      const COST_THRESHOLD = 0.025; // 每0.025元扣1分
      const COST_MAX = 0.25; // 0.25元封顶

      // 时间惩罚：3秒内满分，3-30秒线性扣分，超过30秒为0分
      const timePenalty = Math.max(
        0,
        Math.min(
          1,
          1 -
            (avgMetrics.timeCost - TIME_THRESHOLD) / (TIME_MAX - TIME_THRESHOLD)
        )
      );

      // 成本惩罚：每0.025元扣1分，0.25元及以上为0分
      const tokenCost =
        avgMetrics.inputTokensCost + avgMetrics.outputTokensCost;
      const costPenalty = Math.max(0, Math.min(1, 1 - tokenCost / COST_MAX));

      // 最终得分计算：
      // - 内容质量占 35%
      // - 结构稳定占 30%
      // - 时间消耗占 20%
      // - 成本消耗占 15%
      const totalScore =
        contentScore * 0.35 +
        structureScore * 0.3 +
        timePenalty * 10 * 0.2 +
        costPenalty * 10 * 0.15;

      results[key] = {
        modelName: validReports[0].modelName,
        testCaseName: validReports[0].testCaseName,
        sampleSize: group.length, // 使用总样本数
        validSamples: validReports.length, // 有效样本数
        structureScore, // 结构化生成能力得分
        contentScore, // 内容质量得分
        timePenalty: timePenalty * 10, // 时间惩罚得分
        costPenalty: costPenalty * 10, // 成本惩罚得分
        totalScore, // 综合得分
        ...avgMetrics,
      };
    }

    // 生成报告
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalTests: reports.length,
        uniqueModels: new Set(reports.map((r) => r.modelName)).size,
        uniqueTestCases: new Set(reports.map((r) => r.testCaseName)).size,
      },
      results: Object.values(results).sort(
        (a, b) => b.totalScore - a.totalScore
      ),
    };

    // 保存分析报告到 benchmark 目录
    const reportPath = path.join(
      benchmarkDir,
      `analysis_${new Date().toISOString().split("T")[0]}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // 打印结果摘要
    console.log("\n=== 分析报告摘要 ===");
    console.log(`总测试数: ${report.summary.totalTests}`);
    console.log(`模型数量: ${report.summary.uniqueModels}`);
    console.log(`测试用例数量: ${report.summary.uniqueTestCases}`);
    console.log("\n性能排名:");
    report.results.forEach((result, index) => {
      console.log(
        `\n${index + 1}. ${result.modelName} (${result.testCaseName})`
      );
      console.log(`   综合得分: ${result.totalScore.toFixed(2)}`);
      console.log(`   - 内容质量(35%): ${result.contentScore.toFixed(2)}`);
      console.log(`   - 结构稳定(30%): ${result.structureScore.toFixed(2)}`);
      console.log(`   - 时间消耗(20%): ${result.timePenalty.toFixed(2)}`);
      console.log(`   - 成本消耗(15%): ${result.costPenalty.toFixed(2)}`);
      console.log(
        `   样本数: ${result.sampleSize} (有效: ${result.validSamples})`
      );
      console.log(`   平均耗时: ${result.timeCost.toFixed(2)}s`);
      console.log(
        `   Token成本: ${(
          result.inputTokensCost + result.outputTokensCost
        ).toFixed(5)}元`
      );
      console.log("   评分详情:");
      console.log(`   - 武侠关键词率: ${result.wuxiaKeywords.toFixed(2)}`);
      console.log(`   - 注释覆盖率: ${result.codeCoverage.toFixed(2)}`);
      console.log(`   - 风格一致性: ${result.styleConsistency.toFixed(2)}`);
      console.log(`   - 可读性: ${result.readability.toFixed(2)}`);
      console.log(`   - 创意性: ${result.creativity.toFixed(2)}`);
    });

    console.log(`\n完整报告已保存至: ${reportPath}`);

    return report;
  } catch (error) {
    console.error("分析报告生成失败:", error);
    throw error;
  }
}

// 如果直接运行此文件
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  analyzeReports().catch(console.error);
}

export { analyzeReports };

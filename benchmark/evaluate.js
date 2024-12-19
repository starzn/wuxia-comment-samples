import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { config } from "dotenv";
import { z } from "zod";

// 加载 .env.local 文件到环境变量
config({ path: ".env.local" });

// 定义评分结构
const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    wuxiaKeywords: z
      .number()
      .min(0)
      .max(10)
      .describe("武侠关键词覆盖率评分 (0-10分)"),
    codeCoverage: z
      .number()
      .min(0)
      .max(10)
      .describe("代码注释覆盖率评分 (0-10分)"),
    styleConsistency: z
      .number()
      .min(0)
      .max(10)
      .describe("武侠风格一致性评分 (0-10分)"),
    readability: z.number().min(0).max(10).describe("可读性评分 (0-10分)"),
    creativity: z.number().min(0).max(10).describe("创意性评分 (0-10分)"),
  })
);

// 评估的提示词
const evaluationPrompt = PromptTemplate.fromTemplate(`
你是一个精通编程的武侠小说专家，请评估以下代码注释的武侠风格质量：

{code}

请从以下几个方面进行评分（0-10分）：

1. 武侠关键词覆盖率：是否使用了足够的武侠术语？
2. 代码注释覆盖率：是否对每个关键部分都有注释？
3. 武侠风格一致性：注释风格是否统一且符合武侠特色？
4. 可读性：注释是否清晰易懂？
5. 创意性：比喻是否新颖有趣？

{formatInstructions}
`);

// 使用 Qwen-Max 评估其他模型的生成效果
const llm = new ChatOpenAI(
  {
    modelName: "Qwen-Max",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  },
  { baseURL: process.env.OPENAI_BASE_URL }
);

export async function evaluate(annotatedCode) {
  const result = await evaluationPrompt.pipe(llm).invoke({
    code: annotatedCode,
    formatInstructions: parser.getFormatInstructions(),
  });
  const parsed = await parser.parse(result.content);
  return parsed;
}

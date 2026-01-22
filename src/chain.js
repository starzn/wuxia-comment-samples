import {
  prompt1_origin,
  prompt2_clarification,
  prompt3_1_codeAnalysis,
  prompt3_2_wuxiaSetting,
  prompt3_3_plotDesign,
  prompt3_4_commentGenerator,
} from "./prompt.js";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

// 创建输出解析器
const outputParser = StructuredOutputParser.fromZodSchema(
  z.object({
    code: z.string().describe("拥有武侠风格注释的完整代码"),
  })
);

// 最后一步的 runnable
async function runnableOutputParser(input) {
  let annotatedCode = input.annotatedCode;
  if (typeof annotatedCode !== "string") {
    annotatedCode = annotatedCode.content;
  }
  // 解析输出以获取纯代码内容
  const parsed = await outputParser.parse(annotatedCode);

  // 确保返回的代码是字符串
  if (typeof parsed.code !== "string") {
    throw new Error("Invalid output format: code must be a string");
  }

  return parsed.code;
}

export function getChainList(llm) {
  const chainList = [
    // chain1
    [
      {
        annotatedCode: (input) =>
          prompt1_origin.pipe(llm).invoke({
            code: input.code,
            format_instructions: outputParser.getFormatInstructions(),
          }),
      },
      runnableOutputParser,
    ],
    // chain2
    [
      {
        annotatedCode: (input) =>
          prompt2_clarification.pipe(llm).invoke({
            code: input.code,
            format_instructions: outputParser.getFormatInstructions(),
          }),
      },
      runnableOutputParser,
    ],
    // chain3
    [
      {
        code: (input) => input.code,
        analysis: async (input) => {
          const response = await prompt3_1_codeAnalysis
            .pipe(llm)
            .invoke({ code: input.code });
          return response;
        },
      },
      {
        code: (input) => input.code,
        setting: async (input) => {
          const response = await prompt3_2_wuxiaSetting
            .pipe(llm)
            .invoke({ analysis: input.analysis });
          return response;
        },
      },
      {
        code: (input) => input.code,
        plot: async (input) => {
          const response = await prompt3_3_plotDesign
            .pipe(llm)
            .invoke({ setting: input.setting });
          return response;
        },
      },
      {
        annotatedCode: async (input) => {
          return prompt3_4_commentGenerator.pipe(llm).invoke({
            plot: input.plot,
            code: input.code,
            format_instructions: outputParser.getFormatInstructions(),
          });
        },
      },
      runnableOutputParser,
    ],
  ];

  return chainList.map(RunnableSequence.from);
}

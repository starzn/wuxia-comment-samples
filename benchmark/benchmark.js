import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";
import { evaluate } from "./evaluate.js";
import { processCodeExec } from "../src/processCode.js";
import { getChainList } from "../src/chain.js";

export async function runBenchmark(model, testCase) {
  const { name, from, inputCost, outputCost } = model;

  // 记录 token 使用量
  let inputTokens = 0;
  let outputTokens = 0;

  const callbacks = [
    {
      handleLLMEnd({ llmOutput }) {
        inputTokens = llmOutput?.tokenUsage?.promptTokens ?? 0;
        outputTokens = llmOutput?.tokenUsage?.completionTokens ?? 0;
      },
    },
  ];

  console.log(`测试模型: ${name}`);
  let llm;

  if (from === "api") {
    llm = new ChatOpenAI({
      modelName: name,
      temperature: 1.5,
      frequency_penalty: 1,
      // verbose: true,
      callbacks,
    });
  } else {
    llm = new Ollama({
      model: name,
      temperature: 1.5,
      frequency_penalty: 1,
      // verbose: true,
      callbacks,
    });
  }

  try {
    // 跑测试用例
    console.log(`测试用例: ${testCase.name}`);
    // 注意：写死的使用第二个 chain
    const runnable = getChainList(llm)[1];

    const {
      annotatedCode,
      timeCost,
      wrongStructure = false,
    } = await processCodeExec(testCase.code, runnable);
    let result = {
      testCaseName: testCase.name,
      wrongStructure,
      modelName: name,
      modelFrom: from,
      timeCost,
      testCaseOutput: annotatedCode,
      inputTokensCost: (inputCost * inputTokens) / 1000000,
      outputTokensCost: (outputCost * outputTokens) / 1000000,
    };

    // 如果输出的结构错误（无法解析），直接返回
    if (wrongStructure) {
      return result;
    }

    // 评估
    console.log(`评估测试用例: ${testCase.name}`);
    const evaluation = await evaluate(annotatedCode);
    result = { ...result, ...evaluation };
    return result;
  } catch (error) {
    console.error(`测试模型 ${name} 出错:`, error);
  }
}

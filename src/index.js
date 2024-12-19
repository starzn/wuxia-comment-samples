import { processCodeFile, cli } from "./processCode.js";
import { getChainList } from "./chain.js";
import { Ollama } from "@langchain/ollama";

// 初始化模型
const llm = new Ollama({
  model: "qwen2.5:7b",
  temperature: 1.5, // 高温，降低概论，提高多样性
  frequency_penalty: 1, // 降低已出现token的再次出现概率，增加表达方式多样性
  verbose: true, // 打印模型输出
});

const { whichChain, filePath } = cli();

const runnable = getChainList(llm)[whichChain - 1];

processCodeFile(filePath, runnable);

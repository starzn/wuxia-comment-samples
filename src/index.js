import { processCodeFile, cli } from "./processCodeFile.js";
import { RunnableSequence } from "@langchain/core/runnables";
import { chain1, chain2, chain3 } from "./chain.js";

const { whichChain, filePath } = cli();

const chain = [chain1, chain2, chain3][whichChain - 1];
// 组装成可执行的 runnable
const runnable = RunnableSequence.from(chain);

processCodeFile(filePath, runnable);

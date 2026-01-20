# 武侠风注释生成器

根据代码逻辑为代码生成武侠风格的注释

模型：默认使用`Ollama`跑本地的`qwen2.5:7b`模型，请提前[安装](https://ollama.com/library/qwen2.5)

## 使用方式

```bash
npm run wuxia (序号1～3，代表课程中所讲的提示词工程3个阶段) (要生成注释的代码文件目录，可以用examples目录下的文件)

# 比如
npm run wuxia 1 examples/quick_sort1.js
npm run wuxia 2 examples/quick_sort2.js
npm run wuxia 3 examples/quick_sort3.js
```

## 执行流程（以 `npm run wuxia 1 examples/quick_sort1.js` 为例）

整体流程可以理解为：读取文件 → 调用大模型生成“带武侠注释的代码” → 解析出纯代码 → 覆盖写回原文件。

1. npm 脚本启动 Node 进程
   - `npm run wuxia 1 examples/quick_sort1.js` 会执行 `package.json` 里的脚本：`node src/index.js`
   - 你在命令行里写的 `1` 和 `examples/quick_sort1.js` 会作为参数一并传给 `src/index.js`

2. 入口文件解析参数并选择 chain
   - `src/index.js` 调用 `cli()` 解析参数，拿到 `{ whichChain, filePath }`
   - 根据 `whichChain=1` 选择 `chain1`，再用 `RunnableSequence.from(chain)` 把数组步骤组装成可执行的 runnable
   - 调用 `processCodeFile(filePath, runnable)` 进入文件处理流程

3. 读取目标文件内容并触发 runnable
   - `processCodeFile` 使用 `fs.readFile(filePath, "utf-8")` 把 `examples/quick_sort1.js` 的内容读成字符串 `code`
   - 调用 `generateWuxiaCodeComments(code, runnable)`，内部会执行 `runnable.invoke({ code })`，把源代码作为输入传入整条 chain

4. chain1 的两个步骤
   - 第一步（生成模型输出字符串）：
     - 运行 `prompt1_origin.pipe(llm).invoke({ code: input.code, format_instructions: ... })`
     - `prompt1_origin` 会把 `{code}` 填成源码，把 `{format_instructions}` 填成“输出必须符合某个 JSON 结构”的指令
     - `llm`（Ollama 本地模型）根据提示词返回一段文本，通常是带 JSON 的字符串，字段里包含“带武侠注释的完整代码”
   - 第二步（解析并提取最终代码字符串）：
     - `runnableOutputParser` 调用 `outputParser.parse(input.annotatedCode)` 解析模型返回的字符串
     - 解析成功后返回 `parsed.code`（纯字符串），作为整条 runnable 的最终输出

5. 覆盖写回并输出耗时
   - `processCodeFile` 将 runnable 的输出写回原文件：`fs.writeFile(filePath, annotatedCode, "utf-8")`
   - 控制台输出“生成注释成功”和耗时

注意：这个命令会直接覆盖目标文件内容。如果你希望保留原始代码，建议先备份或用副本文件运行。

## 目录结构

- wuxia-comment/
  - src/：源代码目录
    - index.js：入口文件，处理命令行参数并调用相应的 chain
    - processCodeFile.js：文件处理相关函数
    - chain.js：定义了三条 chain
    - prompt.js：存放所有提示词模板
  - examples/：示例代码目录
    - quick_sort1.js：示例 1（为 chain1 准备）
    - quick_sort2.js：示例 2（为 chain2 准备）
    - quick_sort3.js：示例 3（为 chain3 准备）

### 不同 Chain 的说明

1. Chain1 (最基础版本)

   - 没有明确需求的提示词

2. Chain2 (改进版本)

   - 明确需求（包含了代码分析、武侠元素映射等步骤）的提示词

3. Chain3 (最终版本)

- 明确需求（包含了代码分析、武侠元素映射等步骤）的提示词
- 拆分提示词

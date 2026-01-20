import {
  prompt1_origin,
  prompt2_clarification,
  prompt3_1_codeAnalysis,
  prompt3_2_wuxiaSetting,
  prompt3_3_plotDesign,
  prompt3_4_commentGenerator,
} from "./prompt.js";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { Ollama } from "@langchain/ollama";

// 初始化模型
//使用别的模型（开源/闭源）质量是否更好？
//使用别的模型（开源/闭源）速度是否更快？
//哪些需求可以合并为一条提示词，哪些需要拆分？
//是否针对某些 Runnable 单独使用不同的模型？
const llm = new Ollama({
  model: "qwen2.5:7b",
  temperature: 1.5, // 高温，降低概论，提高多样性
  frequency_penalty: 1, // 降低已出现token的再次出现概率，增加表达方式多样性
  // verbose: true, // 打印模型输出
});

// 创建输出解析器
const outputParser = StructuredOutputParser.fromZodSchema(
  z.object({
    code: z.string().describe("拥有武侠风格注释的完整代码"),
  })
);

// 最后一步的 runnable
async function runnableOutputParser(input) {
  // 解析输出以获取纯代码内容，
  // 带注释的代码
  console.log(input, "runnableOutputParser");
  //这个parse方法可以取出这里面的代码，形成新对象
  const parsed = await outputParser.parse(input.annotatedCode);
  // 解析后的对象包含 code 属性
  //   {
  //   code: '/*\n' +
  //     ' * 快速排序算法在华山派中广为流传，它能够快速将数据排列有序。在这个代码里，我们使用了武侠风格来解释每一个步骤。\n' +
  //     ' */\n' +
  //     '\n' +
  //     'export function quickSort(arr) {\n' +
  //     '    /*\n' +
  //     '     * 门派掌门认为数组只包含一位武者时，自然无需再分门立户、内斗外敌，因此直接返回这位武者。\n' +
  //     '     */\n' +
  //     '    if (arr.length <= 1) return arr;\n' +
  //     '\n' +
  //     '    /*\n' +
  //     '     * 我们选定了一位武艺高强的武林盟主作为轴心点。\n' +
  //     '     */\n' +
  //     '    const pivot = arr[0];\n' +
  //     '\n' +
  //     '    /*\n' +
  //     '     * 在两边设置两个弟子来协助我们分门立户。左边是左堂，用来存放实力不如盟主的弟子；右边则是右堂，用于存放比盟主强的弟子。\n' +
  //     '     */\n' +
  //     '    const left = [];\n' +
  //     '    const right = [];\n' +
  //     '\n' +
  //     '    /*\n' +
  //     '     * 从第二位武者开始遍历整个阵列。\n' +
  //     '     */\n' +
  //     '    for (let i = 1; i < arr.length; i++) {\n' +
  //     '        /*\n' +
  //     '         * 如果当前武者的实力不如盟主，便将他带到左堂去练功。\n' +
  //     '         */\n' +
  //     '        if (arr[i] < pivot) {\n' +
  //     '            left.push(arr[i]);\n' +
  //     '        } else {\n' +
  //     '            /*\n' +
  //     '             * 如果比盟主打不过，那就只能前往右堂接受挑战。\n' +
  //     '             */\n' +
  //     '            right.push(arr[i]);\n' +
  //     '        }\n' +
  //     '    }\n' +
  //     '\n' +
  //     '    /*\n' +
  //     '     * 再次递归进行左边与右边弟子的分门立户工作，并将所有门派按排序后的顺序整合起来。\n' +
  //     '     */\n' +
  //     '    return [...quickSort(left), pivot, ...quickSort(right)];\n' +
  //     '}'
  // }
  console.log(parsed, "parsed");

  // 确保返回的代码是字符串
  if (typeof parsed.code !== "string") {
    throw new Error("Invalid output format: code must be a string");
  }

  return parsed.code;
}

export const chain1 = [
  {
    // processCodeFile文件里  return await runnable.invoke({ code });，所以这个input是对象{ code }
    // 这个函数会自动执行，将执行结果赋值给 annotatedCode
    //所以 runnableOutputParser的参数是如下：
    // {
    //   annotatedCode: '```json\n' +
    //     '{\n' +
    //     '  "code": "/*\\n * 快速排序算法在华山派中广为流传，它能够快速将数据排列有序。在这个代码里，我们使用了武侠风格来解释每一个步骤。\\n */\\n\\nexport function quickSort(arr) {\\n    /*\\n     * 门派掌门认为数组只包含一位武者时，自然无需再分门立户、内斗外敌，因此直接返回这位武者。\\n     */\\n    if (arr.length <= 1) return arr;\\n\\n    /*\\n     * 我们选定了一位武艺高强的武林盟主作为轴心点。\\n     */\\n    const pivot = arr[0];\\n\\n    /*\\n     * 在两边设置两个弟子来协助我们分门立户。左边是左堂，用来存放实力不如盟主的弟子；右边则是右堂，用于存放比盟主强的弟子。\\n     */\\n    const left = [];\\n    const right = [];\\n\\n    /*\\n     * 从第二位武者开始遍历整个阵列。\\n     */\\n    for (let i = 1; i < arr.length; i++) {\\n        /*\\n         * 如果当前武者的实力不如盟主，便将他带到左堂去练功。\\n         */\\n        if (arr[i] < pivot) {\\n            left.push(arr[i]);\\n        } else {\\n            /*\\n             * 如果比盟主打不过，那就只能前往右堂接受挑战。\\n             */\\n            right.push(arr[i]);\\n        }\\n    }\\n\\n    /*\\n     * 再次递归进行左边与右边弟子的分门立户工作，并将所有门派按排序后的顺序整合起来。\\n     */\\n    return [...quickSort(left), pivot, ...quickSort(right)];\\n}"\n' +
    //     '}\n' +
    //     '```'
    // },
  annotatedCode: (input) =>
    prompt1_origin.pipe(llm).invoke({
      code: input.code,
      //outputParser.getFormatInstructions() ==》 输出提示词 ： 
        /* You must format your output as a JSON value that adheres to a given "JSON Schema" instance.
        "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.
        For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
        would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
        Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.
        Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!
        Here is the JSON Schema instance your output must adhere to. Include the enclosing markdown codeblock:
        ```json
        {"type":"object","properties":{"code":{"type":"string","description":"拥有武侠风格注释的完整代码"}},"required":["code"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}
        ``` */
      format_instructions: outputParser.getFormatInstructions(),
    }),
  },
runnableOutputParser,
];

export const chain2 = [
  {
    annotatedCode: (input) =>
      prompt2_clarification.pipe(llm).invoke({
        code: input.code,
        format_instructions: outputParser.getFormatInstructions(),
      }),
  },
  runnableOutputParser,
];

// 构建处理链
//## 数组的前一项就是后一项的输入，第一项的输入是用户输入的代码
export const chain3 = [
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
];

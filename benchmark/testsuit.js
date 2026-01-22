/**
 * 所有待测试模型 https://302.ai/pricing/
 * name: 模型名称
 * from: 模型来源，"api" 表示通过 API 调用，"local" 表示本地模型
 * inputCost: 每百万输入token的成本
 * outputCost: 每百万输出token的成本
 */
export const testModels = [
  // { name: "o1-mini", from: "api", inputCost: 10.5, outputCost: 42 },
  { name: "gpt-4o", from: "api", inputCost: 8.75, outputCost: 35 },
  // {
  //   name: "claude-3-5-sonnet-20241022",
  //   from: "api",
  //   inputCost: 21,
  //   outputCost: 105,
  // },
  {
    name: "claude-sonnet-4-5-20250929",
    from: "api",
    inputCost: 7,
    outputCost: 35,
  },
  // 通义千问系列效果最好的模型，适合复杂、多步骤的任务
  { name: "Qwen-Max", from: "api", inputCost: 22.33, outputCost: 65.45 },
  // 通义千问系列速度最快、成本很低的模型，适合简单任务
  // {
  //   name: "Qwen-Turbo-2024-11-01",
  //   from: "api",
  //   inputCost: 22.33,
  //   outputCost: 65.45,
  // },
  { name: "qwen2.5:7b", from: "local", inputCost: 0, outputCost: 0 },
];

// 测试用例
export const testCase = {
  name: "Quick Sort",
  code: `
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[0];
  const left = [];
  const right = [];
  
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  
  return [...quickSort(left), pivot, ...quickSort(right)];
}`,
};

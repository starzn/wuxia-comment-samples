//【开篇】
// 江湖中有一个任务，是寻找排序之法，让乱序的剑客能够排列出一脉传承。今日吾等就来寻觅此法。
// 【主要功能】
// 排除冗余剑客（即数组长度小于等于1），让其他剑客各自立队

export function quickSort(arr) {

  //【阵势已成】
  if (arr.length <= 1) return arr;

  //【选取首领】
  const pivot = arr[0];

  //【划分左右，左为弟子，右为对手】
  const left = [];
  const right = [];

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < pivot) { 
      left.push(arr[i]); //【弟子归队，左道中立】
    } else {
      right.push(arr[i]); //【对手列阵，右途汹涌】
    }
  }

  //【上下其手，两翼包抄】
  return [...quickSort(left), pivot, ...quickSort(right)]; 
}

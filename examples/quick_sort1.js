/*
 * 快速排序算法在华山派中广为流传，它能够快速将数据排列有序。在这个代码里，我们使用了武侠风格来解释每一个步骤。
 */

export function quickSort(arr) {
    /*
     * 门派掌门认为数组只包含一位武者时，自然无需再分门立户、内斗外敌，因此直接返回这位武者。
     */
    if (arr.length <= 1) return arr;

    /*
     * 我们选定了一位武艺高强的武林盟主作为轴心点。
     */
    const pivot = arr[0];

    /*
     * 在两边设置两个弟子来协助我们分门立户。左边是左堂，用来存放实力不如盟主的弟子；右边则是右堂，用于存放比盟主强的弟子。
     */
    const left = [];
    const right = [];

    /*
     * 从第二位武者开始遍历整个阵列。
     */
    for (let i = 1; i < arr.length; i++) {
        /*
         * 如果当前武者的实力不如盟主，便将他带到左堂去练功。
         */
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            /*
             * 如果比盟主打不过，那就只能前往右堂接受挑战。
             */
            right.push(arr[i]);
        }
    }

    /*
     * 再次递归进行左边与右边弟子的分门立户工作，并将所有门派按排序后的顺序整合起来。
     */
    return [...quickSort(left), pivot, ...quickSort(right)];
}
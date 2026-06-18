import i18n from "./locals";

/**
 * 深度克隆一个对象或数组
 * 
 * 该函数通过递归的方式创建一个新对象或数组，其内部元素与源对象或数组内部元素在值上完全相同，
 * 但彼此之间在内存中是独立的，即修改克隆后的对象或数组不会影响到原始对象或数组
 * 
 * @param source 要克隆的源对象或数组它可以是任何类型的值，但函数主要处理对象和数组类型
 * @returns 返回克隆后的对象或数组如果源不是对象或为null，则直接返回源值
 */
interface MyObject {
    [key: string]: any;
}
function deepClone<T>(source: T): T {
    // 检查源是否不是对象或为null，如果是，则直接返回源值
    if (typeof source !== 'object' || source == null) {
        return source;
    }

    // 初始化目标对象或数组，根据源是数组还是对象来决定目标的类型
    const target:MyObject = Array.isArray(source) ? [] : {};

    // 遍历源对象或数组的所有属性
    for (const key in source) {
        // 确保属性是源对象的直接属性，而不是原型链上的属性
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            // 如果属性值是对象且不为null，则递归调用deepClone进行深度克隆
            if (typeof source[key] === 'object' && source[key] !== null) {
                target[key] = deepClone(source[key]);
            } else {
                // 如果属性值不是对象或为null，则直接复制属性值
                target[key] = source[key];
            }
        }
    }

    // 返回克隆后的对象或数组
    return target as T;
}

// 格式化数字 单位转换 1w 1.2m 1.3k
const Formatter = (num: number) => {
    if (Math.abs(num) > 99999999) {
      return Math.sign(num) * parseFloat((Math.abs(num) / 100000000).toFixed(1)) + 'm'
    } else if (Math.abs(num) > 9999) {
      return Math.sign(num) * parseFloat((Math.abs(num) / 10000).toFixed(1)) + 'w'
    } else if (Math.abs(num) > 999) {
      return Math.sign(num) * parseFloat((Math.abs(num) / 1000).toFixed(1)) + 'k'
    } else {
      return num
    }
}

//时间格式化
function formatDate(date:  Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，所以 +1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default {deepClone, Formatter,formatDate}
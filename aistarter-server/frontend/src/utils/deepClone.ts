/**
 * 深度克隆一个对象或数组
 * 
 * 该函数通过递归的方式创建一个新对象或数组，其内部元素与源对象或数组内部元素在值上完全相同，
 * 但彼此之间在内存中是独立的，即修改克隆后的对象或数组不会影响到原始对象或数组
 * 
 * @param source 要克隆的源对象或数组它可以是任何类型的值，但函数主要处理对象和数组类型
 * @returns 返回克隆后的对象或数组如果源不是对象或为null，则直接返回源值
 */
export function deepClone<T>(source: T): T {
    // 检查源是否不是对象或为null，如果是，则直接返回源值
    if (typeof source !== 'object' || source == null) {
        return source;
    }

    // 初始化目标对象或数组，根据源是数组还是对象来决定目标的类型
    let target = Array.isArray(source) ? [] : {};

    // 遍历源对象或数组的所有属性
    for (let key in source) {
        // 确保属性是源对象的直接属性，而不是原型链上的属性
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            // 如果属性值是对象且不为null，则递归调用deepClone进行深度克隆
            if (typeof source[key] === 'object' && source[key] !== null) {
                (target as any)[key] = deepClone((source as any)[key]);
            } else {
                // 如果属性值不是对象或为null，则直接复制属性值
                (target as any)[key] = (source as any)[key];
            }
        }
    }

    // 返回克隆后的对象或数组
    return target as T;
}
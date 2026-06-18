<template>
  <el-menu :default-active="defaultActive" :unique-opened="true" class="el-menu-vertical-demo w-full">
    <template v-for="item in menu">
      <!-- 如果有子集 -->
      <template v-if="item.child && item.child.length > 0">
        <el-sub-menu :key="item.id" :index="item.level" :disabled="item.meta?.disabled" :popper-append-to-body="false">
          <template #title>
            <i :class="[item.meta?.icon]"></i>
            <!-- 添加空格 表示下级-->
            <span> {{ generateSpaces(item.level) }} </span>
            <el-badge v-if="item.badge&&item.badge>0" :value="item.badge" :offset="[6, 10]">
              <span slot="title"> {{ item.name }}</span>
            </el-badge>
            <span v-else slot="title"> {{ item.name }}</span>
          </template>
          <MenuTree :menu="item.child" :defaultActive="defaultActive" @clickItem="clickItemHandle" />
        </el-sub-menu>
      </template>
      <!-- 如果没有子集 -->
      <template v-else>
        <el-menu-item :key="item.id" :index="item.level" :disabled="item.meta?.disabled" :popper-append-to-body="false"
          @click="clickItemHandle(item)">
          <i :class="[item.meta?.icon]"></i>
          <!-- 添加空格 表示下级-->
          <span> {{ generateSpaces(item.level) }} </span>
          <el-badge v-if="item.badge&&item.badge>0" :value="item.badge" :offset="[6, 10]">
            <span slot="title"> {{ item.name }}</span>
          </el-badge>
          <span v-else slot="title"> {{ item.name }}</span>
        </el-menu-item>
      </template>
    </template>
  </el-menu>
</template>

<script lang="ts" name="MenuTree" setup>
// 把下面代码变成setup语法糖的形式 
import type { PropType } from "vue";
//   import type { MenuItem } from "@/types/lesson";
// type 为了方便写成这样 可以根据自己项目设定type
defineProps({
  menu: {
    type: Array as unknown as PropType<any[]>,
    required: true,
    default: () => [],
  },
  defaultActive: {
    type: String as unknown as PropType<string>,
    required: true,
    default: [],
  },
});

const emit = defineEmits(["update-active-path", "clickItem"]);

// 返回的空格字符串 用于显示菜单层级 
const generateSpaces = (level: string) => {
  let str = "";
  console.log(level.split(""))
  const levelNumbers = level.split("").filter((it) => it != "-");
  // 第一层不显示空格，从第二层开始显示
  if (levelNumbers.length <= 1) {
    return str;
  }
  // 从第二层开始，每层添加一个全角空格
  for (let i = 1; i < levelNumbers.length; i++) {
    str += "　";
  }
  return str;
};

// 点击当前菜单项
const clickItemHandle = (item: any) => {
  emit("clickItem", item);
};
</script>

<style scoped>
.el-menu {
  width: 288px;
}
</style>
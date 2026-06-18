<template>
    <div class="list_icon" :style="{ backgroundColor: bgColor, color: textColor }">
      <b>{{ itemIcon }}</b>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps } from 'vue';
  
  const props = defineProps<{
    pluginName: string;
  }>();
  
  const getItemIcon = function(pluginName: string) {
    const iconText = pluginName.charAt(0).toUpperCase();
    return iconText;
  };
  
  // 根据不同的字母设置不同的背景颜色和字体颜色
  const setColors = (iconText: string) => {
    switch (iconText.toUpperCase()) {
        case 'A':
        return { bgColor: '#FF3366', textColor: '#FFFFFF' }; // 粉色
        case 'B':
        return { bgColor: '#3366FF', textColor: '#FFFFFF' }; // 蓝色
        case 'C':
        return { bgColor: '#FF6633', textColor: '#FFFFFF' }; // 橙色
        case 'D':
        return { bgColor: '#FF3333', textColor: '#FFFFFF' }; // 红色
        case 'E':
        return { bgColor: '#9966FF', textColor: '#FFFFFF' }; // 紫色
        case 'F':
        return { bgColor: '#FFFF33', textColor: '#FFFFFF' }; // 黄色
        case 'G':
        return { bgColor: '#FF33FF', textColor: '#FFFFFF' }; // 粉紫色
        case 'H':
        return { bgColor: '#FF9966', textColor: '#FFFFFF' }; // 橙色
        case 'I':
        return { bgColor: '#FF6699', textColor: '#FFFFFF' }; // 粉色
        case 'J':
        return { bgColor: '#FFCC66', textColor: '#FFFFFF' }; // 黄色
        case 'K':
        return { bgColor: '#FF33CC', textColor: '#FFFFFF' }; // 粉紫色
        case 'L':
        return { bgColor: '#FF6666', textColor: '#FFFFFF' }; // 红色
        case 'M':
        return { bgColor: '#FFFF00', textColor: '#FFFFFF' }; // 黄色
        case 'N':
        return { bgColor: '#66FFCC', textColor: '#FFFFFF' }; // 淡绿色
        case 'O':
        return { bgColor: '#FF6666', textColor: '#FFFFFF' }; // 红色
        case 'P':
        return { bgColor: '#FFFF00', textColor: '#FFFFFF' }; // 黄色
        case 'Q':
        return { bgColor: '#FFCC66', textColor: '#FFFFFF' }; // 橙色
        case 'R':
        return { bgColor: '#FF33FF', textColor: '#FFFFFF' }; // 粉紫色
        case 'S':
        return { bgColor: '#FF3366', textColor: '#FFFFFF' }; // 粉色
        case 'T':
        return { bgColor: '#3366FF', textColor: '#FFFFFF' }; // 蓝色
        case 'U':
        return { bgColor: '#FF6633', textColor: '#FFFFFF' }; // 橙色
        case 'V':
        return { bgColor: '#FF3333', textColor: '#FFFFFF' }; // 红色
        case 'W':
        return { bgColor: '#9966FF', textColor: '#FFFFFF' }; // 紫色
        case 'X':
        return { bgColor: '#FFFF33', textColor: '#FFFFFF' }; // 黄色
        case 'Y':
        return { bgColor: '#FF33CC', textColor: '#FFFFFF' }; // 粉紫色
        case 'Z':
        return { bgColor: '#FF9966', textColor: '#FFFFFF' }; // 橙色
        default:
        return { bgColor: '#333333', textColor: '#FFFFFF' }; // 默认颜色
    }
 };

  
  const itemIcon = getItemIcon(props.pluginName);
  const { bgColor, textColor } = setColors(itemIcon);
  </script>
  
  <style scoped>
  .list_icon {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 46px;
    user-select: none;
    margin-left: 20px;
  }
  </style>
  
<template>
    <component :is="myComponents[currentActive]"></component>
</template>
<style scoped></style>
<script setup lang="ts">
import { PropType, onMounted, ref, reactive, defineAsyncComponent,watch } from 'vue';

const props = defineProps({
    name: {
        type: String as unknown as PropType<string>,
        required: true,
        default: [],
    },
});
watch(()=>props.name,(newValue)=>{
    currentActive.value = "My" + newValue
})
const currentActive = ref("My" + props.name)
const myComponents = reactive<any>({})
onMounted(async () => {
    const modules: any = import.meta.glob('./My*.vue');
    for (const path in modules) {
        // const module = await modules[path]();
        const componentName = path.replace(/^\.\/(.*)\.vue$/, '$1');
        // 方案一 普通引入
        // myComponents[componentName] = module.default;
        // 方案二 异步组件
        // myComponents[componentName] = defineAsyncComponent(()=>import(path));  // 这种用法vite会有警告
        myComponents[componentName] = defineAsyncComponent(modules[path]); // 直接使用meta.glob加载的组件即可
        console.log('myComponents: ', myComponents);
    }
})

</script>
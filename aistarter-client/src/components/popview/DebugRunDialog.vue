<template>
    <el-dialog
      v-model="dialogVisible"
      width="80%"
      center
      @close="close()"
      @open="show()"
    >
        <template #header>
            <div style="padding-left: calc(var(--ep-dialog-padding-primary) + var(--ep-message-close-size, 16px));">
                {{ $t('homeproject.project_share_run') }}
            </div>
        </template>
        <el-row :gutter="20">
            <el-col :span="24">
                <div class="flex justify-center w-full mt-2 mb-2">
                    <el-button type="primary" @click="Debugproject" v-if="!debuging">{{ $t('homeproject.project_share_run_start') }}</el-button>
                    <el-button type="warning" @click="StopDebugproject" v-if="debuging">{{ $t('homeproject.project_share_run_end') }}</el-button>
                </div>
            </el-col>
            <el-col :span="24" class="h-50vh" style="user-select: text;">
                <div class="terminal_box" v-for="(item, i) in terminals" :key="i">
                    <terminal v-show="item.show" :name="item.name" :title="item.name" :context="item.context" context-suffix=" > "
                        :warn-log-count-limit="200" :show-header="item.showHeader" @exec-cmd="onExecCmd" :log-size-limit="500"
                        :auto-help="false" :enable-default-command="false" :init-log="[]">
                        <template #header>
                            <div class="custom-header" tabindex="0">{{ item.name }}</div>
                        </template>
                    </terminal>
                </div>
            </el-col>
        </el-row>
        <template #footer>
            <el-button @click="dialogVisible = false">{{ $t('app.product_details_close') }}</el-button>
        </template>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
const { ipcRenderer } = require('electron');
import { TerminalApi } from "vue-web-terminal";
import 'vue-web-terminal/lib/theme/dark.css';

const dialogVisible = ref(false);
const debuging = ref(false);

const plugin = ref(''); // 假设 plugin 是一个 ref

const terminals = ref<any>([
  {
    show: true,
    name: `terminal`,
    context: '',
    dragConf: {
      width: "100%",
      height: "60%",
      zIndex: 100,
      init: {
        x: 0,
        y: 0
      },
      pinned: true
    },
    showHeader: false
  }
]);

let eventListener: ((event: Electron.IpcRendererEvent, text: string) => void) | null = null;

const handleTerminalMessage = (event: Electron.IpcRendererEvent, text: string) => {
    TerminalApi.pushMessage(`terminal-${plugin.value}`, text);
};

async function Debugproject() {
    debuging.value = true;
    await ipcRenderer.invoke('project-debug-run-plugin', plugin.value);
}

async function StopDebugproject() {
    debuging.value = false;
    exit()
}

async function show() {
    eventListener = (event: Electron.IpcRendererEvent, text: string) => {
        handleTerminalMessage(event, text);
    };
    ipcRenderer.on(`on-plugin-terminal-message-${plugin.value}`, eventListener);

    // 确保对话框打开后设置焦点
    await nextTick();
    const focusElement = document.querySelector('.custom-header');
    if (focusElement) {
        (focusElement as HTMLElement).focus();
    }
}
 
async function exit() {
    await ipcRenderer.invoke('project-exit-plugin-instance', plugin.value);
    if (eventListener) {
        ipcRenderer.removeListener(`on-plugin-terminal-message-${plugin.value}`, eventListener);
    }
}

async function close() {
    TerminalApi.clearLog(`terminal-${plugin.value}`);
    exit();
    debuging.value = false;
    await ipcRenderer.invoke('plugin-list-info')
}

function onExecCmd(key: string, command: string, success: Function, failed: Function) {
    if (key == "cls" || key == "clear") {
        TerminalApi.clearLog(`terminal-${plugin.value}`);
    }
    success();
}

async function openDebugRun(pluginName: string) {
    dialogVisible.value = true;
    plugin.value = pluginName;
    terminals.value[0].name = `terminal-${pluginName}`;
}

defineExpose({
    openDebugRun
});
</script>
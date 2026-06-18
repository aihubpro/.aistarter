const fs = require('fs');
const path = require('path');

// 指定你的源代码目录
const sourceDir = "./app"; // 从app目录提取文件
const extractDir = "./extract/app"; // 目标提取目录

// 需要提取的文件列表
const filesToExtract = [
    'main.js',
    'config.js', 
    'dir.js', 
    'plugin.js', 
    'updater.js', 
    'gpu.js', 
    'zip.js', 
    'constants.js', 
    'download.js', 
    'preload.js', 
    'torrent.js', 
    'tray.js', 
    'project.js', 
    'config/main_js_data.js', 
    'config/project_script_list.js', 
    'resources.js', 
    'torrent_helper.js', 
    'zip_helper.js'
];

// 确保目标目录存在
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`创建目录: ${dirPath}`);
    }
}

// 复制文件
function copyFile(sourcePath, targetPath) {
    try {
        // 确保目标文件的目录存在
        const targetDir = path.dirname(targetPath);
        ensureDirectoryExists(targetDir);
        
        // 复制文件
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✓ 复制成功: ${sourcePath} -> ${targetPath}`);
        return true;
    } catch (error) {
        console.error(`✗ 复制失败: ${sourcePath} - ${error.message}`);
        return false;
    }
}

// 主提取函数
function extractFiles() {
    console.log('开始提取文件...');
    console.log(`源目录: ${sourceDir}`);
    console.log(`目标目录: ${extractDir}`);
    console.log('=' .repeat(50));
    
    // 确保提取目录存在
    ensureDirectoryExists(extractDir);
    
    let successCount = 0;
    let failCount = 0;
    
    // 遍历文件列表并复制
    filesToExtract.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(extractDir, file);
        
        if (fs.existsSync(sourcePath)) {
            if (copyFile(sourcePath, targetPath)) {
                successCount++;
            } else {
                failCount++;
            }
        } else {
            console.warn(`⚠ 文件不存在: ${sourcePath}`);
            failCount++;
        }
    });
    
    console.log('=' .repeat(50));
    console.log(`提取完成! 成功: ${successCount}, 失败: ${failCount}`);
    
    if (failCount > 0) {
        console.log('\n请检查失败的文件路径是否正确。');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    extractFiles();
}

// 导出函数供其他模块使用
module.exports = {
    extractFiles,
    filesToExtract,
    sourceDir,
    extractDir
};


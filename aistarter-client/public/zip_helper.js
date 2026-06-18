const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const tar = require('tar');
var DecompressZip = require('decompress-zip');
const StreamZip = require('node-stream-zip');
const { exec } = require('child_process');
const util = require('util');
const zlib = require('zlib');
const execPromise = util.promisify(exec);
// 检查文件是否是可执行文件
async function isExecutableFile(filePath) {
  if (process.platform !== 'darwin') return false;
  
  try {
    const { stdout } = await execPromise(`file "${filePath}"`);
    return stdout.toLowerCase().includes('executable') || 
           stdout.toLowerCase().includes('script');
  } catch (error) {
    console.error('Error checking file type:', error);
    return false;
  }
}

// 统计目录中的文件数量
async function countFilesInDirectory(directory) {
  let totalFiles = 0;
  const visited = new Set();

  async function countFiles(dir) {
    if (visited.has(dir)) return;
    visited.add(dir);

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    totalFiles++;
    const promises = entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        const realPath = await new Promise((resolve, reject) => {
          fs.realpath(entryPath, (err, resolvedPath) => {
            if (err) {
              reject(err);
            } else {
              resolve(resolvedPath);
            }
          });
        });

        if (!visited.has(realPath)) {
          await countFiles(realPath);
        }
      } else if (entry.isDirectory()) {
        await countFiles(entryPath);
      } else {
        totalFiles++;
      }
    });
    await Promise.all(promises);
  }

  await countFiles(directory);
  return totalFiles;
}

// 通用解压函数
async function unzipHelper(zipPath, extractPath, callbacks = {}) {
  try {
    await fs.promises.mkdir(extractPath, { recursive: true });

    return await new Promise((resolve, reject) => {
      const zip = new StreamZip({ file: zipPath });
      let extractCount = 0;

      zip.on('error', err => {
        console.error('解压错误:', err);
        if(callbacks.error) {
          callbacks.error(err);
        }
        reject(false);
      });

      zip.on('ready', () => {
        const totalCount = zip.entriesCount;
        console.log('文件总数:', totalCount);
        
        zip.extract(null, extractPath, async (err, count) => {
          if (err) {
            console.error('解压失败:', err);
            reject(false);
          } else {
            console.log(`解压完成，共 ${count} 个文件`);
            

            if(callbacks.progress) {
              callbacks.progress(100);
            }
            if(callbacks.success) {
              callbacks.success(count);
            }
            zip.close();
            resolve(true);
          }
        });
      });

      zip.on('extract',async (entry, outpath) => {
        extractCount++;
        if(callbacks.progress) {
          const percent = (extractCount / zip.entriesCount) * 100;
          callbacks.progress(percent.toFixed(2));
        }
        // 在 macOS和linux 上检查文件扩展名并设置可执行权限
        if (process.platform === 'darwin' || process.platform === 'linux') {
          try {
            const fullPath = path.join(extractPath, entry.name);
            const ext = path.extname(fullPath).toLowerCase();
            // 只对无扩展名文件和.sh脚本设置权限
            if (!entry.isDirectory && (ext === '' || ext === '.sh')) {
              await fs.promises.chmod(fullPath, 0o755);
            }
          } catch (error) {
            console.error('Error setting file permission:', error);
          }
        }
      });
    });
  } catch (error) {
    console.error('解压异常:', error);
    return false;
  }
}

// 通用解压 tar 函数
async function untarHelper(tarPath, extractPath, callbacks = {}) {
  try {
    await fs.promises.mkdir(extractPath, { recursive: true });

    return await new Promise((resolve, reject) => {
      let extractedCount = 0;
      let totalEntries = 0; // tar 包通常没有直接获取总条目的方法，可能需要预先读取或估算

      const stream = tar.extract({
        cwd: extractPath,
        preservePermissions: true, // 确保保留原始权限
        onentry: (entry) => {
          // 估算总条目，如果需要精确进度，可能需要更复杂的逻辑
          totalEntries++; 
          extractedCount++;
          if (callbacks.progress) {
            // 这里的进度可能不准确，因为 totalEntries 是动态增长的
            const percent = (extractedCount / (totalEntries > 0 ? totalEntries : 1)) * 100;
            callbacks.progress(percent.toFixed(2));
          }
        },
      });

      const readStream = fs.createReadStream(tarPath);
      const gunzip = zlib.createGunzip();

      readStream.on('error', (err) => {
        console.error('读取 tar 文件错误:', err);
        if (callbacks.error) {
          callbacks.error(err);
        }
        reject(false);
      });

      gunzip.on('error', (err) => {
        console.error('解压 gzip 错误:', err);
        if (callbacks.error) {
          callbacks.error(err);
        }
        reject(false);
      });

      stream.on('error', (err) => {
        console.error('解压 tar 错误:', err);
        if (callbacks.error) {
          callbacks.error(err);
        }
        reject(false);
      });

      stream.on('close', () => {
        console.log(`解压 tar 完成，共 ${extractedCount} 个文件`);
        if (callbacks.progress) {
          callbacks.progress(100);
        }
        if (callbacks.success) {
          callbacks.success(extractedCount);
        }
        resolve(true);
      });

      readStream.pipe(gunzip).pipe(stream);
    });
  } catch (error) {
    console.error('解压 tar 异常:', error);
    return false;
  }
}
// 通用压缩函数
async function createZipArchive({ 
  sourcePaths, 
  outputPath, 
  callbacks = {},
  options = { zlib: { level: 9 } } 
}) {
  try {
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 如果输出文件已存在，先删除
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', options);

    let totalFiles = 0;
    let countFileFinished = false;

    // 设置事件监听
    output.on('close', () => {
      if (callbacks.close) {
        callbacks.close(archive.pointer());
      }
    });


    archive.on('warning', (err) => {
      if (callbacks.warning) {
        callbacks.warning(err);
      }
      if (err.code !== 'ENOENT') {
        throw err;
      }
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.on('progress', (progress) => {
      if (countFileFinished && callbacks.progress) {
        const percentComplete = totalFiles > 0 
          ? (progress.entries.processed / totalFiles) * 100 
          : 0;
        callbacks.progress(percentComplete.toFixed(2));
      }
    });

    archive.pipe(output);

    // 处理每个源路径
    for (const source of sourcePaths) {
      const { path: itemPath, name: itemName } = typeof source === 'string' 
        ? { path: source, name: source }
        : source;

      try {
        const stat = await fs.promises.stat(itemPath);

        if (stat.isDirectory()) {
          archive.directory(itemPath, itemName, (entry) => {
            try {
              const fullPath = path.join(itemPath, entry.name);
              return fs.lstatSync(fullPath).isSymbolicLink() ? false : entry;
            } catch (error) {
              console.error('Error checking symlink:', error);
              return false;
            }
          });
          totalFiles += await countFilesInDirectory(itemPath);
        } else if (stat.isFile()) {
          archive.file(itemPath, { name: itemName || path.basename(itemPath) });
          totalFiles++;
        }
      } catch (error) {
        console.error('Error getting file stats:', error);
      }
    }

    countFileFinished = true;
    await archive.finalize();
    return outputPath;
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
}

//通用的压缩函数（tar）
async function createTarArchive({ 
  sourcePaths, 
  outputPath, 
  callbacks = {},
  options = {} 
}) {
  try {
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 如果输出文件已存在，先删除
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('tar', { ...options,gzip: true, preservePermissions: true }); // preservePermissions: true 选项用于保留文件权限 gzip: true 选项用于启用 gzip 压缩 后缀名自动为 .tar.gz

    let totalFiles = 0;
    let countFileFinished = false;

    // 设置事件监听
    output.on('close', () => {
      if (callbacks.close) {
        callbacks.close(archive.pointer());
      }
    });

    archive.on('warning', (err) => {
      if (callbacks.warning) {
        callbacks.warning(err);
      }
      if (err.code !== 'ENOENT') {
        throw err;
      }
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.on('progress', (progress) => {
      if (countFileFinished && callbacks.progress) {
        const percentComplete = totalFiles > 0 
          ? (progress.entries.processed / totalFiles) * 100 
          : 0;
        callbacks.progress(percentComplete.toFixed(2));
      }
    });

    archive.pipe(output);

    // 处理每个源路径
    for (const source of sourcePaths) {
      const { path: itemPath, name: itemName } = typeof source === 'string' 
        ? { path: source, name: source }
        : source;

      try {
        const stat = await fs.promises.stat(itemPath);

        if (stat.isDirectory()) {
          archive.directory(itemPath, itemName, (entry) => {
            try {
              const fullPath = path.join(itemPath, entry.name);
              return fs.lstatSync(fullPath).isSymbolicLink() ? false : entry;
            } catch (error) {
              console.error('Error checking symlink:', error);
              return false;
            }
          });
          totalFiles += await countFilesInDirectory(itemPath);
        } else if (stat.isFile()) {
          archive.file(itemPath, { name: itemName || path.basename(itemPath) });
          totalFiles++;
        }
      } catch (error) {
        console.error('Error getting file stats:', error);
      }
    }

    countFileFinished = true;
    await archive.finalize();
    return outputPath;
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
}

module.exports = {
  countFilesInDirectory,
  createZipArchive,
  createTarArchive,
  unzipHelper,
  untarHelper,
};
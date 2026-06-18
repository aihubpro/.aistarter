const pool = require('../database')
const fs = require('fs');
const path = require('path');

function sendFileWithCache(req, res, imagePath, stats, contentType = 'image/png') {
  // 设置缓存过期时间
  const cacheTime = 10 * 24 * 60 * 60 * 1000;// 10天
  const expires = new Date(Date.now() + cacheTime);
  res.setHeader('Expires', expires.toUTCString());
  res.setHeader('Cache-Control', `public, max-age=${cacheTime / 1000}`);
  // 处理 If-Modified-Since 请求头，检查文件是否已更改
  const lastModified = stats.mtime.toUTCString();
  const ifModifiedSince = req.headers['if-modified-since'];

  if (ifModifiedSince === lastModified) {
    // 文件未更改，返回 304 Not Modified
    res.writeHead(304);
    res.end();
  } else {
    // 创建可读流
    const readStream = fs.createReadStream(imagePath);

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Last-Modified', lastModified);
    // 新增：返回图片信息
    res.setHeader('X-Image-Name', path.basename(imagePath));
    res.setHeader('X-Image-Size', stats.size);
    res.setHeader('X-Image-MTime', stats.mtime.getTime());

    // 处理流错误
    readStream.on('error', () => {
      res.status(500).send('Error reading image file');
    });

    // 当数据准备好时发送给客户端
    readStream.pipe(res);
  }
}

//AI Starter 接口
const marketImages = async (req, res) => {
  const baseFileDir = req.params.userId;
  const baseFileName = req.params.fileName;
  const tmpDir = req.query.tmpDir ? Number(req.query.tmpDir) : 0;

  let uploadDir = "upload";
  if(tmpDir == 1){
    uploadDir = "upload_tmp"
  }

  const imagePath = path.join(".", uploadDir, baseFileDir, baseFileName);

  // 检查文件是否存在
  fs.stat(imagePath, (err, stats) => {
    if (err) {
      // 如果文件不存在，则返回 404 错误
      res.status(404).send('Image not found');
    } else {
      sendFileWithCache(req, res, imagePath, stats, 'image/png');
    }
  });
}

//AI Starter 接口 (模型，插件，工作流)
const marketResImages = async (req, res) => {
  const baseFileType = req.params.resource;
  const baseFileDir = req.params.userId;
  const baseFileName = req.params.fileName;
  const tmpDir = req.query.tmpDir ? Number(req.query.tmpDir) : 0;

  let uploadDir = "upload";
  if(tmpDir == 1){
    uploadDir = "upload_tmp"
  }

  const imagePath = path.join(".", uploadDir,baseFileType, baseFileDir, baseFileName);

  // 检查文件是否存在
  fs.stat(imagePath, (err, stats) => {
    if (err) {
      // 如果文件不存在，则返回 404 错误
      res.status(404).send('Image not found');
    } else {
      sendFileWithCache(req, res, imagePath, stats, 'image/png');
    }
  });
}

// AI Starter 接口 (用户个人信息)
const userImages = async (req, res) => {
  const baseFileDir = req.params.userId;
  const baseFileName = req.params.fileName;

  let uploadDir = "userinfo";

  const imagePath = path.join(".", uploadDir, baseFileDir, baseFileName);

  // 检查文件是否存在
  fs.stat(imagePath, (err, stats) => {
    if (err) {
      // 如果文件不存在，则返回 404 错误
      res.status(404).send('Image not found');
    } else {
      sendFileWithCache(req, res, imagePath, stats, 'image/png');
    }
  });
}
//
//AI Starter 接口 (用户评论)
const userCommentImages = async (req, res) => {
  const baseFileDir = req.params.userId;
  const baseFileName = req.params.fileName;

  let uploadDir = "comment";

  const imagePath = path.join(".", uploadDir, baseFileDir, baseFileName);
  // 检查文件是否存在
  fs.stat(imagePath, (err, stats) => {
    if (err) {
      // 如果文件不存在，则返回 404 错误
      res.status(404).send('Image not found');
    } else {
      sendFileWithCache(req, res, imagePath, stats, 'image/png');
    }
  });
}

module.exports = {
  marketImages,
  marketResImages,
  userImages,
  userCommentImages
}

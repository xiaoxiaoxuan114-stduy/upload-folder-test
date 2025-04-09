const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 处理上传
app.post('/upload', upload.array('files'), async (req, res) => {
  const uploadDir = path.join(__dirname, 'upload');

  try {
    await fs.ensureDir(uploadDir);

    // 修复：逐个处理文件，确保路径解码和目录创建
    for (const file of req.files) {
      // 解码中文路径（关键修复点）
      const decodedPath = decodeURIComponent(file.originalname);
      const fullPath = path.join(uploadDir, decodedPath);

      // 路径安全检查
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
        return res.status(500).json({
          success: false,
          message: '非法路径操作'
        });
      }

      // 检查重名
      if (await fs.pathExists(fullPath)) {
        return res.status(500).json({
          success: false,
          message: '文件/目录重名'
        });
      }

      // 递归创建目录
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.buffer);
    }

    res.json({ success: true, message: '上传成功' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

app.listen(3333, () => console.log('服务器运行在 http://localhost:3333'));
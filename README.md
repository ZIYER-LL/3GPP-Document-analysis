# 3GPP Document Analysis Agent Platform

一个面向 **3GPP 文稿分析** 与 **会议纪要生成** 的智能平台。

平台将 **TDoc 清单、原始文稿、压缩包解析、本地大模型、语音转写** 结合起来，提供接近主流问答平台 / 会议纪要平台的使用体验：  
用户通过页面或聊天输入任务，系统自动完成文稿定位、下载、解压、解析、摘要、对比分析，以及会议录音转写与 AI 纪要生成。

---

## 项目能力

当前系统支持以下核心功能：

### 文稿处理
- 导入 3GPP TDoc 清单（Excel / xlsx / xlsm）
- 解析 TDoc 元数据与下载链接
- 按 `Agenda Item` 分组展示文稿
- 浏览单篇文稿详情
- 自动下载原始文稿
- 自动解压 zip / 嵌套 zip
- 提取正文内容
- 生成单篇文稿中文摘要
- 导出 Markdown / DOCX 报告

### Agent 任务分析
- 通过自然语言输入任务
- 自动识别会议清单与 `Agenda Item`
- 自动筛选对应文稿
- 批量生成单篇分析与总报告
- 支持聊天会话历史
- 支持同一会话内上下文继承

### 跨文稿对比
- 对同一 `Agenda Item` 下多篇文稿进行横向比较
- 输出不同来源 / 联系人 / 观点之间的差异、共识与潜在冲突
- 支持生成对比报告

### 会议纪要
- 上传会议音频 / 视频文件
- 执行语音转写，生成 transcript
- 生成 AI 会议纪要
- 展示会议摘要、关键结论、待办事项、风险点

---

## 系统结构

项目分为三层：

### 1. 前端
基于 **Next.js**，提供：

- 文稿导入页
- 文稿列表页
- 单篇文稿详情页
- Agent 聊天页
- 任务进度页
- 会议纪要页

### 2. 业务后端
基于 **FastAPI**，负责：

- Excel 导入
- 文稿元数据解析
- 文稿下载与解压
- 正文提取
- 任务编排
- 报告生成
- 会议转写任务管理
- 调用模型服务

### 3. 模型服务
独立运行的本地模型服务，负责：

- 加载本地 Qwen 模型
- 文稿摘要生成
- 跨文稿对比分析
- 会议纪要生成

---

## 典型使用方式

### 文稿分析
用户输入：

> 请帮我分析 TDoc_List_Meeting_SA2#174 中 AGENDA3 的文稿

系统自动执行：

1. 识别会议清单与 Agenda  
2. 找到对应文稿  
3. 下载原始文件  
4. 解压压缩包 / 嵌套压缩包  
5. 提取正文  
6. 调用模型生成摘要  
7. 输出单篇报告与总报告  

### 文稿对比
用户输入：

> 请帮我对比 TDoc_List_Meeting_SA2#174 中 AGENDA19.10.2 的文稿

系统自动执行：

1. 找到同一 Agenda 下全部文稿  
2. 优先复用已有单篇摘要  
3. 调用模型生成跨文稿对比结果  
4. 输出差异点、共识点、潜在冲突与重点文稿  

### 会议纪要
用户操作：

1. 上传会议录音 / 视频  
2. 点击“开始转写”  
3. 查看 transcript  
4. 点击“生成 AI 纪要”  
5. 查看会议摘要与行动项  

---

## 技术栈

### 前端
- Next.js
- React
- TypeScript
- Tailwind CSS

### 后端
- FastAPI
- SQLAlchemy
- SQLite
- openpyxl
- requests / httpx

### 文稿处理
- PyMuPDF
- python-docx
- zipfile

### 语音转写
- faster-whisper
- ffmpeg / ffprobe

### 模型服务
- transformers
- torch
- accelerate
- 本地 Qwen 模型

---

## 目录结构

```text
3gpp-tdoc-backend/
├── app/
│   ├── api/v1/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── data/
├── uploads/
├── downloads/
└── .env

model_service/
├── app.py
├── summarizer.py
└── requirements.txt

3gpp-tdoc-frontend/
├── app/
│   ├── documents/
│   ├── chat/
│   ├── meetings/
│   └── layout.tsx
├── components/
│   ├── chat/
│   ├── jobs/
│   └── meetings/
└── lib/

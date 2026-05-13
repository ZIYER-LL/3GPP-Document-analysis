# 3GPP Document Analysis Agent Platform

一个面向 3GPP 行业文稿的智能分析平台。

项目目标是将 3GPP 会议文稿清单、原始文稿、压缩包、多层嵌套附件与本地大模型能力结合起来，构建一个类似问答平台的使用体验：用户输入自然语言任务，系统自动完成文稿定位、下载、解压、解析、逐篇分析和报告生成。

---

## 1. 项目简介

本项目主要面向 3GPP 文稿处理场景，支持以下核心能力：

- 导入 3GPP TDoc 清单（Excel / xlsx / xlsm）
- 解析 TDoc 元数据与超链接
- 按 `Agenda Item` 分组展示文稿
- 浏览单篇文稿详情
- 调用本地模型生成文稿摘要
- 处理压缩包与嵌套压缩包中的文稿
- 逐篇生成分析结果
- 输出 Markdown / DOCX 报告
- 逐步演进为“聊天式任务入口 + 智能体工作流编排”的平台

---

## 2. 当前产品形态

当前系统分为三层：

### 前端
本地运行的 Next.js 页面，提供：

- 文稿清单导入入口
- 文稿列表页
- 按 `Agenda Item` 分组展示
- 单篇文稿详情页
- AI 文稿分析按钮
- 分析结果下载入口

### 业务后端
集群侧运行的 FastAPI 服务，负责：

- 处理 Excel 导入
- 解析 TDoc 元数据
- 存储文稿记录
- 下载原始文稿
- 解压压缩包
- 提取正文
- 调用模型服务
- 保存分析结果
- 提供下载接口

### 模型服务
集群侧运行的本地模型服务，负责：

- 加载本地 Qwen 模型
- 接收正文文本与元数据
- 输出中文摘要
- 为后端提供统一的模型调用接口

---

## 3. 项目目标

本项目最终希望支持如下自然语言任务：

> 请帮我分析 TDoc_List_Meeting_SA2#174 中 AGENDA3 的文稿

系统自动执行：

1. 识别目标会议清单
2. 找到指定 Agenda Item 下的文稿
3. 逐篇下载原始文稿
4. 自动解压 zip / 嵌套压缩包
5. 提取正文
6. 调用本地模型逐篇分析
7. 生成单篇报告
8. 生成总报告
9. 在前端以问答式任务结果展示

---

## 4. 核心功能

### 4.1 文稿清单导入
支持导入 3GPP 官方 TDoc 清单 Excel 文件，自动读取：

- `TDoc`
- `Title`
- `Source`
- `Contact`
- `Type`
- `For`
- `Abstract`
- `Agenda Item`
- `Agenda item description`
- `Release`
- `Spec`
- `CR`
- `CR rev`
- 文稿下载超链接

### 4.2 文稿管理
支持：

- 文稿列表查看
- 单篇详情查看
- 按 `Agenda Item` 分组
- 逐条进入“去分析”页面

### 4.3 文稿下载与解压
支持：

- 根据 TDoc 超链接下载原始文稿
- 识别压缩包
- 解压 zip
- 递归处理嵌套 zip
- 找到可分析文件（pdf/docx/txt/md）

### 4.4 文稿分析
支持：

- 单篇文稿摘要
- 本地模型生成中文分析结果
- 分析状态跟踪
- 分析结果存库

### 4.5 报告导出
支持：

- Markdown 导出
- DOCX 导出

---

## 5. 技术栈

### 前端
- Next.js
- React
- TypeScript
- Tailwind CSS

### 后端
- FastAPI
- SQLAlchemy
- SQLite（当前开发阶段）
- httpx
- openpyxl

### 文稿处理
- PyMuPDF
- python-docx
- zipfile（标准库）
- 自定义递归解压逻辑

### 模型侧
- transformers
- torch
- accelerate
- 本地 Qwen 模型

---

## 6. 当前目录结构（建议）

```text
3gpp-tdoc-backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── documents.py
│   │       ├── imports.py
│   │       └── health.py
│   ├── core/
│   │       ├── config.py
│   │       └── database.py
│   ├── models/
│   │       ├── document.py
│   │       └── import_job.py
│   ├── services/
│   │       ├── excel_importer.py
│   │       ├── classifier.py
│   │       ├── downloader.py
│   │       ├── archive_handler.py
│   │       ├── text_extractor.py
│   │       └── model_client.py
│   └── main.py
├── data/
├── uploads/
├── downloads/
└── .env
3gpp-tdoc-frontend/
├── app/
│   ├── page.tsx
│   ├── import/
│   │   └── page.tsx
│   ├── documents/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   ├── Navbar.tsx
│   ├── AgendaGroupedDocuments.tsx
│   └── DocumentSummaryPanel.tsx
└── lib/
    └── api.ts
用户输入任务指令
-> Agent 解析任务意图
-> 定位会议清单与 Agenda Item
-> 筛选文稿集合
-> 逐篇下载 / 解压 / 提取 / 摘要
-> 逐篇生成报告
-> 汇总生成总报告
-> 返回任务结果

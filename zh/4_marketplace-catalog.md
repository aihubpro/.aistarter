[中文](../zh/4_marketplace-catalog.md) | [English](../en/4_marketplace-catalog.md)

## 🧠 市场清单

AIStarter 市场持续收录并更新各类 **AI 项目、模型、插件与工作流**，覆盖图像生成、语音合成、视频处理、大语言模型、多模态交互等多个方向。所有内容均支持 **一键安装、本地运行、离线使用**，无需手动配置环境。

> ✅ 所有项目均由社区创作者或官方团队维护，**每周新增/更新**，确保您始终使用最新、最稳定的 AI 工具。

### 📦 AI 项目清单

| 项目名称 | 功能类型 | 支持系统 | 一键安装 |
|----------|----------|----------|----------|
| **Ollama + OpenWebUI** | 本地大语言模型运行 + Web 聊天界面 | Win / MacOS / Linux | ✅ |
| **ComfyUI** | 可视化节点式 AI 绘图工具 | Win / MacOS / Linux | ✅ |
| **Stable Diffusion WebUI** | 图像生成 + 丰富插件生态 | Win / MacOS / Linux | ✅ |
| **Fooocus** | 极简 Stable Diffusion 前端，专注出图质量 | Win / MacOS / Linux | ✅ |
| **GPT-SoVits V2** | 高质量语音克隆 + TTS（文本转语音） | Windows | ✅ |
| **Rope / AnythingLLM** | 本地知识库 + RAG 问答系统 | Win / MacOS / Linux | ✅ |
| **Whisper Desktop** | 多语言语音识别（支持中英日韩等） | 全平台 | ✅ |
| **KoboldCPP / LM Studio** | 本地小说/角色对话生成 | 全平台 | ✅ |
| **FaceFusion / FacePoke** | 视频人脸替换、换脸合成 | Windows | ✅ |
| **AnimateDiff** | 文本/图像生成动画视频 | 全平台 | ✅ |
| **Text2Video-Zero** | 无需训练的文本转视频模型 | 全平台 | ✅ |
| **OpenWebUI** | 通用 LLM 聊天界面，支持多后端 | 全平台 | ✅ |
| **SD.Next (Vladmandic)** | SD WebUI 高性能优化版 | Win / MacOS / Linux | ✅ |
| **ComfyUI Manager** | ComfyUI 插件与节点管理器 | 全平台 | ✅ |
| **ChatTTS** | 中文语音合成，拟真自然 | 全平台 | ✅ |

> 💡 **持续新增中**：包括 RVC（变声）、SadTalker（数字人）、Stable Audio（音乐生成）、Llama.cpp（CPU 推理）等项目即将上线。

### 🤖 模型清单

| 模型名称 | 模型类型 | 主要用途 | 支持硬件 |
|----------|----------|----------|----------|
| **Llama 3 / Llama 3.1** | 大语言模型（LLM） | 通用对话、代码生成、逻辑推理 | GPU / CPU |
| **DeepSeek / DeepSeek-Coder** | 中英双语 LLM | 编程辅助、知识问答 | GPU / CPU |
| **Mistral / Mixtral (MoE)** | 高效稀疏 LLM | 轻量高速推理，适合本地部署 | GPU / CPU |
| **Gemma / Gemma 2** | Google 开源轻量模型 | 教育、研究、嵌入式场景 | GPU |
| **Qwen / Qwen-VL** | 通义千问系列 | 中文对话、多模态理解 | GPU / CPU |
| **Stable Diffusion XL (SDXL)** | 文生图模型 | 高清艺术创作、商业设计 | GPU |
| **Flux / Juggernaut** | 现代文生图模型 | 风格化图像生成 | GPU |
| **ControlNet 系列** | 条件控制模型 | 线稿/深度/姿态/边缘控制绘图 | GPU |
| **Wav2Lip** | 视频配音模型 | 语音驱动嘴型同步 | GPU |
| **Whisper (large-v3)** | 语音识别模型 | 多语言转录、字幕生成 | GPU / CPU |
| **MusicGen / AudioLDM** | 音乐生成模型 | 文本生成背景音乐、音效 | GPU |
| **Real-ESRGAN / 4x-UltraSharp** | 图像超分模型 | 画质修复、放大增强 | GPU |
| **GFPGAN / CodeFormer** | 人脸修复模型 | 模糊人脸清晰化 | GPU |

> 🔄 **模型自动管理**：AIStarter 支持按项目自动下载所需模型，也可手动添加自定义模型。

### 🔌 插件清单

| 插件名称 | 功能描述 |
|----------|----------|
| **ControlNet** | 提供线稿、深度图、姿态、Canny 等多种绘图控制方式 |
| **IP-Adapter** | 图像风格迁移 + 人脸特征注入，实现“以图生图” |
| **LoRA Manager** | 一键加载/切换 LoRA 微调模型，支持批量管理 |
| **Tiled VAE / VAE Decode** | 突破显存限制，支持 2K+ 高分辨率图像生成 |
| **SDXL Refiner** | 对 SDXL 生成图像进行二阶段细节优化 |
| **AnimateDiff Extension** | 在 ComfyUI 或 WebUI 中生成流畅动画 |
| **Segment Anything (SAM)** | 通用图像分割，支持任意对象抠图 |
| **Face Restore / GFPGAN** | 自动修复模糊、低质人脸图像 |
| **TTS Fusion** | 集成多种语音引擎，支持中英混合 TTS |
| **Dynamic Prompts** | 随机/条件化提示词生成，提升出图多样性 |
| **ADetailer** | 自动检测并重绘人脸、手部等细节区域 |
| **Regional Prompter** | 分区域控制提示词，实现局部风格定制 |

### 🌀 工作流清单

| 工作流名称 | 功能描述 |
|------------|----------|
| **图像生成工作流** | 文本 → 图像（Stable Diffusion + ControlNet + LoRA） |
| **视频人脸替换** | 输入视频 + 目标人脸 → 生成换脸视频（FaceFusion） |
| **语音克隆与 TTS** | 录音 → 克隆声音 → 文本转语音（GPT-SoVits） |
| **数字人交互系统** | 文本输入 → 语音合成 + 嘴型驱动 + 视频输出 |
| **多模态问答** | 图片 + 文本 → AI 理解并回答（Qwen-VL / LLaVA） |
| **AI 视频剪辑** | 自动字幕（Whisper） + 场景生成（SD） + 动画合成（AnimateDiff） |
| **AI 内容工厂** | LLM 自动写文案 + SD 生成配图 + TTS 生成配音 |
| **ComfyUI 节点工作流** | 可视化搭建：高清修复 → 风格迁移 → 动画导出 |
| **本地知识库问答** | PDF/Word 导入 → 向量检索 → LLM 回答（Rope） |

> 🌟 **创作者共建生态**：  
> 任何用户均可上传自己的项目、模型或工作流到市场，设置免费或付费，享受 **创作者分成 + 邀请码返现 + 优惠卷奖励** 多重收益。

> 📥 **持续更新**：  
> 市场每周平均新增 5–10 个高质量项目，紧跟 GitHub 开源社区最新动态。
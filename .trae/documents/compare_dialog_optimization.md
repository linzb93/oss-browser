# 计划：优化图片对比弹窗

本文档描述如何优化图片对比弹窗（[Compare.vue](file:///Users/linzhibin/Documents/GitHub/oss-browser/src/renderer/views/fileList/components/Compare.vue) + [useCompare.ts](file:///Users/linzhibin/Documents/GitHub/oss-browser/src/renderer/views/fileList/hooks/useCompare.ts)），使其尺寸随图片动态变化并满足边界约束，同时调整布局以更好地展示图片。

## 目标

1. 弹窗宽高根据图片尺寸动态计算并展示。
2. 弹窗宽高约束：
   - 宽度：最小为客户端宽度的 50%，最大为客户端宽度的 80%。
   - 高度：最小为客户端高度的 50%，最大为客户端高度的 80%。
3. 内容结构保持现有语义不变：
   - 左右两栏分别展示「线上的」与「本地的」信息。
   - 两栏宽度各为弹窗内容区的 49%。
   - 除现有文字（标题与尺寸信息）外，其余区域用于展示图片。
4. 图片展示要求：
   - 图片在框内居中显示。
   - 图片最大宽高不能超出边框（等价于 contain 效果，不裁切）。

## 实现步骤

### 步骤 1：完善 useCompare.ts（尺寸采集与弹窗尺寸计算）

- 文件：[useCompare.ts](file:///Users/linzhibin/Documents/GitHub/oss-browser/src/renderer/views/fileList/hooks/useCompare.ts)
- 修改点：
  - 增加弹窗尺寸的响应式状态，例如 `dialogWidth` / `dialogHeight`（或一个 `dialogStyle` 对象）。
  - 新增 `calculateDialogSize` 方法，用于根据两张图片的自然尺寸与客户端尺寸计算弹窗尺寸：
    - 读取客户端尺寸：`window.innerWidth`、`window.innerHeight`。
    - 以两张图片的自然尺寸取“最大宽/最大高”作为对比区域的基准尺寸。
    - 估算弹窗目标尺寸：
      - 目标宽度：两栏图片并排所需宽度 + 左右间距/内边距（例如 `maxImageWidth * 2 + gutter + padding`）。
      - 目标高度：图片高度 + 文本区域高度 + 上下内边距。
    - 使用 clamp 思路将目标宽高限制在：
      - `width ∈ [innerWidth * 0.5, innerWidth * 0.8]`
      - `height ∈ [innerHeight * 0.5, innerHeight * 0.8]`
    - 计算结果写入响应式状态，供组件绑定到弹窗样式。
  - 在两张图片 `onload` 后触发计算：
    - 首次打开时：两张图任意一张加载完成都可触发一次，第二张加载完成后再触发一次，以得到更准确的最终尺寸。
    - 可选：如果其中一张图为空（本地未选择），以另一张图作为基准。

### 步骤 2：调整 Compare.vue（动态绑定宽高 + 布局与图片显示）

- 文件：[Compare.vue](file:///Users/linzhibin/Documents/GitHub/oss-browser/src/renderer/views/fileList/components/Compare.vue)
- 修改点：
  - 将 `el-dialog` 的 `width` 从固定值改为绑定到 `dialogWidth`（字符串形式如 `xxxpx` 或 `%`）。
  - 将内容区高度绑定到 `dialogHeight`：
    - 可通过 `el-dialog` 的 `body-style` 或包一层容器设置固定高度，确保内部能用 flex 计算“剩余空间”。
  - 重构样式为 flex 布局：
    - `.vs-content`：水平 flex，设置为内容区满高。
    - `.vs-pane`：固定 `width: 49%`，纵向 flex（标题/尺寸在上，图片区域占剩余空间）。
    - `.img`：
      - `flex: 1` 占满剩余空间；
      - `width: 100%`；
      - `background-position: center`；
      - `background-repeat: no-repeat`；
      - `background-size: contain`（确保图片不超出边框且居中）。
  - 保持现有标题与尺寸文字不变，仅调整它们与图片区的排布与尺寸占用。

## 验证点

- 小图（例如 56x56）：弹窗宽高应命中 50% 的最小限制，不应过小。
- 大图：弹窗宽高应命中 80% 的最大限制，不应超出可视区。
- 宽高比例：两栏各占 49%，文字区域高度固定，图片占据剩余空间且居中、无溢出。


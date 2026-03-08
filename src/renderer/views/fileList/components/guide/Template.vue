<template>
    <div>
        <p>模板复制功能用于复制图片信息，包含图片宽高、图片地址。例如复制CSS样式。</p>
        <p>示例如下：</p>
        <div class="code">
            <p>width: ${width}px;</p>
            <p>height: ${height}px;</p>
            <p>background-image: url(${url});</p>
        </div>
        <p>形如被“${}”符号包裹的变量会被替换，替换规则如下：</p>
        <ol>
            <li>width - 宽度</li>
            <li>height - 高度</li>
            <li>url - 图片地址</li>
        </ol>
    </div>
</template>

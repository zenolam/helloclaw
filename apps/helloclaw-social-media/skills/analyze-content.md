---
name: 分析内容
description: 分析文章内容质量并提供优化建议
trigger: analyze_content
---

## 功能说明

此技能用于分析文章的内容质量、可读性和潜在表现，并提供具体的优化建议。

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_id | string | 是 | 文章 ID |
| target_platform | string | 否 | 目标平台，用于平台特定分析 |

## 分析维度

1. **内容质量**
   - 主题清晰度
   - 逻辑结构
   - 论据支撑
   - 原创性检测

2. **可读性**
   - 段落长度
   - 句子复杂度
   - 用词难度
   - 排版建议

3. **互动潜力**
   - 标题吸引力
   - 情感共鸣点
   - 互动引导
   - 传播潜力

4. **SEO 优化**
   - 关键词密度
   - 标题优化
   - 描述建议
   - 标签推荐

## 使用示例

```json
{
  "article_id": "article-20240115-001",
  "target_platform": "wechat"
}
```

## 返回格式

```json
{
  "score": 85,
  "dimensions": {
    "quality": 90,
    "readability": 80,
    "engagement": 85,
    "seo": 75
  },
  "suggestions": [
    "建议在第三段增加数据支撑",
    "标题可以更吸引眼球",
    "建议添加小标题改善结构"
  ]
}
```

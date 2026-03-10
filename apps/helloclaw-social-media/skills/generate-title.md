---
name: 生成标题
description: 根据文章内容生成多个备选标题
trigger: generate_title
---

## 功能说明

此技能用于根据文章内容生成多个风格各异的备选标题，帮助用户选择最适合的标题。

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_id | string | 是 | 文章 ID |
| style | string | 否 | 标题风格，可选值：professional, emotional, curiosity, howto |
| count | number | 否 | 生成数量，默认 5 个，最多 10 个 |

## 标题风格

- **professional (专业型)**：简洁、专业、突出价值
- **emotional (情感型)**：引发共鸣、触动情绪
- **curiosity (好奇型)**：制造悬念、引发好奇
- **howto (教程型)**：清晰、实用、步骤明确

## 使用示例

```json
{
  "article_id": "article-20240115-001",
  "style": "emotional",
  "count": 5
}
```

## 返回格式

```json
{
  "titles": [
    {
      "title": "标题内容",
      "style": "emotional",
      "score": 92,
      "reason": "引发情感共鸣，点击潜力高"
    }
  ],
  "recommendation": "建议选择第三个标题，情感共鸣最强"
}
```

## 优化建议

- 标题长度控制在 15-25 字最佳
- 包含数字能提高点击率
- 适当使用标点增加节奏感

---
name: 发布文章
description: 将文章发布到指定的自媒体平台
trigger: publish_article
---

## 功能说明

此技能用于将指定文章发布到多个自媒体平台，支持格式转换和平台适配。

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_id | string | 是 | 文章 ID |
| platforms | string[] | 是 | 目标平台列表，可选值：wechat, weibo, zhihu, toutiao |
| publish_time | string | 否 | 定时发布时间，格式：YYYY-MM-DD HH:mm |

## 使用示例

```json
{
  "article_id": "article-20240115-001",
  "platforms": ["wechat", "weibo"],
  "publish_time": "2024-01-16 09:00"
}
```

## 平台说明

- **wechat (微信公众号)**：支持图文消息，自动处理封面图
- **weibo (新浪微博)**：自动截断长文，生成头条文章链接
- **zhihu (知乎)**：支持 Markdown 格式，自动添加专栏标签
- **toutiao (今日头条)**：自动优化标题，支持视频嵌入

## 注意事项

1. 发布前会自动检查平台内容规范
2. 图片会自动压缩到平台要求的尺寸
3. 失败的平台会返回错误信息，不影响其他平台

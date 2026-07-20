---
created: 26-07-17 17:17
updated: 26-07-18 15:04
学科: 口腔颌面外科学
章节: 颌骨囊肿与肿瘤
类型: MOC
加工进度: 一轮
tags: []
---

# 颌骨囊肿与肿瘤 MOC

## 总论
- [[02Area/口腔医学/Cards/颌骨囊肿]]
- [[02Area/口腔医学/Cards/牙源性肿瘤]]

## 牙源性囊肿
- [[02Area/口腔医学/Cards/含牙囊肿]]
- [[02Area/口腔医学/Cards/根尖周囊肿]]
- [[02Area/口腔医学/Cards/牙源性角化囊性瘤]]

## 非牙源性囊肿
- [[02Area/口腔医学/Cards/鼻腭管囊肿]]
- [[02Area/口腔医学/Cards/皮样囊肿和表皮样囊肿]]

## 牙源性肿瘤
- [[02Area/口腔医学/Cards/成釉细胞瘤]]

## 影像鉴别
- [[颌骨囊肿与肿瘤影像鉴别]]

## 真题索引
- [[02Area/口腔医学/Questions/习题/口腔颌面外科学/颌骨囊肿与肿瘤 题卡示例]]

```dataview
TABLE 年份, 院校, 题型, 答案状态, 考点
FROM "02Area/口腔医学/Questions"
WHERE 章节 = "颌骨囊肿与肿瘤"
SORT 年份 DESC, 题型 ASC
```

## 高频候选

```dataview
TABLE rows.file.link AS 题卡, length(rows) AS 出现次数
FROM "02Area/口腔医学/Questions"
WHERE 章节 = "颌骨囊肿与肿瘤" AND 院校 != "待填写" AND 年份 >= date(today).year - 5
FLATTEN 考点 AS 单个考点
GROUP BY 单个考点
WHERE length(rows) >= 2
SORT length(rows) DESC
```

## 卡片汇总

```dataview
TABLE 学科, 类型, 加工进度, tags
FROM "02Area/口腔医学/Cards"
WHERE 章节 = "颌骨囊肿与肿瘤"
SORT 类型 ASC, file.name ASC
```

## 待核/疑问

```dataview
TABLE 类型, 加工进度, tags
FROM "02Area/口腔医学/Cards"
WHERE 章节 = "颌骨囊肿与肿瘤" AND (contains(tags, "状态/待核") OR contains(tags, "状态/疑问") OR contains(tags, "状态/待补"))
SORT file.name ASC
```

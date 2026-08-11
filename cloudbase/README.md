# ohmo 稽查 CloudBase 部署状态

## 已完成部署 ✅

| 资源 | 值 |
|---|---|
| 环境 ID | `careooolv-d8gnyhzsnfe9e7356` |
| 环境别名 | `careooolv` |
| 套餐 | 体验版（免费，3000 资源点/月） |
| 区域 | `ap-shanghai` |
| 到期 | 2026-12-24 |
| 数据库集合 | `audit_records`（含 3 个索引：`id`、`audit_date`、`generated_at`） |
| 云函数 | `audit-api`（Event 函数 + HTTP 网关，Node.js 18.15） |
| HTTP 网关地址 | `https://careooolv-d8gnyhzsnfe9e7356-1438923118.ap-shanghai.app.tcloudbase.com/audit-api` |
| 静态站点 | `https://careooolv.github.io/ohmo-audit/` |

## API 接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/audit-api` | 保存稽查得分记录 |
| GET | `/audit-api` | 查询记录列表（可选 `?start=&end=` 日期筛选） |
| DELETE | `/audit-api?id=xxx` | 删除指定记录 |
| OPTIONS | `/audit-api` | CORS 预检 |

## 数据结构

每条记录包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID，前端生成 |
| store_name | string | 门店名称 |
| auditor | string | 稽查人 |
| audit_date | string | 稽查日期 YYYY-MM-DD |
| generated_at | string | 生成时间 ISO |
| total_score | number | 总得分 |
| max_score | number | 满分 |
| percent | number | 得分百分比 |
| pass_count | number | 通过项数 |
| fail_count | number | 不通过项数 |
| pending_count | number | 待评项数 |
| category_scores | object | 各分类得分 |

## 云函数代码

位于 `cloudbase/audit-api/`：
- `index.js` — Event 函数，使用 `@cloudbase/node-sdk` 访问 NoSQL 数据库
- `package.json` — 依赖声明

如需更新云函数代码，修改 `index.js` 后重新部署即可。

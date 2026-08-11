# ohmo 稽查 CloudBase 部署指南

## 方案概述

| 层 | 方案 | 费用 |
|---|------|------|
| 静态托管 | GitHub Pages | 免费 |
| API + 数据库 | CloudBase 免费体验版 | 免费（3000 资源点/月） |

## 部署步骤（约 5 分钟）

### 1. 创建 CloudBase 环境

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 点击「新建环境」，选择「免费体验版」（每个账号可创建 1 个免费环境）
3. 记下 **环境 ID**（形如 `ohmo-xxxxx`）

### 2. 创建数据库集合

1. 在控制台进入「数据库」
2. 点击「+」添加集合，名称填 `audit_records`
3. 权限设置选「所有用户可读，仅创建者可写」（或按需调整）

### 3. 部署云函数

#### 方式 A：控制台上传（推荐，无需安装工具）

1. 进入「云函数」页面，点击「新建函数」
2. 函数名称：`audit-api`
3. 运行环境：Node.js 16
4. 执行方法：`index.main`
5. 将 `cloudbase/audit-api/index.js` 和 `package.json` 打成 zip 上传
   （或直接在在线编辑器中粘贴代码）
6. 部署完成后，进入「函数服务」→「触发器管理」
7. 添加 HTTP 触发器，路径填 `/audit-api`，方法选 `GET, POST, DELETE, OPTIONS`

#### 方式 B：CLI 部署

```bash
npm i -g @cloudbase/cli
tcb login
tcb fn deploy audit-api --env <你的环境ID>
```

### 4. 获取 HTTP 触发地址

部署完成后，HTTP 触发地址格式为：

```
https://<环境ID>.service.tcloudbasegateway.com/audit-api
```

将这个地址填入稽查工具「稽查记录」页面的「云函数地址」输入框，点击保存即可。

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
| category_scores | array | 各分类得分 |

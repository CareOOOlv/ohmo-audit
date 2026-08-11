/**
 * ohmo 门店稽查得分记录 API
 * CloudBase 云函数 - HTTP 触发
 *
 * 功能：
 *   POST   /audit-api          → 保存一条稽查得分记录
 *   GET    /audit-api           → 查询记录列表（可选 start/end 日期筛选）
 *   DELETE /audit-api?id=xxx   → 删除指定记录
 *   OPTIONS                     → CORS 预检
 *
 * 数据库集合：audit_records
 * 记录字段：id, store_name, auditor, audit_date, generated_at,
 *           total_score, max_score, percent, pass_count, fail_count,
 *           pending_count, category_scores
 */

const cloud = require('@cloudbase/node-sdk')

const app = cloud.init()
const db = app.database()
const _ = db.command

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonRes(statusCode, data) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  }
}

exports.main = async (event, context) => {
  // 兼容 HTTP 触发 和 SDK 直接调用两种方式
  const method = event.httpMethod || event.method || 'POST'
  const body = event.body
    ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body)
    : event
  const query = event.queryStringParameters || event.query || {}

  // CORS 预检
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  try {
    // ─── POST: 保存记录 ───
    if (method === 'POST') {
      const record = body || {}
      if (!record.id) {
        return jsonRes(400, { error: '缺少 id 字段' })
      }

      // 用前端生成的 id 作为文档 _id，方便后续按 id 删除
      const docData = { ...record }
      docData._id = record.id

      await db.collection('audit_records').add({ data: docData })

      return jsonRes(201, { ok: true, id: record.id })
    }

    // ─── GET: 查询记录列表 ───
    if (method === 'GET') {
      let chain = db.collection('audit_records')

      // 日期范围筛选
      const conditions = {}
      if (query.start) {
        conditions.audit_date = _.gte(query.start)
      }
      if (query.end) {
        conditions.audit_date = Object.assign(conditions.audit_date || {}, _.lt(query.end))
      }
      if (Object.keys(conditions).length > 0) {
        chain = chain.where(conditions)
      }

      const result = await chain
        .orderBy('generated_at', 'desc')
        .limit(200)
        .get()

      // 移除 CloudBase 内部 _id 字段，保留业务字段
      const records = (result.data || []).map(({ _id, ...rest }) => rest)

      return jsonRes(200, records)
    }

    // ─── DELETE: 删除记录 ───
    if (method === 'DELETE') {
      const id = query.id
      if (!id) {
        return jsonRes(400, { error: '缺少 id 参数' })
      }

      await db.collection('audit_records').doc(id).remove()

      return jsonRes(200, { ok: true })
    }

    return jsonRes(405, { error: `不支持的请求方法: ${method}` })
  } catch (error) {
    console.error('audit-api error:', error)
    return jsonRes(500, { error: error.message || '服务器内部错误' })
  }
}

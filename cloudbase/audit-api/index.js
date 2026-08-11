/**
 * ohmo 门店稽查得分记录 API
 * CloudBase 云函数 - Event 函数 + HTTP 网关访问
 *
 * HTTP 网关触发时 event 格式：
 *   { httpMethod, body, queryStringParameters, headers, path, ... }
 *
 * 功能：
 *   POST          → 保存一条稽查得分记录
 *   GET           → 查询记录列表（可选 start/end 日期筛选）
 *   DELETE?id=xxx → 删除指定记录
 *   OPTIONS       → CORS 预检
 *
 * 数据库集合：audit_records
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

      // 直接传入文档字段，不使用 data 包装
      await db.collection('audit_records').add(record)

      return jsonRes(201, { ok: true, id: record.id })
    }

    // ─── GET: 查询记录列表 ───
    if (method === 'GET') {
      let chain = db.collection('audit_records')

      // 日期范围筛选
      const conditions = {}
      if (query.start && query.end) {
        conditions.audit_date = _.gte(query.start).and(_.lt(query.end))
      } else if (query.start) {
        conditions.audit_date = _.gte(query.start)
      } else if (query.end) {
        conditions.audit_date = _.lt(query.end)
      }
      if (Object.keys(conditions).length > 0) {
        chain = chain.where(conditions)
      }

      const result = await chain
        .orderBy('generated_at', 'desc')
        .limit(200)
        .get()

      // result.data 是文档数组，每个文档的 _id 是数据库自动生成的
      // 我们只需要返回业务字段（原始 record 中的字段）
      const records = (result.data || []).map((doc) => {
        const { _id, ...rest } = doc
        return rest
      })

      return jsonRes(200, records)
    }

    // ─── DELETE: 删除记录 ───
    if (method === 'DELETE') {
      const id = query.id
      if (!id) {
        return jsonRes(400, { error: '缺少 id 参数' })
      }

      // 按 id 字段查找并删除（不依赖 _id）
      const result = await db.collection('audit_records').where({ id }).remove()

      if (result.deleted === 0) {
        return jsonRes(404, { error: '记录不存在' })
      }

      return jsonRes(200, { ok: true })
    }

    return jsonRes(405, { error: `不支持的请求方法: ${method}` })
  } catch (error) {
    console.error('audit-api error:', error)
    return jsonRes(500, { error: error.message || '服务器内部错误' })
  }
}

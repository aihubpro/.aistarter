const mysql = require('mysql')
const { promisify } = require('util')

const pool = mysql.createPool({
  host: "__DB_HOST_PLACEHOLDER__",
  user: "__DB_USER_PLACEHOLDER__",
  password: "__DB_PASSWORD_PLACEHOLDER__",
  database: "__DB_NAME_PLACEHOLDER__"
})

pool.getConnection((error, connection) => {
  if (error) {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('[database] connection close')
    }

    if (error.code === 'ER_CON_COUNT_ERROR') {
      console.error('[database] exceeds connection limit')
    }

    if (error.code === 'ECONNREFUSED') {
      console.error('[database] connection refused')
    }
  }

  if (connection) {
    connection.release()
  }

  console.log('[database] successful connection')
  return true
})

pool.query = promisify(pool.query)

module.exports = pool

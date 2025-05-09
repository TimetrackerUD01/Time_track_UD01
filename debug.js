// สร้างไฟล์ debug.js และวางไว้ในโฟลเดอร์หลักของโปรเจค

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// สร้าง router สำหรับ debug API
const debugRouter = express.Router();

// middleware
debugRouter.use(cors());
debugRouter.use(bodyParser.json());
debugRouter.use(bodyParser.urlencoded({ extended: true }));

// ทดสอบการเชื่อมต่อฐานข้อมูล
debugRouter.get('/test-db', async (req, res) => {
  console.log('API: debug/test-db - ทดสอบการเชื่อมต่อฐานข้อมูล');
  
  try {
    // ใช้ connection string เดียวกับในไฟล์ server.js
    const connectionString = process.env.DATABASE_URL || 'postgresql://time_track_db_qwet_user:2EINugVdgXJDL1EBIO21Yyr5wjBhJ7Pr@dpg-cvtnbda4d50c73akebt0-a.oregon-postgres.render.com/time_track_db_qwet';
    
    // สร้าง connection pool
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      timezone: 'Asia/Bangkok'  // เพิ่มการตั้งค่าโซนเวลา
    });
    
    const result = await pool.query('SELECT NOW()');
    
    // ตรวจสอบตารางในฐานข้อมูล
    const tablesResult = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    // ตรวจสอบจำนวนข้อมูลในแต่ละตาราง
    const tableStats = [];
    
    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      tableStats.push({
        table,
        count: parseInt(countResult.rows[0].count)
      });
    }
    
    // ตรวจสอบ settings
    const settingsResult = await pool.query('SELECT * FROM settings');
    
    res.json({
      success: true,
      dbConnected: true,
      serverTime: result.rows[0].now,
      tables,
      tableStats,
      settings: settingsResult.rows.map(s => ({ 
        name: s.setting_name, 
        value: s.setting_name === 'admin_password' ? '******' : s.setting_value 
      }))
    });
  } catch (error) {
    console.error('Error testing database:', error);
    res.json({
      success: false,
      dbConnected: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// ทดสอบ API ลงเวลาเข้า
debugRouter.post('/test-clockin', async (req, res) => {
  console.log('API: debug/test-clockin - ทดสอบการลงเวลาเข้า', req.body);
  
  try {
    const { employee, userinfo } = req.body;
    
    // สร้างข้อมูลจำลอง
    const mockData = {
      requestBody: req.body,
      headers: req.headers,
      employee: employee || 'ทดสอบ',
      userinfo: userinfo || '',
      lat: 13.7563,
      lon: 100.5018,
      timestamp: new Date().toISOString()
    };
    
    // เชื่อมต่อกับฐานข้อมูล
    const connectionString = process.env.DATABASE_URL || 'postgresql://time_tracker_7ryl_user:vr1BkKP7mZqhcbpaKwKIwAn6JT5GuJ7I@dpg-cvr26i6uk2gs73c5u7g0-a.oregon-postgres.render.com/time_tracker_7ryl';
    
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // ตรวจสอบว่ามีพนักงานในระบบหรือไม่
    let empResult;
    if (employee) {
      empResult = await pool.query(
        'SELECT id, emp_code, full_name FROM employees WHERE emp_code = $1 OR full_name = $1',
        [employee]
      );
      
      mockData.employeeFound = empResult.rows.length > 0;
      mockData.employeeData = empResult.rows;
    }
    
    res.json({
      success: true,
      debug: true,
      data: mockData
    });
  } catch (error) {
    console.error('Error in test clockin:', error);
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// ตรวจสอบ environment variables
debugRouter.get('/env', (req, res) => {
  console.log('API: debug/env - ตรวจสอบ environment variables');
  
  // สร้างรายการ environment variables ที่ปลอดภัยที่จะแสดง
  const safeEnvVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? '[CONFIGURED]' : '[NOT CONFIGURED]',
    // เพิ่ม environment variables อื่นๆ ที่ต้องการตรวจสอบตรงนี้
  };
  
  res.json({
    success: true,
    environment: safeEnvVars
  });
});

// ตรวจสอบการตั้งค่า LIFF
debugRouter.post('/check-liff', (req, res) => {
  console.log('API: debug/check-liff - ตรวจสอบการตั้งค่า LIFF', req.body);
  
  const { liffId, browserInfo } = req.body;
  
  res.json({
    success: true,
    liffIdReceived: liffId,
    browserInfo,
    serverTime: new Date().toISOString()
  });
});

// API สำหรับแก้ไข LIFF ID ในตาราง settings
debugRouter.post('/update-liff', async (req, res) => {
  console.log('API: debug/update-liff - แก้ไข LIFF ID', req.body);
  
  try {
    const { liffId } = req.body;
    
    if (!liffId) {
      return res.json({ success: false, message: 'กรุณาระบุ LIFF ID' });
    }
    
    // เชื่อมต่อกับฐานข้อมูล
    const connectionString = process.env.DATABASE_URL || 'postgresql://time_tracker_7ryl_user:vr1BkKP7mZqhcbpaKwKIwAn6JT5GuJ7I@dpg-cvr26i6uk2gs73c5u7g0-a.oregon-postgres.render.com/time_tracker_7ryl';
    
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // ตรวจสอบว่ามีการตั้งค่า liff_id หรือไม่
    const checkResult = await pool.query(
      'SELECT setting_value FROM settings WHERE setting_name = $1',
      ['liff_id']
    );
    
    if (checkResult.rows.length > 0) {
      // อัปเดตค่าที่มีอยู่
      await pool.query(
        'UPDATE settings SET setting_value = $1 WHERE setting_name = $2',
        [liffId, 'liff_id']
      );
    } else {
      // เพิ่มค่าใหม่
      await pool.query(
        'INSERT INTO settings (setting_name, setting_value, description) VALUES ($1, $2, $3)',
        ['liff_id', liffId, 'LINE LIFF ID']
      );
    }
    
    res.json({
      success: true,
      message: 'อัปเดต LIFF ID เรียบร้อยแล้ว',
      liffId
    });
  } catch (error) {
    console.error('Error updating LIFF ID:', error);
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = debugRouter;

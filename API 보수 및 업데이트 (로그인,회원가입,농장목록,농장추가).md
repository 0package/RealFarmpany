# API 보수 및 업데이트 (로그인,회원가입,농장목록,농장추가)

날짜: 2025년 2월 25일
선택: 서버

### 로그인 API

```jsx
app.post('/login', (req, res) => {
  const { user_id, password } = req.body;

  // 이메일로 사용자 검색
  const query = 'SELECT * FROM users WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
      if (err) {
          console.error('쿼리 실행 실패: ' + err.stack);
          res.status(500).json({ message: '서버 오류' });
          return;
      }

      if (results.length === 0) {
          // 이메일이 존재하지 않는 경우
          res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
      } else {
          const user = results[0];
          // 비밀번호 비교
          if (user.password === password) {
              // 로그인 성공
              console.log(`[POST /login] 로그인 성공: ${user_id}`);
              res.status(200).json({ message: '로그인 성공', token: 'some-jwt-token' });
          } else {
              // 비밀번호가 틀린 경우
              console.log(`[POST /login] 로그인 실패: ${user_id} - 잘못된 비밀번호`);
              res.status(401).json({ message: '잘못된 비밀번호입니다.' });
          }
      }
  });
});
```

### 회원가입 API

```jsx
app.post('/signup', (req, res) => {
  const { user_id, password, username } = req.body;

  // 이메일 중복 확인
  const query = 'SELECT * FROM users WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
      if (err) {
          console.error('쿼리 실행 실패: ' + err.stack);
          res.status(500).json({ message: '서버 오류' });
          return;
      }

      if (results.length > 0) {
          res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
      } else {
          // 새 사용자 등록
          const insertUserQuery = 'INSERT INTO users (user_id, password, username) VALUES (?, ?, ?)';
          db.query(insertUserQuery, [user_id, password, username], (err) => {
              if (err) {
                  console.error('회원가입 실패: ' + err.stack);
                  res.status(500).json({ message: '회원가입 실패' });
                  return;
              }
              console.log(`[POST /signup] 회원가입 성공: ${user_id}`);
          });
      }
  });
});
```

### 농장 목록  API

```jsx
app.get('/getFarms', (req, res) => {
  const userId = req.query.user_id;
  const sql = 'SELECT farm_id, farm_name FROM farms WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
      if (err) {
          console.error('쿼리 에러:', err);
          res.json({ success: false });
      } else {
          console.log('농장 목록 불러오기 성공:', results);  // 농장 목록 출력
          res.json({ success: true, farms: results });
      }
  });
});
```

### 농장 추가 API

```jsx
app.post('/addFarm', (req, res) => {
  const userId = req.body.user_id;
  
  if (!userId) {
    console.log('[POST /addFarm] user_id 누락 - 요청 거부');
    return res.status(400).json({ success: false, message: 'user_id가 누락되었습니다.' });
  }

  // farms 테이블에 농장 추가
  const addFarmQuery = 'INSERT INTO farms (user_id) VALUES (?)';
  db.query(addFarmQuery, [userId], (err, result) => {
    if (err) {
      console.error('[POST /addFarm] 쿼리 에러:', err);
      return res.status(500).json({ success: false, message: 'DB 오류 발생' });
    }

    const farmId = result.insertId; // 방금 추가된 farm_id
    console.log('[POST /addFarm] 농장 추가 성공:', farmId);

    // devices 테이블에 초기값 삽입 (user_id, farm_id, led, fan, water)
    const addDeviceQuery = `
      INSERT INTO devices (user_id, farm_id, led, fan, water) 
      VALUES (?, ?, false, false, false)
    `;
    db.query(addDeviceQuery, [userId, farmId], (err, result) => {
      if (err) {
        console.error('[POST /addFarm] devices 테이블 삽입 오류:', err);
        return res.status(500).json({ success: false, message: 'devices 추가 실패' });
      }

      console.log('[POST /addFarm] devices 초기값 추가 성공:', result.insertId);
      res.status(200).json({ success: true, farm_id: farmId });
    });
  });
});
```

로그인 시 user_id, JWT 토큰을 sessionStorage에 저장한다. 

농장 선택 시 farm_id를 sessionStorage에 저장한다.

브라우저 종료 시 데이터 삭제를 위해서 sessionStorage에 저장한다.

### 기존 API들을 user_id, farm_id 조건을 만족 하도록 변경

```jsx
// 서버를 만들기 위해 필요한 도구(모듈) 불러오기
const express = require('express'); // 웹 서버를 만들기 위한 도구(Express)
const mysql = require('mysql2');    // MySQL과 연결하기 위한 도구
const path = require('path');
const cors = require('cors'); // CORS 불러오기

// 서버 만들기 + 실행할 포트 번호 설정
const app = express(); // 서버를 만든다 (이 변수에 서버 기능을 저장)
const PORT = 8000;     // 서버가 사용할 포트 번호

// 'public' 폴더를 정적 파일 제공 폴더로 설정
app.use(express.static('public'));
app.use(cors()); // 모든 요청에 대해 CORS 허용
// POST 요청을 처리하기 위해 express의 body-parser 사용
app.use(express.json());

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
  host: 'localhost',     // 데이터베이스가 있는 곳 (내 컴퓨터)
  user: 'user',     // MySQL 로그인 계정
  password: 'password', // MySQL 로그인 비밀번호
  database: 'smartFarm'    // 사용할 데이터베이스 이름
});

// MySQL 데이터베이스 연결 확인
db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err); // 연결 실패 시 에러 메시지 출력
    return;
  }
  console.log('MySQL 연결 성공!');  // 성공하면 콘솔에 메시지 출력
})

// 로그인 페이지
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 회원가입
app.post('/signup', (req, res) => {
  const { user_id, password, username } = req.body;

  // 이메일 중복 확인
  const query = 'SELECT * FROM users WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
      if (err) {
          console.error('쿼리 실행 실패: ' + err.stack);
          res.status(500).json({ message: '서버 오류' });
          return;
      }

      if (results.length > 0) {
          res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
      } else {
          // 새 사용자 등록
          const insertUserQuery = 'INSERT INTO users (user_id, password, username) VALUES (?, ?, ?)';
          db.query(insertUserQuery, [user_id, password, username], (err) => {
              if (err) {
                  console.error('회원가입 실패: ' + err.stack);
                  res.status(500).json({ message: '회원가입 실패' });
                  return;
              }
              console.log(`[POST /signup] 회원가입 성공: ${user_id}`);
          });
      }
  });
});

// 로그인
app.post('/login', (req, res) => {
  const { user_id, password } = req.body;

  // 이메일로 사용자 검색
  const query = 'SELECT * FROM users WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
      if (err) {
          console.error('쿼리 실행 실패: ' + err.stack);
          res.status(500).json({ message: '서버 오류' });
          return;
      }

      if (results.length === 0) {
          // 이메일이 존재하지 않는 경우
          res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
      } else {
          const user = results[0];
          // 비밀번호 비교
          if (user.password === password) {
              // 로그인 성공
              console.log(`[POST /login] 로그인 성공: ${user_id}`);
              res.status(200).json({ message: '로그인 성공', token: 'some-jwt-token' });
          } else {
              // 비밀번호가 틀린 경우
              console.log(`[POST /login] 로그인 실패: ${user_id} - 잘못된 비밀번호`);
              res.status(401).json({ message: '잘못된 비밀번호입니다.' });
          }
      }
  });
});

// 센서 데이터 저장
app.post('/sensors', (req, res) => {
  // 요청 바디에서 센서 데이터 받기
  const { user_id, farm_id, temperature, humidity, soil_moisture } = req.body;

  // 필드 값 체크
  if (user_id == null || farm_id == null || temperature == null || humidity == null || soil_moisture == null) {
    console.log('[POST /sensors] 필드 누락 - 요청 거부');
    return res.status(400).send('모든 필드를 채워주세요.');
  }

  // 센서 데이터 DB에 저장
  const query = `INSERT INTO sensors (user_id, farm_id, temperature, humidity, soil_moisture) VALUES (?, ?, ?, ?, ?)`;
  db.query(query, [user_id, farm_id, temperature, humidity, soil_moisture], (err, results) => {
    if (err) {
      console.error('[POST /sensors] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    // 방금 삽입된 튜플의 id
    const insertedId = results.insertId;
    
    // 방금 삽입한 튜플 전체 가져오기
    const selectQuery = `SELECT * FROM sensors WHERE id = ?`;
    db.query(selectQuery, [insertedId], (err, rows) => {
      if (err) {
        console.error('[POST /sensors] 데이터 조회 오류:', err);
        return res.status(500).send('데이터 조회 오류 발생');
      }

      console.log('[POST /sensors] 삽입된 데이터:', rows[0]); // 방금 삽입한 튜플 전체 출력
      res.status(200).json({ message: '센서 데이터 저장 및 조회 성공', data: rows[0] });
    });

    // 저장된 센서 데이터를 기반으로 제어 여부를 체크하고 실행
    Controldevice(user_id, farm_id, temperature, humidity, soil_moisture);
  });
});

function Controldevice(user_id, farm_id, temperature, humidity, soil_moisture) {
  let fanStatus = 0; 
  let waterStatus = 0; 

  if (temperature >= 22) {
    fanStatus = 1;
    console.log('환기팬 켬 (온도 22°C 이상)');
  } else if (temperature <= 18) {
    fanStatus = 0; 
    console.log('환기팬 끔 (온도 18°C 이하)');
  } else {
    // 온도가 적절한 범위에 있을 때만 습도 조건 체크
    if (humidity >= 70) {
        fanStatus = 1;
        console.log('환기팬 켬 (습도 70% 이상)');
    } else if (humidity <= 60) {
        fanStatus = 0;
        console.log('환기팬 끔 (습도 60% 이하)');
    }
  }

  // 토양 수분에 따른 물 공급 제어
  if (soil_moisture <= 50) {
    waterStatus = 1; 
    console.log('물 공급 (토양 수분 50% 이하)');
  } else if (soil_moisture >= 70) {
    waterStatus = 0;  
    console.log('물 공급 중지 (토양 수분 70% 이상)');
  }

  // 상태 제어를 위한 DB 업데이트
  updateDevice(user_id, farm_id, fanStatus, waterStatus);
}

function updateDevice(user_id, farm_id, fanStatus, waterStatus) {
  const query = `UPDATE devices SET fan = ?, water = ? WHERE user_id = ? AND farm_id = ?`;
  db.query(query, [fanStatus, waterStatus, user_id, farm_id], (err, results) => {
    if (err) {
      console.error('[updateDevice] DB 오류:', err);
    } else {
      console.log('상태 제어 업데이트 완료:', fanStatus, waterStatus);
    }
  });
}

// 최근 센서 데이터 조회
app.get('/sensors/status', (req, res) => {
  // 요청에서 user_id와 farm_id를 추출
  const userId = req.query.user_id;
  const farmId = req.query.farm_id;

  if (!userId || !farmId) {
    return res.status(400).send('user_id와 farm_id가 필요합니다.');
  }

  // 해당 user_id와 farm_id에 대한 최신 센서 데이터 가져오기
  const query = `
    SELECT * 
    FROM sensors 
    WHERE user_id = ? AND farm_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  db.query(query, [userId, farmId], (err, results) => {
    if (err) {
      console.error('[GET /sensors/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }

    if (results.length === 0) {
      console.log('[GET /sensors/status] 조회된 데이터 없음');
      return res.status(404).send('해당 조건에 맞는 데이터가 없습니다.');
    }

    console.log('[GET /sensors/status] 조회된 데이터:', results[0]);
    res.json(results[0]); // 해당 user_id와 farm_id의 최신 센서 데이터 반환
  });
});

// 제어장치 상태 가져오기
// 제어장치 상태 가져오기
app.get('/devices/status', (req, res) => {
  const { user_id, farm_id } = req.query;

  if (!user_id || !farm_id) {
    return res.status(400).send('user_id와 farm_id가 필요합니다.');
  }

  // 해당 user_id와 farm_id에 대한 제어장치 상태 가져오기
  db.query('SELECT led, fan, water FROM devices WHERE user_id = ? AND farm_id = ?', [user_id, farm_id], (err, results) => {
    if (err) {
      console.error('[GET /devices/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    console.log('[GET /devices/status] 조회된 상태:', results[0]);
    res.json(results[0]);
  });
});

// 제어장치 상태 변경하기
app.post('/devices/:deviceId/status', (req, res) => {
  const { user_id, farm_id, device } = req.body; // user_id와 farm_id로 상태 변경

  // user_id, farm_id, device가 없는 경우 에러 메시지 출력
  if (!user_id || !farm_id || !device) {
    console.log('[POST /devices/:deviceId/status] 요청 데이터 부족:', { user_id, farm_id, device });
    return res.status(400).send('user_id, farm_id, device가 필요합니다.');
  }
  // 해당 user_id와 farm_id에 대해 device 상태를 변경
  const query = `UPDATE devices SET ${device} = NOT ${device} WHERE user_id = ? AND farm_id = ?`;

  db.query(query, [user_id, farm_id], (err, results) => {
    if (err) {
      console.error('[POST /devices/:deviceId/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    // 상태 변경 후, 해당 user_id와 farm_id에 대한 장치 상태 조회
    const stateQuery = 'SELECT led, fan, water FROM devices WHERE user_id = ? AND farm_id = ?';
    db.query(stateQuery, [user_id, farm_id], (err, results) => {
      if (err) {
        console.error('[POST /devices/:deviceId/status] 상태 조회 오류:', err);
        return res.status(500).send('상태 조회 오류 발생');
      }

      if (results.length > 0) {
        // led, fan, water 값도 함께 로그에 출력
        const deviceStatus = results[0];
        console.log('[POST /devices/:deviceId/status] 장치 상태:', {
          user_id,
          farm_id,
          led: deviceStatus.led,
          fan: deviceStatus.fan,
          water: deviceStatus.water
        });
      } else {
        console.log(`[POST /devices/:deviceId/status] 해당 user_id=${user_id}와 farm_id=${farm_id}에 대한 장치 상태가 존재하지 않습니다.`);
      }

      // 상태 변경 후 클라이언트에 응답
      res.sendStatus(200);
    });
  });
});

// 시간대별 데이터 조회
app.get('/sensors/data', (req, res) => {
  const { startDate, endDate, userId, farmId } = req.query;

  // userId, farmId, startDate, endDate가 모두 필요한지 확인
  if (!startDate || !endDate || !userId || !farmId) {
    return res.status(400).json({ error: "startDate, endDate, userId, farmId가 필요합니다." });
  }

  // 날짜 형식에 맞춰서 시간대를 추가
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;

  const query = `
  SELECT 
    temperature, 
    humidity, 
    soil_moisture, 
    created_at, 
    CONVERT_TZ(created_at, '+00:00', '+09:00') AS created_at_kst 
    FROM sensors 
    WHERE user_id = ? 
    AND farm_id = ? 
    AND created_at BETWEEN CONVERT_TZ(?, '+09:00', '+00:00') 
                        AND CONVERT_TZ(?, '+09:00', '+00:00') 
    ORDER BY created_at ASC
  `;

  db.query(query, [userId, farmId, startDateTime, endDateTime], (err, results) => {
    if (err) {
      console.error('[GET /sensors/data] DB 오류:', err);
      return res.status(500).json({ error: 'DB 오류 발생' });
    }

    // 성공적인 데이터 조회
    console.log(`[GET /sensors/data] 데이터 조회 성공: ${results.length}개의 결과 반환`);

    res.json(results);
  });
});

// 통계 데이터 조회 API
app.get('/sensors/average', (req, res) => {
  const { type, userId, farmId } = req.query; // userId와 farmId 추가

  if (!userId || !farmId) {
    return res.status(400).send('userId와 farmId가 필요합니다.');
  }

  let groupBy = '';
  if (type === 'day') {
    groupBy = 'DATE(created_at)';
  } else if (type === 'week') {
    groupBy = 'YEARWEEK(created_at)';
  } else if (type === 'month') {
    groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
  } else {
    return res.status(400).send('유효하지 않은 type 파라미터입니다.');
  }

  const query = `
    SELECT 
      ${groupBy} AS period, 
      AVG(temperature) AS avg_temperature, 
      AVG(humidity) AS avg_humidity, 
      AVG(soil_moisture) AS avg_soil_moisture
    FROM sensors
    WHERE user_id = ? AND farm_id = ?
    GROUP BY period
    ORDER BY period ASC
  `;

  db.query(query, [userId, farmId], (err, results) => {
    if (err) {
      console.error('[GET /sensors/average] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    res.json(results);
  });
});

// 농장 목록 불러오기
app.get('/getFarms', (req, res) => {
  const userId = req.query.user_id;
  const sql = 'SELECT farm_id, farm_name FROM farms WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
      if (err) {
          console.error('쿼리 에러:', err);
          res.json({ success: false });
      } else {
          console.log('농장 목록 불러오기 성공:', results);  // 농장 목록 출력
          res.json({ success: true, farms: results });
      }
  });
});

// 농장 추가하기
app.post('/addFarm', (req, res) => {
  const userId = req.body.user_id;
  
  if (!userId) {
    console.log('[POST /addFarm] user_id 누락 - 요청 거부');
    return res.status(400).json({ success: false, message: 'user_id가 누락되었습니다.' });
  }

  // farms 테이블에 농장 추가
  const addFarmQuery = 'INSERT INTO farms (user_id) VALUES (?)';
  db.query(addFarmQuery, [userId], (err, result) => {
    if (err) {
      console.error('[POST /addFarm] 쿼리 에러:', err);
      return res.status(500).json({ success: false, message: 'DB 오류 발생' });
    }

    const farmId = result.insertId; // 방금 추가된 farm_id
    console.log('[POST /addFarm] 농장 추가 성공:', farmId);

    // devices 테이블에 초기값 삽입 (user_id, farm_id, led, fan, water)
    const addDeviceQuery = `
      INSERT INTO devices (user_id, farm_id, led, fan, water) 
      VALUES (?, ?, false, false, false)
    `;
    db.query(addDeviceQuery, [userId, farmId], (err, result) => {
      if (err) {
        console.error('[POST /addFarm] devices 테이블 삽입 오류:', err);
        return res.status(500).json({ success: false, message: 'devices 추가 실패' });
      }

      console.log('[POST /addFarm] devices 초기값 추가 성공:', result.insertId);
      res.status(200).json({ success: true, farm_id: farmId });
    });
  });
});

// 서버 시작 시 초기 상태값 삽입 (테이블에 데이터가 없을 경우)
app.listen(PORT, '0.0.0.0', () => {
  console.log('서버가 실행 중입니다.');
});

```
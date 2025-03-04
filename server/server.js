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

// 아이디 중복 확인 API
app.get('/check-userid', (req, res) => {
  const { user_id } = req.query;
  const query = 'SELECT * FROM users WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
      if (err) {
          console.error('[GET /check-userid] 쿼리 실행 실패:', err);
          return res.status(500).json({ message: '서버 오류' });
      }
      if (results.length > 0) {
          console.log(`[GET /check-userid] 이미 사용 중인 아이디: ${user_id}`);
          return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
      }
      console.log(`[GET /check-userid] 사용 가능한 아이디: ${user_id}`);
      res.status(200).json({ message: '사용 가능한 아이디입니다.' });
  });
});

// 닉네임 중복 확인 API
app.get('/check-username', (req, res) => {
  const { username } = req.query;
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
      if (err) {
          console.error('[GET /check-username] 쿼리 실행 실패:', err);
          return res.status(500).json({ message: '서버 오류' });
      }
      if (results.length > 0) {
          console.log(`[GET /check-username] 이미 사용 중인 닉네임: ${username}`);
          return res.status(400).json({ message: '이미 사용 중인 닉네임입니다.' });
      }
      console.log(`[GET /check-username] 사용 가능한 닉네임: ${username}`);
      res.status(200).json({ message: '사용 가능한 닉네임입니다.' });
  });
});

// 회원가입 API
app.post('/signup', (req, res) => {
  const { user_id, password, username } = req.body;
  const insertUserQuery = 'INSERT INTO users (user_id, password, username) VALUES (?, ?, ?)';
  db.query(insertUserQuery, [user_id, password, username], (err) => {
      if (err) {
          console.error('[POST /signup] 회원가입 실패:', err);
          return res.status(500).json({ message: '회원가입 실패' });
      }
      console.log(`[POST /signup] 회원가입 성공 - user_id: ${user_id}`);
      res.status(201).json({ message: '회원가입 성공' });
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
const moment = require('moment-timezone');

// 센서 데이터 저장
app.post('/sensors', (req, res) => {
  const { user_id, farm_id, temperature, humidity, soil_moisture, co2, created_at } = req.body;

  // created_at이 없으면 현재 시간을 한국 시간으로 설정
  const timestamp = created_at ? moment.tz(created_at, "Asia/Seoul").format('YYYY-MM-DD HH:mm:ss') : moment().tz("Asia/Seoul").format('YYYY-MM-DD HH:mm:ss');

  // DB에 저장
  const query = `INSERT INTO sensors (user_id, farm_id, temperature, humidity, soil_moisture, co2, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(query, [user_id, farm_id, temperature, humidity, soil_moisture, co2, timestamp], (err, results) => {
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

      console.log('[POST /sensors] 삽입된 데이터:', rows[0]);
      res.status(200).json({ message: '센서 데이터 저장 및 조회 성공' });
    });

    // 저장된 센서 데이터를 기반으로 제어 여부를 체크하고 실행
    Controldevice(user_id, farm_id, temperature, humidity, soil_moisture, co2);
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
app.get('/devices/status', (req, res) => {
  const { user_id, farm_id } = req.query;

  if (!user_id || !farm_id) {
    return res.status(400).send('user_id와 farm_id가 필요합니다.');
  }
  // 해당 user_id와 farm_id에 대한 제어장치 상태 가져오기
  const query = `
  SELECT *
  FROM devices 
  WHERE user_id = ? AND farm_id = ?
  `
  db.query(query, [user_id, farm_id], (err, results) => {
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
    const stateQuery = 'SELECT * FROM devices WHERE user_id = ? AND farm_id = ?';
    db.query(stateQuery, [user_id, farm_id], (err, results) => {
      if (err) {
        console.error('[POST /devices/:deviceId/status] 상태 조회 오류:', err);
        return res.status(500).send('상태 조회 오류 발생');
      }

      if (results.length > 0) {
        // led, fan, water 값도 함께 로그에 출력
        const deviceStatus = results[0];
        let changedDevices = 'led';
        if (device == 'led') changedDevices = 'led';
        if (device == 'fan') changedDevices = 'fan';
        if (device == 'water') changedDevices = 'water';
        if (device == 'heater') changedDevices = 'heater';
        if (device == 'cooler') changedDevices = 'cooler';

        if (Object.keys(changedDevices).length > 0) {
          console.log('[POST /devices/:deviceId/status] 변경된 장치 상태:', changedDevices);
        } else {
          console.log('변경된 장치 없음');
        }
      } else {
        console.log(`[POST /devices/:deviceId/status] 해당 user_id=${user_id}와 farm_id=${farm_id}에 대한 장치 상태가 존재하지 않습니다.`);
      }

      // 상태 변경 후 클라이언트에 응답
      res.sendStatus(200);
    });
  });
});

// 날짜별 센서 데이터
app.get('/sensors/data', (req, res) => {
  const { date, userId, farmId } = req.query;

  // 필수 파라미터 검증
  if (!date || !userId || !farmId) {
      return res.status(400).json({ error: "date, userId, farmId가 필요합니다." });
  }

  const query = `
      SELECT 
          temperature, 
          humidity, 
          soil_moisture, 
          co2, 
          CONVERT_TZ(created_at, '+00:00', '+09:00') AS created_at
      FROM sensors 
      WHERE user_id = ? 
      AND farm_id = ? 
      AND DATE(created_at) = ?
      ORDER BY created_at ASC
  `;

  db.query(query, [userId, farmId, date], (err, results) => {
      if (err) {
          console.error('[GET /sensors/data] DB 오류:', err);
          return res.status(500).json({ error: 'DB 오류 발생' });
      }

      console.log(`[GET /sensors/data] ${date} 데이터 조회 성공: ${results.length}개 반환`, results);

      // 데이터를 그대로 응답
      res.json(results);
  });
});

// 통계 데이터 조회 API
app.get('/sensors/average', (req, res) => {
  const { type, userId, farmId } = req.query;

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
      AVG(soil_moisture) AS avg_soil_moisture,
      AVG(co2) AS avg_co2
    FROM sensors
    WHERE user_id = ? AND farm_id = ?
    GROUP BY period
    ORDER BY period ASC`;

  db.query(query, [userId, farmId], (err, results) => {
    if (err) {
      console.error('[GET /sensors/average] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    console.log('[GET /sensors/average] 통계 데이터 조회 성공', results);
    res.json(results);
  });
});

// 사용자 이름 불러오기
app.get('/getName', (req,res) => {
  const userId = req.query.user_id;
  const query = `SELECT username from users where user_id = ?`;
  db.query(query, [userId], (err,results) => {
    if (err) {
      console.error('쿼리 에러:', err);
      res.json({ success: false});
    } else {
      console.log('[GET /getName] 사용자 이름 불러오기 성공: ',results);
      if (results.length > 0) {
        console.log('[GET /getName] 사용자 이름:',results);
        res.json({ success: true, username: results[0].username });
      } else {
        console.log('[GET /getName] 사용자 정보를 찾을 수 없습니다.')
        res.json({ success: false, message: '사용자 정보를 찾을 수 없습니다.' });
      }
    }
  });
});

// 스마트팜 이름 불러오기
app.get('/getFarmName', (req,res) => {
  const userId = req.query.user_id;
  const query = `SELECT farm_name from farms where user_id = ?`;
  db.query(query, [userId], (err,results) => {
    if (err) {
      console.error('쿼리 에러:', err);
      res.json({ success: false});
    } else {
      console.log('[GET /getFarmName] 스마트팜 이름 불러오기 성공: ',results);
      if (results.length > 0) {
        console.log('[GET /getFarmName] 스마트팜 이름:',results);
        res.json({ success: true, farmname: results[0].farm_name });
      } else {
        console.log('[GET /getFarmName] 스마트팜 정보를 찾을 수 없습니다.')
        res.json({ success: false, message: '사용자 정보를 찾을 수 없습니다.' });
      }
    }
  });
});

// 농장 목록 불러오기
app.get('/getFarms', (req, res) => {
  const userId = req.query.user_id;
  const sql = `SELECT 
   farm_id, farm_name, farm_location, farm_type, farm_active
   FROM farms 
   WHERE user_id = ?`;
  db.query(sql, [userId], (err, results) => {
      if (err) {
          console.error('쿼리 에러:', err);
          res.json({ success: false });
      } else {
          console.log('[GET /getFarms]농장 목록 불러오기 성공:', results);  // 농장 목록 출력
          res.json({ success: true, farms: results });
      }
  });
});

// 농장 추가하기
app.post('/addFarm', (req, res) => {
  const userId = req.body.user_id;
  const farmName = req.body.name;
  const farmLocation = req.body.location;
  const farmType = req.body.cropType;
  if (!userId) {
    console.log('[POST /addFarm] user_id 누락 - 요청 거부');
    return res.status(400).json({ success: false, message: 'user_id가 누락되었습니다.' });
  }

  if (!farmName || !farmLocation || !farmType) {
    console.log('[POST /addFarm] 농장 정보 누락 - 요청 거부');
    return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
  }

  // farms 테이블에 농장 추가
  const addFarmQuery = `INSERT INTO 
  farms (user_id, farm_name, farm_location, farm_type) 
  VALUES (?, ?, ?, ?)
  `;
  db.query(addFarmQuery, [userId, farmName, farmLocation, farmType], (err, result) => {
    if (err) {
      console.error('[POST /addFarm] 쿼리 에러:', err);
      return res.status(500).json({ success: false, message: 'DB 오류 발생' });
    }

    const farmId = result.insertId; // 방금 추가된 farm_id
    console.log('[POST /addFarm] 농장 추가 성공:', farmId);

    // devices 테이블에 초기값 삽입 (user_id, farm_id, led, fan, water)
    const addDeviceQuery = `
      INSERT INTO devices (user_id, farm_id, led, fan, water, heater, cooler) 
      VALUES (?, ?, false, false, false, false, false)
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

// 농장 삭제
app.post('/delFarm', (req, res) => {
  const farmIds = req.body.farm_ids;  // farm_ids 배열이 전달됨

  if (!farmIds || farmIds.length === 0) {
    return res.status(400).json({ error: '삭제할 농장 ID가 필요합니다.' });
  }

  // 농장 삭제
  const query = `DELETE FROM farms WHERE farm_id IN (?)`;
  db.query(query, [farmIds], (err, results) => {
    if (err) {
      console.error('데이터 조회 오류');
      return res.status(500).json({ error: '서버 오류' });
    }
    if (results.affectedRows === 0) {
      return res.status(400).json({ error: '해당 농장이 DB에 존재하지 않습니다.' });
    }

    // 관련 장치 삭제
    const deleteDevicesQuery = `DELETE FROM devices WHERE farm_id IN (?)`;
    db.query(deleteDevicesQuery, [farmIds], (err, deviceResults) => {
      if (err) {
        console.error('장치 삭제 오류');
        return res.status(500).json({ error: '서버 오류' });
      }
      console.log('[Post /delFarm] 삭제된 농장 id: ', farmIds);
      res.json({ success: true, message: '농장 및 관련 장치가 성공적으로 삭제되었습니다.' });
    });
  });
});

// 실시간 데이터 불러오기 (1시간 단위 평균)
app.get('/realtime-data', (req, res) => {
  const userId = req.query.user_id;
  const farmId = req.query.farm_id;

  if (!userId || !farmId) {
    return res.status(400).json({ error: 'user_id와 farm_id가 필요합니다.' });
  }

  const query = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') AS time_interval,
      AVG(temperature) AS avg_temperature,
      AVG(humidity) AS avg_humidity,
      AVG(soil_moisture) AS avg_soil_moisture,
      AVG(co2) AS avg_co2
    FROM 
      sensors
    WHERE 
      user_id = ? 
      AND farm_id = ? 
      AND created_at >= NOW() - INTERVAL 24 HOUR
    GROUP BY 
      time_interval
    ORDER BY 
      time_interval ASC;
  `;

  const params = [userId, farmId];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('데이터 조회 오류:', err);
      res.status(500).json({ error: '서버 오류' });
      return;
    }
    // 만약 결과가 없다면
    if (results.length === 0) {
      console.log('[GET /real-time-data] 조회된 데이터가 없습니다.');
      return res.status(404).json({ error: '데이터가 없습니다.' });
    }

    console.log(`[GET /real-time-data] 실시간 데이터: ${results.length}개 반환`, results);
    res.json(results);
  });
});

// 기록 데이터 API (날짜별 센서 데이터)
app.get('/history-data', (req, res) => {
  const { user_id, farm_id, date } = req.query;

  if (!user_id || !farm_id || !date) {
    return res.status(400).json({ error: 'user_id, farm_id, date는 필수 항목입니다.' });
  }

  console.log('date값:', date);

  // 날짜 파싱 (YYYY-MM-DD 형태)
  const formattedDate = new Date(date);

  // 날짜가 유효하지 않으면 오류 반환
  if (isNaN(formattedDate)) {
    return res.status(400).json({ error: '유효한 날짜 형식이 아닙니다.' });
  }

  // 시작 시간을 계산하기 위해서 formattedDate의 복사본을 사용하여 시간을 설정 (UTC 기준)
  const startOfDayUTC = new Date(formattedDate);
  startOfDayUTC.setHours(0, 0, 0, 0);

  // 끝 시간을 계산하기 위해서 formattedDate의 복사본을 사용하여 시간을 설정 (UTC 기준)
  const endOfDayUTC = new Date(formattedDate);
  endOfDayUTC.setHours(23, 59, 59, 999);

  console.log('시작 시간(UTC):', startOfDayUTC, '끝 시간(UTC):', endOfDayUTC);

  // 1시간 단위로 데이터를 그룹화하여 평균값 계산
  const query = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') AS time_interval,
      AVG(temperature) AS avg_temperature,
      AVG(humidity) AS avg_humidity,
      AVG(soil_moisture) AS avg_soil_moisture,
      AVG(co2) AS avg_co2
    FROM 
      sensors
    WHERE 
      user_id = ? 
      AND farm_id = ? 
      AND created_at BETWEEN ? AND ?
    GROUP BY 
      time_interval
    ORDER BY 
      time_interval ASC;
  `;

  db.query(query, [user_id, farm_id, startOfDayUTC, endOfDayUTC], (err, results) => {
    if (err) {
      console.error('쿼리 실행 오류: ', err.stack);
      return res.status(500).json({ error: '데이터를 가져오는 데 실패했습니다.' });
    }

    // 만약 결과가 없다면
    if (results.length === 0) {
      console.log('[GET /history-data] 조회된 데이터가 없습니다.');
      return res.status(404).json({ error: '해당 날짜에 기록된 데이터가 없습니다.' });
    }

    console.log(`[GET /history-data] 기록 데이터: ${results.length}개 반환`, results);
    res.json(results);
  });
});

// 서버 시작 시 초기 상태값 삽입 (테이블에 데이터가 없을 경우)
app.listen(PORT, '0.0.0.0', () => {
  console.log('서버가 실행 중입니다.');
});

# RESTful API 구현(Node.js Express)

### **GET / (홈페이지)**

루트 경로(’/’)로 접근할 때, public/index.html 파일을 클라이언트에 반환하는 API

```jsx
app.get('/', (req, res) => {  // GET 요청이 루트 경로(/ 즉, 홈페이지)로 오면 실행됨
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

### **POST /sensors (센서 데이터 저장)**

센서에서 받은 데이터(온도, 습도, 토양 수분)를 받아서 데이터베이스에 저장하는 API

```jsx
app.post('/sensors', (req, res) => {
  // 요청 바디에서 센서 데이터 받기
  const { temperature, humidity, soil_moisture } = req.body;

  // 필드 값 체크
  if (temperature == null || humidity == null || soil_moisture == null) {
    console.log('[POST /sensors] 필드 누락 - 요청 거부');
    return res.status(400).send('모든 필드를 채워주세요.');
  }

  // 센서 데이터 DB에 저장
  const query = `INSERT INTO sensor_data (temperature, humidity, soil_moisture) VALUES (?, ?, ?)`;
  db.query(query, [temperature, humidity, soil_moisture], (err, results) => {
    if (err) {
      console.error('[POST /sensors] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }

    // 저장된 센서 데이터를 기반으로 제어 여부를 체크하고 실행
    Controldevice(temperature, humidity, soil_moisture);

    res.status(200).send('센서 데이터 저장 및 제어 성공');
  });
});

function Controldevice(temperature, humidity, soil_moisture) {
  let fanStatus = 0;  // 'OFF' 상태는 0으로 설정
  let waterStatus = 0;  // 'OFF' 상태는 0으로 설정

  // 온도를 우선시하는 예시
  if (temperature >= 22) {
    fanStatus = 1; // 온도가 높으면 켠다
    console.log('환기팬 켬 (온도 22°C 이상)');
  } else if (temperature <= 18) {
    fanStatus = 0; // 온도가 낮으면 끈다
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
    waterStatus = 1;  // 'ON' 상태는 1로 설정
    console.log('물 공급 (토양 수분 50% 이하)');
  } else if (soil_moisture >= 70) {
    waterStatus = 0;  // 'OFF' 상태는 0으로 설정
    console.log('물 공급 중지 (토양 수분 70% 이상)');
  }

  // 상태 제어를 위한 DB 업데이트
  updateDevice(fanStatus, waterStatus);
}

function updateDevice(fanStatus, waterStatus) {
  const query = `UPDATE status SET fan = ?, water = ? WHERE id = 1`;
  db.query(query, [fanStatus, waterStatus], (err, results) => {
    if (err) {
      console.error('[updateDevice] DB 오류:', err);
    } else {
      console.log('상태 제어 업데이트 완료:', fanStatus, waterStatus);
    }
  });
}
```

**센서 데이터에 따른 제어 로직**

- **온도**: 온도가 22도 이상이면 팬을 켬, 18도 이하이면 팬을 끔.
- **습도**: 습도가 70% 이상이면 팬을 켬, 60% 이하이면 팬을 끔.
- **토양 수분**: 토양 수분이 50% 이하이면 물을 공급, 70% 이상이면 물을 공급 중지.
- 제어된 상태는 데이터베이스에 업데이트됩니다.

**상태 업데이트**: 제어된 상태(팬, 물 공급 등)를 `status` 테이블에 업데이트합니다.

### GET /sensors/status (최근 센서 데이터 조회)

데이터베이스에서 가장 최신의 센서 데이터를 가져오는 API

```jsx
app.get('/sensors/status', (req, res) => {
  // 가장 최근의 센서 데이터 가져오기
  const query = 'SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 1';
  db.query(query, (err, results) => {
    if (err) 
      console.error('[GET /sensors/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    res.json(results[0]); // 가장 최신 센서 데이터 반환
  });
});
```

### GET /devices/status (디바이스 상태 조회)

LED, 팬, 물 공급 장치의 상태를 조회하는 API

```jsx
// 상태 가져오기
app.get('/devices/status', (req, res) => {
  db.query('SELECT led, fan, water FROM status LIMIT 1', (err, results) => {
    if (err) {
      console.error('[GET /devices/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    res.json(results[0]);
  });
});
```

### POST /devices/:deviceId/status (디바이스 상태 변경)

요청받은 디바이스(LED, 팬, 물 공급)의 상태를 변경하는 API

```jsx
// 상태 변경하기
app.post('/devices/:deviceId/status', (req, res) => 
  const device = req.body.device;
  const query = `UPDATE status SET ${device} = NOT ${device} WHERE id = 1`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('[POST /devices/:deviceId/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    res.sendStatus(200);
  });
});
```

### GET /sensors/data (시간대별 센서 데이터 조회)

사용자가 지정한 날짜 범위 내의 센서 데이터를 조회하는 API

```jsx
// 시간대별 데이터 조회
app.get('/sensors/data', (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate와 endDate가 필요합니다." });
  }

  // 날짜에 시간 추가 (00:00:00 ~ 23:59:59)
  const startDateTime = `${startDate} 00:00:00`; 
  const endDateTime = `${endDate} 23:59:59`; 
  const query = `
  SELECT 
    temperature, 
    humidity, 
    soil_moisture, 
    created_at, 
    CONVERT_TZ(created_at, '+00:00', '+09:00') AS created_at_kst 
    FROM sensor_data 
    WHERE created_at BETWEEN CONVERT_TZ(?, '+09:00', '+00:00') 
                        AND CONVERT_TZ(?, '+09:00', '+00:00') 
    ORDER BY created_at ASC
  `;

  db.query(query, [startDateTime, endDateTime], (err, results) => {
    if (err) {
      console.error('[GET /sensors/data] DB 오류:', err);
      return res.status(500).json({ error: 'DB 오류 발생' });
    }
    res.json(results);
  });
});
```

### GET /sensors/average (센서 데이터 통계 조회)

센서 데이터를 날짜별, 주별, 월별로 평균값을 조회하는 통계 API

```jsx
app.get('/sensors/average', (req, res) => {
  const { type } = req.query; // day, week, month 중 하나

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
      DATE(created_at) AS period, 
      AVG(temperature) AS avg_temperature, 
      AVG(humidity) AS avg_humidity, 
      AVG(soil_moisture) AS avg_soil_moisture
    FROM sensor_data
    GROUP BY period
    ORDER BY period ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('[GET /sensors/average] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    res.json(results);
  });
});
```

### 전체코드

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

// 기본 웹 페이지 만들기
app.get('/', (req, res) => {  // GET 요청이 루트 경로(/ 즉, 홈페이지)로 오면 실행됨
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 센서 데이터 저장
app.post('/sensors', (req, res) => {
  const start = new Date(); // 요청 시간 기록
  console.log(`[${start.toISOString()}] ${req.method} ${req.url} 요청 - 데이터:`, req.body);

  // 요청 바디에서 센서 데이터 받기
  const { temperature, humidity, soil_moisture } = req.body;

  // 필드 값 체크
  if (temperature == null || humidity == null || soil_moisture == null) {
    console.log('[POST /sensors] 필드 누락 - 요청 거부');
    return res.status(400).send('모든 필드를 채워주세요.');
  }

  // 센서 데이터 DB에 저장
  const query = `INSERT INTO sensor_data (temperature, humidity, soil_moisture) VALUES (?, ?, ?)`;
  db.query(query, [temperature, humidity, soil_moisture], (err, results) => {
    const end = new Date();
    const duration = end - start;

    if (err) {
      console.error('[POST /sensors] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }

    // 저장된 센서 데이터를 기반으로 제어 여부를 체크하고 실행
    Controldevice(temperature, humidity, soil_moisture);

    console.log(`[${end.toISOString()}] ${req.method} ${req.url} 응답 - 상태: ${res.statusCode} (${duration}ms)`);
    res.status(200).send('센서 데이터 저장 및 제어 성공');
  });
});

function Controldevice(temperature, humidity, soil_moisture) {
  let fanStatus = 0;  // 'OFF' 상태는 0으로 설정
  let waterStatus = 0;  // 'OFF' 상태는 0으로 설정

  // 온도를 우선시하는 예시
  if (temperature >= 22) {
    fanStatus = 1; // 온도가 높으면 켠다
    console.log('환기팬 켬 (온도 22°C 이상)');
  } else if (temperature <= 18) {
    fanStatus = 0; // 온도가 낮으면 끈다
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
    waterStatus = 1;  // 'ON' 상태는 1로 설정
    console.log('물 공급 (토양 수분 50% 이하)');
  } else if (soil_moisture >= 70) {
    waterStatus = 0;  // 'OFF' 상태는 0으로 설정
    console.log('물 공급 중지 (토양 수분 70% 이상)');
  }

  // 상태 제어를 위한 DB 업데이트
  updateDevice(fanStatus, waterStatus);
}

function updateDevice(fanStatus, waterStatus) {
  const query = `UPDATE status SET fan = ?, water = ? WHERE id = 1`;
  db.query(query, [fanStatus, waterStatus], (err, results) => {
    if (err) {
      console.error('[updateDevice] DB 오류:', err);
    } else {
      console.log('상태 제어 업데이트 완료:', fanStatus, waterStatus);
    }
  });
}

// 최근 센서 데이터 조회
app.get('/sensors/status', (req, res) => {
  const start = new Date(); // 요청 시간 기록
  console.log(`[${start.toISOString()}] ${req.method} ${req.url} 요청`);

  // 가장 최근의 센서 데이터 가져오기
  const query = 'SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 1';
  db.query(query, (err, results) => {
    const end = new Date();
    const duration = end - start;
    if (err) {
      console.error('[GET /sensors/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    console.log(`[${end.toISOString()}] ${req.method} ${req.url} 응답 - 상태: ${res.statusCode} (${duration}ms)`);
    console.log('[GET /sensors/status] 조회된 데이터:', results[0]);  // 조회된 데이터 확인
    res.json(results[0]); // 가장 최신 센서 데이터 반환
  });
});

// 상태 가져오기
app.get('/devices/status', (req, res) => {
  const start = new Date(); // 요청 시간 기록
  console.log(`[${start.toISOString()}] ${req.method} ${req.url} 요청`);

  db.query('SELECT led, fan, water FROM status LIMIT 1', (err, results) => {
    const end = new Date();
    const duration = end - start;
    if (err) {
      console.error('[GET /devices/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    console.log(`[${end.toISOString()}] ${req.method} ${req.url} 응답 - 상태: ${res.statusCode} (${duration}ms)`);
    console.log('[GET /devices/status] 조회된 상태:', results[0]);
    res.json(results[0]);
  });
});

// 상태 변경하기
app.post('/devices/:deviceId/status', (req, res) => {
  const start = new Date(); // 요청 시간 기록
  console.log(`[${start.toISOString()}] ${req.method} ${req.url} 요청 - 데이터:`, req.body);

  const device = req.body.device;
  const query = `UPDATE status SET ${device} = NOT ${device} WHERE id = 1`;

  db.query(query, (err, results) => {
    const end = new Date();
    const duration = end - start;
    if (err) {
      console.error('[POST /devices/:deviceId/status] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    console.log(`[${end.toISOString()}] ${req.method} ${req.url} 응답 - 상태: ${res.statusCode} (${duration}ms)`);
    res.sendStatus(200);
  });
});

// 시간대별 데이터 조회
app.get('/sensors/data', (req, res) => {
  const start = new Date(); // 요청 시간 기록
  console.log(`[${start.toISOString()}] ${req.method} ${req.url} 요청 - 데이터:`, req.query);

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate와 endDate가 필요합니다." });
  }

  // 날짜에 시간 추가 (00:00:00 ~ 23:59:59)
  const startDateTime = `${startDate} 00:00:00`; 
  const endDateTime = `${endDate} 23:59:59`; 

  console.log(`쿼리 실행: ${startDateTime} ~ ${endDateTime}`);

  const query = `
  SELECT 
    temperature, 
    humidity, 
    soil_moisture, 
    created_at, 
    CONVERT_TZ(created_at, '+00:00', '+09:00') AS created_at_kst 
    FROM sensor_data 
    WHERE created_at BETWEEN CONVERT_TZ(?, '+09:00', '+00:00') 
                        AND CONVERT_TZ(?, '+09:00', '+00:00') 
    ORDER BY created_at ASC
  `;

  db.query(query, [startDateTime, endDateTime], (err, results) => {
    if (err) {
      console.error('[GET /sensors/data] DB 오류:', err);
      return res.status(500).json({ error: 'DB 오류 발생' });
    }

    console.log(`조회된 데이터 개수: ${results.length}`);
    res.json(results);
  });
});

// 통계 데이터 조회 API
app.get('/sensors/average', (req, res) => {
  const start = new Date(); // 요청 시간 기록
  console.log(`[${start.toISOString()}] ${req.method} ${req.url} 요청 - 데이터:`, req.body);

  const { type } = req.query; // day, week, month 중 하나

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
      DATE(created_at) AS period, 
      AVG(temperature) AS avg_temperature, 
      AVG(humidity) AS avg_humidity, 
      AVG(soil_moisture) AS avg_soil_moisture
    FROM sensor_data
    GROUP BY period
    ORDER BY period ASC
  `;

  db.query(query, (err, results) => {
    const end = new Date();
    const duration = end - start;
    if (err) {
      console.error('[GET /sensors/average] DB 오류:', err);
      return res.status(500).send('DB 오류 발생');
    }
    console.log(`[${end.toISOString()}] ${req.method} ${req.url} 응답 - 상태: ${res.statusCode} (${duration}ms)`);
    res.json(results);
  });
});

// 서버 시작 시 초기 상태값 삽입 (테이블에 데이터가 없을 경우)
app.listen(PORT, '0.0.0.0', () => {
  console.log('서버가 실행 중입니다.');
});

```
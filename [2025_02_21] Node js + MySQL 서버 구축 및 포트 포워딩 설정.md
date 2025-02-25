# Node.js + MySQL 서버 구축 및 포트 포워딩 설정 정리

## 1. MySQL 서버 설정 (Windows 기준)

### 1.1 MySQL 설치 및 실행

- MySQL이 정상적으로 설치되었는지 확인
    
    ```bash
    mysql --version
    ```
    
- MySQL 서비스 시작/중지 명령어 (관리자 권한 필요)
    
    ```bash
    net start MySQL80  # MySQL 실행
    net stop MySQL80   # MySQL 중지
    ```
    

### 1.2 MySQL 접속 및 데이터베이스 생성

- MySQL 접속 (비밀번호 입력 필요)
    
    ```bash
    mysql -u root -p
    ```
    
- 데이터베이스 생성 및 사용자 설정
    
    ```sql
    CREATE DATABASE test_db;
    CREATE USER 'user'@'%' IDENTIFIED BY 'password';
    GRANT ALL PRIVILEGES ON test_db.* TO 'user'@'%';
    FLUSH PRIVILEGES;
    ```
    

### 1.3 방화벽 설정 (Windows 방화벽 허용)

- **명령 프롬프트(관리자 권한) 실행 후 입력**
    
    ```bash
    netsh advfirewall firewall add rule name="MySQL" protocol=TCP dir=in localport=3306 action=allow
    ```
    
    ```bash
    #전체 방화벽 규칙 목록
    netsh advfirewall firewall show rule name=all
    ```
    

---

## 2. ipTIME 공유기에서 포트 포워딩 설정

### 2.1 고정 IP 할당 (내부 네트워크 설정)

내부IP 수동 할당:  [https://iwillcomplete.tistory.com/37](https://iwillcomplete.tistory.com/37)

IP 갱신: [https://iwillcomplete.tistory.com/27](https://iwillcomplete.tistory.com/27)

1. **공유기 관리자 페이지 접속** (`192.168.0.1`)
2. **[ 고급 설정 ] → [ DHCP 서버 설정 ]**
3.  **[ 수동 주소 입력 ]**
    - ip : 사용할 내부 ip주소 (`192.168.0.100`)
    - MAC address : 등록할 디바이스의 MAC address
    - 설명 : 디바이스 구분을 위한 설명

### 2.2 포트 포워딩 설정

1. **[고급 설정] → [NAT/라우터 관리] → [포트 포워드 설정]**
2. 새 포트 포워딩 규칙 추가:
    - 내부 IP: `192.168.0.100`
    - 포트: `8000` (Node.js) 및 `3306` (MySQL)
    - 프로토콜: TCP
3. **적용 후 공유기 재부팅**

### 2.3 공인 IP 확인 및 외부 접속 테스트

- **공인 IP 확인:** [https://whatismyipaddress.com/](https://whatismyipaddress.com/)
- 외부에서 서버 접속 테스트:
    
    ```
    curl http://공인IP:8000
    ```
    

---

## 3. Node.js 서버 구축

### 3.1 Node.js 및 MySQL 패키지 설치

- 프로젝트 디렉토리에서 실행
    
    ```bash
    npm init -y
    npm install express mysql2
    ```
    

### 3.2 `index.js` 서버 코드 작성

```jsx
const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 8000;

const db = mysql.createConnection({
  host: '공인IP 또는 192.168.0.100',
  user: 'user',
  password: 'password',
  database: 'test_db'
});

db.connect(err => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
    return;
  }
  console.log('MySQL 연결 성공');
});

app.get('/', (req, res) => {
  res.send('서버가 정상적으로 실행 중입니다.');
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
```

### 3.3 서버 실행

```bash
node server.js
```

### 3.4 외부 접속 테스트

```bash
curl http://공인IP:8000
```

---

## 4. 트러블슈팅

### ❌ `net start MySQL80` 실행 시 `액세스가 거부되었습니다.` 오류 발생

- **관리자 권한으로 명령 프롬프트 실행 후 다시 시도**

### ❌ `Error: Unknown database 'test_db'`

- MySQL에서 `test_db`가 생성되지 않음 → `CREATE DATABASE test_db;` 실행 후 다시 시도

### ❌ `Cannot find module 'mysql2'`

- `npm install mysql2` 실행 후 다시 시도 (server.js파일이 있는 디렉토리에 설치)

### ❌ 외부에서 접속이 안됨

1. **공유기 포트 포워딩 확인** (`192.168.0.1` → 포트포워딩 설정 확인)
2. **공인 IP 확인 후 접속 테스트** (`curl http://공인IP:8000`)
3. **방화벽 설정 확인** (`netsh advfirewall firewall add rule ...` 다시 실행)

---

## ✅ 최종 확인 사항

✔ MySQL 서버 정상 실행 (`net start MySQL80`)
✔ Node.js 서버 정상 실행 (`node server.js`)
✔ 내부 IP 고정 (`192.168.0.100`)
✔ 포트 포워딩 (`8000` 허용됨)
✔ 공인 IP로 접속 가능 (`http://공인IP:8000`)

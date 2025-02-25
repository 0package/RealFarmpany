# DB테이블(MySQL)

날짜: 2025년 2월 25일
선택: DB

```sql
-- users 테이블 생성
CREATE TABLE users (
    user_id VARCHAR(255) NOT NULL PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

```sql
-- farms 테이블 생성
CREATE TABLE farms (
    farm_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    farm_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_farm_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

```sql
-- device 테이블 생성
CREATE TABLE devices (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    farm_id INT,
    led BOOLEAN NOT NULL,
    fan BOOLEAN NOT NULL,
    water BOOLEAN NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_device_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_device_farm FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

```

```sql
-- sensor 테이블 생성
CREATE TABLE sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    farm_id INT,
    temperature DECIMAL(5,2) DEFAULT NULL,
    humidity DECIMAL(5,2) DEFAULT NULL,
    soil_moisture DECIMAL(5,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sensor_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_sensor_farm FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- users, farms테이블을 생성하여 사용자별로 스마트팜을 관리할 수 있도록 한다.
- devices, sensors테이블에 user_id, farm_id 속성을 추가하여 사용자가 가지고 있는 스마트팜을 독립적으로 관리할 수 있게 해준다.
- devices테이블은 스마트팜별로 하나의 튜플을 이용하여 장치를 제어한다.
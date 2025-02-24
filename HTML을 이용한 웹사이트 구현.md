# HTML을 이용한 웹사이트 구현

날짜: 2025년 2월 23일
선택: 웹사이트

![image.png](image.png)

스마트 농업 관리를 위한 대시보드로, 센서 데이터를 실시간으로 모니터링하고 장치 제어를 할 수 있는 기능을 제공합니다. 

### 센서 데이터 및 장치 제어

- **센서 데이터**:
    - **온도**: 온도 센서 값과 함께 실시간 데이터를 바 형태로 표시
    - **습도**: 습도 센서 값과 실시간 데이터를 바 형태로 표시
    - **토양 수분**: 토양의 수분 센서 값과 실시간 데이터를 바 형태로 표시
    - 각 센서의 값을 시각적으로 표시하며, 실시간 업데이트가 됩니다.
- **장치 제어**:
    - **LED 제어**: 체크박스를 통해 LED 장치를 켜고 끌 수 있습니다.
    - **환기팬 제어**: 체크박스를 통해 환기팬 장치를 제어할 수 있습니다.
    - **물주기 제어**: 체크박스를 통해 물주기 장치를 제어할 수 있습니다.
    - 각 장치는 사용자가 해당 체크박스를 클릭하여 제어할 수 있습니다.

### 시간대별 데이터 조회

- **시간대별 데이터 조회**:
    - **시작 날짜**와 **종료 날짜**를 선택하여 해당 날짜 범위의 센서 데이터를 조회할 수 있습니다.
    - 조회된 데이터는 라인 차트 형태로 시각화되어 온도, 습도, 토양 수분 등의 값을 시간대별로 확인할 수 있습니다.

### 통계 데이터 조회

- **통계 유형**:
    - **일별**, **주별**, **월별**로 데이터를 조회하여 센서의 평균 값을 분석할 수 있습니다.
    - 평균 온도, 평균 습도, 평균 토양 수분 값을 바 형태의 차트로 시각화하여 분석 결과를 쉽게 확인할 수 있습니다.

### JavaScript 기능

- **센서 데이터 실시간 업데이트**: `fetchSensorData()` , `fetchDevicesStatus()`함수를 통해 센서 데이터와 장치 상태를 서버에서 가져와 화면에 실시간으로 업데이트합니다.
- **장치 상태 변경**: 사용자가 장치를 제어할 때, 해당 상태가 서버에 반영되며 `UpdateDevice()` 함수로 변경된 상태를 서버에 전송합니다.
- **데이터 차트**: `loadHistoryData()` 및 `loadStatsData()` 함수는 서버에서 데이터를 가져와 차트를 갱신합니다.

### 전체코드

```html
<!DOCTYPE html>
<html lang="ko">

<head>
    <!-- 페이지 인코딩 및 반응형 웹 설정 -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartFarm 웹 서버</title>
    <!-- Chart.js 라이브러리 -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- 스타일 설정 -->
    <style>
        /* 기본 바디 스타일 */
        body {
            font-family: 'Arial', sans-serif;
            background: #F5F5F5;
            background-size: cover; /* 배경 이미지 크기 조정 */
            color: #000000; /* 기본 글자 색 */
            display: flex;
            flex-direction: column; /* 세로 방향 정렬 */
            align-items: left; /* 화면 중앙 정렬 */
            min-height: 100vh; /* 화면 높이 최소 100% */
            margin: 0;
            padding: 0;
            overflow-y: auto;
        }

        .title-container h1 {
            margin: 10px 20px; /* 위아래 여백 10px, 좌우는 0 */
            font-size: 3rem; /* 필요하면 글자 크기도 조정 */
        }

        /* 전체 컨테이너 설정 */
        .container {
            display: flex;
            flex-direction: row; /* 가로 방향 정렬 */
            justify-content: flex-start; /* 세로 방향으로 시작 */
            width: 100%;
            max-width: 1700px; /* 최대 너비 설정 */
            padding: 20px;
            gap: 20px; /* 요소들 간 간격 */
            box-sizing: border-box; /* 패딩을 포함한 크기 계산 */
        }

        /* 센서 데이터 및 제어 영역을 묶는 컨테이너 */
        .sensor-control-container {
            width: 20%; /* 화면 너비에 맞추어 크기 조정 */
            background: rgba(245, 245, 245, 0); /* 투명한 배경 */
            border-radius: 10px; /* 모서리 둥글게 */
            padding: 0px;
            font-size: calc(1rem + 0.5vw); /* 반응형 글자 크기 */
            display: flex;
            flex-direction: column; /* 세로로 배치 */
            gap: 20px; /* 요소들 간 간격 */
        }

        /* 센서 그래프 컨테이너*/
        .sensor-graph-container{
            display: flex;
            width: 25%;
            background: rgba(245, 245, 245, 0); /* 투명한 배경 */
            padding: 0px;
            flex-direction: column; /* 세로로 배치 */
            gap: 10px; /* 요소들 간 간격 */
            margin-left: auto; /* 오른쪽 정렬 */
        }
        /* 화면이 작을 때 조정 */
        @media (max-width: 768px) {
            .sensor-graph-container {
                width: 100%; /* 작은 화면에서는 전체 너비 사용 */
                align-items: center; /* 가운데 정렬 */
            }
        }
        
        /* 제목 스타일 */
        h1 {
            color: #000000;
            font-size: calc(2rem + 1vw); /* 반응형 글자 크기 */
            margin-left: 20px;
        }

        /* 센서 데이터 박스 스타일 */
        .sensor-data {
            display: flex;
            flex-direction: column;
            align-items: left;
            gap: 5px; /* 요소 간 간격 */
            background: linear-gradient(135deg, rgba(66, 111, 89, 0.9), rgba(66, 66, 66, 0.7)); 
            border-radius: 10px; /* 모서리 둥글게 */
            padding: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2); /* 연한 그림자 */
        }
        /* 각 센서 항목 */
        .sensor-item {
            display: flex;
            align-items: left;
            justify-content: space-between; /* 막대는 왼쪽, 수치는 오른쪽 */
            gap: 5px; /* 텍스트와 막대 그래프 사이 간격 */
            margin-bottom: 5px;
        }

        /* 센서 수치 + 단위 */
        .sensor-value-container {
            display: flex;
            align-items: center;
            justify-content: right; /* 숫자와 단위를 함께 오른쪽 정렬 */
            min-width: 60px; /* 최소 너비 설정 */
            text-align: right; /* 내부 텍스트 오른쪽 정렬 */
        }

        /* 프로그래스 바 스타일 */
        .progress-bar {
            width: 100%;
            height: 19px;
            background: rgba(66, 66, 66, 0);
            overflow: hidden;
        }

        /* 채워지는 부분 */
        .progress-fill {
            height: 100%;
            width: 0;
            transition: width 0.5s ease-in-out;
        }

        /* 개별 색상 */
        #temperature-bar { background: rgb(188, 254, 191, 0.5); }  
        #humidity-bar { background: rgb(188, 254, 191, 0.5); }   
        #soil-moisture-bar { background: rgb(188, 254, 191, 0.5); }

        /* 단위 스타일 */
        .sensor-name {
            font-size: calc(1rem + 0.2vw);
            color: #F5F5F5;
        }

        /* 센서 수치 스타일 */
        .sensor-value {
            font-size: calc(1rem + 0.2vw);
            color: #F5F5F5;
        }

        /* 단위 스타일 */
        .unit {
            font-size: calc(1rem + 0.2vw);
            color: #F5F5F5;
            margin-left: 2px; /* 숫자와 단위 간격 조정 */
        }

        /* 업데이트 시간 표시 */
        #created_at {
            display: block;
            margin-top: 10px;
            color: #e1e1e1;
            font-size: calc(0.6rem + 0.3vw); /* 반응형 글자 크기 */
        }

        /* 기능 제어 영역 스타일 */
        .control {
            background: linear-gradient(135deg, rgba(66, 111, 89, 0.9), rgba(66, 66, 66, 0.7));
            border-radius: 10px; /* 모서리 둥글게 */
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2); /* 그림자 효과 */
            padding: 10px;
            font-size: calc(1rem + 0.5vw); /* 반응형 글자 크기 */
            display: flex;
            flex-direction: column; /* 세로로 배치 */
        }

        /* LED, 팬, 물주기 스위치 스타일 */
        .control label {
            display: flex;
            align-items: center; /* 스위치와 텍스트 정렬 */
            gap: 10px; /* 텍스트와 스위치 간 간격 */
        }

        /* 스위치와 텍스트가 수평으로 나란히 배치 */
        .switch-container {
            display: flex;
            align-items: center; /* 수평 정렬 */
            gap: 10px; /* 버튼과 텍스트 간 간격 */
        }

        /* 스위치(토글 버튼) 스타일 */
        .switch {
            position: relative;
            display: inline-block;
            width: 70px; /* 스위치 너비 */
            height: 30px; /* 스위치 높이 */
            margin-bottom: 10px;
        }

        /* 토글 체크박스 숨기기 */
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        /* 슬라이더 (토글 버튼) */
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #3f3f3f; /* 비활성화 상태 색상 */
            transition: 0.4s;
            border-radius: 30px; /* 둥근 모서리 */
        }

        /* 슬라이더 원 (이동 부분) */
        .slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            border-radius: 50%; /* 완전한 원 */
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: 0.4s;
        }

        /* 체크된 상태일 때 슬라이더 색 변경 */
        input:checked + .slider {
            background: linear-gradient(135deg, #00ff88, #01773c); /* (활성화) */
        }

        /* 체크된 상태일 때 슬라이더 원 이동 */
        input:checked + .slider:before {
            transform: translateX(40px); /* 오른쪽으로 이동 */
        }

        /* 스위치 옆 텍스트 */
        .slider-text {
            font-size: calc(1rem + 0.3vw); /* 반응형 글자 크기 */
            color: #000000;
            margin-bottom: 15px;
        }

        /* 시간대별 그래프*/
        .time-graph {
            width: 90%;
            height: 43%;
            margin: 20px auto;
            padding: 20px;
            background: linear-gradient(135deg, rgba(66, 111, 89, 0.9), rgba(66, 66, 66, 0.7));
            border-radius: 10px; /* 모서리 둥글게 */
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2); /* 그림자 효과 */
        }

        /* 필터 입력 컨테이너 */
        .filter-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-bottom: 5px;
        }

        /* 날짜 입력 필드 */
        input[type="date"] {
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
            background-color: #f9f9f9;
        }

        /* 버튼 스타일 */
        .btn {
            background: #4CAF50;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: 0.3s;
        }
        .btn:hover {
            background: #45a049;
        }

        #chartContainer {
            width: 100%;
            max-width: 800px; /* 원하는 최대 크기 */
            height: 230px; /* 적절한 높이 */
        }

        /* 통계 데이터 그래프 스타일 */
        .avg-graph {
            width: 90%;
            max-width: 800px; /* 최대 크기 설정 */
            background: linear-gradient(135deg, rgba(66, 111, 89, 0.9), rgba(66, 66, 66, 0.7));
            border-radius: 12px; /* 더 부드러운 모서리 */
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); /* 그림자 효과 */
            padding: 20px;
            color: #ffffff; /* 글씨 흰색 */
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        /* 드롭다운 & 버튼 정렬 */
        .stat-controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
        }

        /* 드롭다운 스타일 */
        .stat-controls select {
            padding: 8px 12px;
            border-radius: 6px;
            border: none;
            background: #444;
            color: #fff;
            font-size: 16px;
        }

        /* 버튼 스타일 */
        .stat-controls button {
            background: #4CAF50;
            border: none;
            padding: 8px 16px;
            color: white;
            font-size: 16px;
            border-radius: 6px;
            cursor: pointer;
        }

        .stat-controls button:hover {
            background: #45a049;
        }

        /* 캔버스 크기 조정 */
        #statsChart {
            width: 100%;
            max-height: 300px;
        } 
    </style>
</head>

<body>
    <!-- 제목과 부제목 -->
    <div class="title-container">
        <h1>Real Farmpany</h1>
    </div>
    <div class="container">
        <!-- 센서 데이터 및 장치 제어 영역을 통합한 컨테이너 -->
        <div class="sensor-control-container">
            <!-- 실시간 센서 데이터 -->
            <div class="sensor-data">
                <span class="sensor-name">온도</span>
                <div class="sensor-item">
                    <div class="progress-bar">
                        <div id="temperature-bar" class="progress-fill"></div>
                    </div>
                    <div class="sensor-value-container">
                        <span id="temperature" class="sensor-value">데이터 로딩 중...</span>
                        <span class="unit">°C</span>
                    </div>
                </div>
            
                <span class="sensor-name">습도</span>
                <div class="sensor-item">
                    <div class="progress-bar">
                        <div id="humidity-bar" class="progress-fill"></div>
                    </div>
                    <div class="sensor-value-container">
                        <span id="humidity" class="sensor-value">데이터 로딩 중...</span>
                        <span class="unit">%</span>
                    </div>
                </div>
            
                <span class="sensor-name">토양 수분</span>
                <div class="sensor-item">
                    <div class="progress-bar">
                        <div id="soil-moisture-bar" class="progress-fill"></div>
                    </div>
                    <div class="sensor-value-container">
                        <span id="soil_moisture" class="sensor-value">데이터 로딩 중...</span>
                        <span class="unit">%</span>
                    </div>
                </div>
            </div>                                    

            <!-- 기능 제어 -->
            <div class="control">
                <!-- LED 제어 -->
                <div class="switch-container">
                    <label class="switch">
                        <input type="checkbox" id="led-toggle" onclick="toggleStatus('led')">
                        <span class="slider"></span>
                    </label>
                    <span class="slider-text">LED</span>
                </div>

                <!-- 환기팬 제어 -->
                <div class="switch-container">
                    <label class="switch">
                        <input type="checkbox" id="fan-toggle" onclick="toggleStatus('fan')">
                        <span class="slider"></span>
                    </label>
                    <span class="slider-text">환기팬</span>
                </div>

                <!-- 물주기 제어 -->
                <div class="switch-container">
                    <label class="switch">
                        <input type="checkbox" id="water-toggle" onclick="toggleStatus('water')">
                        <span class="slider"></span>
                    </label>
                    <span class="slider-text">물주기</span>
                </div>
            </div>
        </div>
        <div class="sensor-graph-container">
            <div class="time-graph">
                <div class="filter-container">
                    <label>시작 날짜 <input type="date" id="startDate"></label>
                    <label>종료 날짜 <input type="date" id="endDate"></label>
                    <button class="btn" onclick="loadHistoryData()">조회</button>
                </div>
                <div id="chartContainer">
                    <canvas id="historyChart"></canvas>
                </div>
            </div>
            <div class="avg-graph">
                <div class="stat-controls">
                    <label for="statType">통계 유형</label>
                    <select id="statType">
                        <option value="day">일별</option>
                        <option value="week">주별</option>
                        <option value="month">월별</option>
                    </select>
                    <button onclick="loadStatsData()">조회</button>
                </div>
                <canvas id="statsChart"></canvas>
            </div>
        </div>
    </div>
    <script>
        // 센서 데이터를 가져와 화면에 업데이트하는 함수
        async function fetchSensorData() {
            try {
                const response = await fetch('/sensors/status');
                const data = await response.json();
        
                // 값 업데이트
                updateSensorUI('temperature', data.temperature, 'temperature-bar');
                updateSensorUI('humidity', data.humidity, 'humidity-bar');
                updateSensorUI('soil_moisture', data.soil_moisture, 'soil-moisture-bar');
        
                document.getElementById('created_at').textContent =
                    "업데이트 시간: " + new Date(data.created_at).toLocaleString();
            } catch (error) {
                console.error('데이터 가져오기 실패:', error);
            }
        }
        
        // 센서 UI 업데이트 함수
        function updateSensorUI(sensorId, value, barId) {
            const sensorElement = document.getElementById(sensorId);
            const barElement = document.getElementById(barId);
        
            const formattedValue = formatNumber(value);
            sensorElement.textContent = formattedValue;
        
            // 0~100 범위로 변환 (초과 방지)
            const percentage = Math.min(100, Math.max(0, formattedValue));
            barElement.style.width = percentage + '%';
        }
        
        // 숫자 포맷팅 함수 (소수점 제거)
        function formatNumber(num) {
            return Math.round(num);
        }

        // 상태 가져오기
        async function fetchStatus() {
            try {
                const response = await fetch('/devices/status');
                const data = await response.json();

                // 상태에 따라 토글 상태 변경
                document.getElementById('led-toggle').checked = data.led;
                document.getElementById('fan-toggle').checked = data.fan;
                document.getElementById('water-toggle').checked = data.water;
            } catch (error) {
                console.error('상태 가져오기 실패:', error);
            }
        }

        // 상태 변경하기
        async function toggleStatus(device) {
            try {
                await fetch(`/devices/:deviceId/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device: device })
                });
                fetchStatus();
            } catch (error) {
                console.error('상태 변경 실패:', error);
            }
        }

        // 시간대별 데이터 조회
        function loadHistoryData() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            console.log(`요청하는 날짜 범위: ${startDate} ~ ${endDate}`);

            fetch(`/sensors/data?startDate=${startDate}&endDate=${endDate}`)
                .then(response => response.json())
                .then(data => {
                    console.log("서버 응답 데이터:", data); // 서버에서 받은 데이터 확인

                    if (!data || data.length === 0) {
                        alert("조회된 데이터가 없습니다.");
                        return;
                    }

                    // created_at_kst에서 'YYYY-MM-DD'만 추출
                    const labels = data.map(item => {
                        if (!item.created_at_kst) return "N/A"; // created_at_kst 없으면 "N/A"
                        
                        try {
                            const date = new Date(item.created_at_kst); // KST 변환된 날짜 사용
                            return date.toISOString().split("T")[0]; // YYYY-MM-DD 형식
                        } catch (error) {
                            console.error("날짜 변환 오류:", error);
                            return "N/A";
                        }
                    });

                    const temperatures = data.map(item => item.temperature ?? 0);
                    const humidities = data.map(item => item.humidity ?? 0);
                    const soilMoistures = data.map(item => item.soil_moisture ?? 0);

                    // 기존 차트 안전하게 제거
                    if (window.historyChart instanceof Chart) {
                        window.historyChart.destroy();
                    }

                    // canvas 크기 고정 후 리사이즈
                    const canvas = document.getElementById('historyChart');
                    const ctx = canvas.getContext('2d');

                    // 새 차트 생성
                    window.historyChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: '온도 (°C)',
                                    data: temperatures,
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    borderWidth: 2,
                                    pointRadius: 3,
                                    tension: 0
                                },
                                {
                                    label: '습도 (%)',
                                    data: humidities,
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    borderWidth: 2,
                                    pointRadius: 3,
                                    tension: 0
                                },
                                {
                                    label: '토양 수분 (%)',  // 데이터셋의 라벨 (범례에 표시됨)
                                    data: soilMoistures,  // Y축에 들어갈 데이터 배열 (토양 수분 값들)
                                    borderColor: 'rgba(75, 192, 192, 1)',  // 선의 색상 (청록색)
                                    borderWidth: 2,  // 선 두께 (2px)
                                    pointRadius: 3,  // 각 데이터 점의 크기 (반지름 3px)
                                    tension: 0  // 선을 부드럽게 만드는 곡선 효과 (0: 직선, 1: 곡선)
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                    labels: {
                                        color: '#ffffff'
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: '날짜',
                                        color: '#ffffff'
                                    },
                                    ticks: {
                                        color: '#ffffff' // X축 눈금(label) 색상 변경
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.2)' // X축 격자선 색상 변경 (흰색, 투명도 조정)
                                    },
                                    border: {
                                        color: '#ffffff' // X축 선 색상 변경
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: '측정값',
                                        color: '#ffffff'
                                    },
                                    ticks: {
                                        color: '#ffffff' // Y축 눈금(label) 색상 변경
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.2)' // Y축 격자선 색상 변경 (흰색, 투명도 조정)
                                    },
                                    border: {
                                        color: '#ffffff' // Y축 선 색상 변경
                                    }
                                }
                            }
                        }                        
                    });
                })
                .catch(error => console.error('데이터 가져오기 오류:', error));
        }
   
        // 통계 데이터 가져오기
        function loadStatsData() {
            const type = document.getElementById('statType').value;

            fetch(`/sensors/average?type=${type}`)
                .then(response => response.json())
                .then(data => {
                    const labels = data.map(item => {
                        const date = new Date(item.period);
                        date.setHours(date.getHours() + 9); // UTC → KST 변환
                        return date.toLocaleDateString("ko-KR"); // YYYY. MM. DD. 형식
                    });

                    const avgTemperatures = data.map(item => item.avg_temperature);
                    const avgHumidities = data.map(item => item.avg_humidity);
                    const avgSoilMoistures = data.map(item => item.avg_soil_moisture);

                    const ctx = document.getElementById('statsChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: '평균 온도',
                                    data: avgTemperatures,
                                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    borderWidth: 1
                                },
                                {
                                    label: '평균 습도',
                                    data: avgHumidities,
                                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    borderWidth: 1
                                },
                                {
                                    label: '평균 토양 수분',
                                    data: avgSoilMoistures,
                                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 1
                                }
                            ]
                        },
                        options: {
                            plugins: {
                                legend: {
                                    position: 'top',
                                    labels: {
                                        color: '#ffffff'
                                    }
                                }
                            },
                            scales: {
                                x: { 
                                    display: true,
                                    title: {
                                        display: true,
                                        text: '날짜',
                                        color: '#ffffff'
                                    },
                                    ticks: {
                                        color: '#ffffff' // X축 눈금(label) 색상 변경
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.2)' // X축 격자선 색상 변경 (흰색, 투명도 조정)
                                    },
                                    border: {
                                        color: '#ffffff' // X축 선 색상 변경
                                    }
                                },
                                y: {
                                    display: true,
                                    title: {
                                        display: true,
                                        text: '평균값',
                                        color: '#ffffff'
                                    },
                                    ticks: {
                                        color: '#ffffff' // Y축 눈금(label) 색상 변경
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.2)' // Y축 격자선 색상 변경 (흰색, 투명도 조정)
                                    },
                                    border: {
                                        color: '#ffffff' // Y축 선 색상 변경
                                    }
                                }
                            }
                        }
                    });
                })
                .catch(error => console.error('통계 데이터 가져오기 오류:', error));
        }

        fetchSensorData();
        fetchStatus();

        // 5초마다 함수 호출
        //setInterval(fetchSensorData, 5000);
        //setInterval(fetchStatus, 5000);
    </script>
</body>

</html>

```

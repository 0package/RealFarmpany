import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import BottomTabBarLayout from './bottomtabbar';
import { Calendar, DateData } from 'react-native-calendars';

const screenWidth = Dimensions.get('window').width;

// ------------------ 예시 데이터 (일/주/월) ------------------
const sensorData = {
  daily: {
    labels: ['0시','4시','8시','12시','16시','20시'],
    temperature: [10,15,23,30,28,22],
    humidity:    [40,45,48,53,58,60],
    soil:        [25,30,35,38,34,32],
    co2:         [300,420,460,540,500,450],
  },
  weekly: {
    labels: ['월','화','수','목','금','토','일'],
    temperature: [24,25,26,27,28,26,25],
    humidity:    [45,47,50,52,55,53,50],
    soil:        [35,36,37,38,39,37,36],
    co2:         [42,43,44,45,46,44,43],
  },
  monthly: {
    labels: ['1일','2일','3일','4일','5일','6일','7일','8일','9일','10일'],
    temperature: [23,24,25,26,27,26,25,24,23,22],
    humidity:    [42,44,46,48,50,49,48,47,45,43],
    soil:        [33,34,35,36,37,36,35,34,33,32],
    co2:         [41,42,43,44,45,44,43,42,41,40],
  },
};

const sensorColors = {
  temperature: '#F59E0B',
  humidity:    '#3B82F6',
  soil:        '#10B981',
  co2:         '#EF4444',
};

const sensorItems: Array<{ key: "temperature" | "humidity" | "soil" | "co2"; label: string; icon: string }> = [
  { key: 'temperature', label: '온도', icon: 'thermometer-outline' },
  { key: 'humidity',    label: '습도', icon: 'water-outline' },
  { key: 'soil',        label: '토양습도', icon: 'leaf-outline' },
  { key: 'co2',         label: 'CO2',  icon: 'cloud-outline' },
];

// StatsScreen 컴포넌트를 먼저 정의
function StatsScreen() {
  // --------------------- 1) 센서 토글 상태 ---------------------
  const [selectedSensors, setSelectedSensors] = useState({
    temperature: true,
    humidity:    true,
    soil:        false,
    co2:         false,
  });
  const toggleSensor = (key: keyof typeof selectedSensors) => {
    const onCount = Object.values(selectedSensors).filter(Boolean).length;
    if (selectedSensors[key] && onCount === 1) return; 
    setSelectedSensors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --------------------- 2) 기간(커스텀만 남김) ---------------------
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ★ 리렌더 유도용
  const [dummyRender, setDummyRender] = useState(false);

  // --------------------- 3) 페이드 애니메이션 ---------------------
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [timeRange, dummyRender]);

  // --------------------- 4) 차트 데이터 구성 ---------------------
  const currentKey = timeRange === 'custom' ? 'monthly' : timeRange;
  const currentData = sensorData[currentKey];

  const activeDatasets = Object.keys(selectedSensors)
    .filter(k => selectedSensors[k as keyof typeof selectedSensors])
    .map((k) => ({
      data: currentData[k as keyof typeof currentData] as number[],
      color: () => sensorColors[k as keyof typeof sensorColors],
      strokeWidth: 3,
    }));

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: '#fff',
    },
  };

  // 달력에서 날짜 클릭
  const onDayPress = (day: DateData) => {
    const newDate = new Date(day.year, day.month - 1, day.day);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  // --------------------- (추가) 서버와 통신 ---------------------
  const farmId = '1'; // 예시 farm_id
  function formatDate(d: Date) {
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth()+1).padStart(2,'0');
    const dd   = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }

  useEffect(() => {
    async function fetchServerData() {
      try {
        if (timeRange === 'daily') {
          // 일간 -> realtime
          const url = `https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/realtime-data?farm_id=${farmId}`;
          console.log('[StatsScreen] daily fetch:', url);
          const res = await fetch(url);
          if (!res.ok) {
            const errText = await res.text();
            console.log('[StatsScreen] daily fetch 오류(HTTP):', res.status, errText);
            return;
          }
          const data = await res.json();
          console.log('[StatsScreen] daily fetch 성공 data:', data);

        } else if (timeRange === 'custom') {
          // 커스텀 -> history
          const dateStr = formatDate(selectedDate);
          const url = `https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/history-data?farm_id=${farmId}&date=${dateStr}`;
          console.log('[StatsScreen] custom fetch:', url);

          const res = await fetch(url);
          if (!res.ok) {
            const errText = await res.text();
            console.log('[StatsScreen] custom fetch 오류(HTTP):', res.status, errText);
            return;
          }
          const list = await res.json(); 
          console.log('[StatsScreen] custom fetch 성공 data:', list);

          // A) x축: 0,4,8,12,16,20 => 총 6개
          const newLabels = ['0시','4시','8시','12시','16시','20시'];
          const newTemp: (number|null)[] = Array(6).fill(null);
          const newHum:  (number|null)[] = Array(6).fill(null);
          const newSoil: (number|null)[] = Array(6).fill(null);
          const newCo2:  (number|null)[] = Array(6).fill(null);

          const hourToIndex: Record<number,number> = {0:0,4:1,8:2,12:3,16:4,20:5};

          list.forEach((obj: any) => {
            const tstr = obj.time_interval; 
            const hr = parseInt(tstr.slice(11,13), 10); 
            if (hourToIndex[hr] !== undefined) {
              const idx = hourToIndex[hr];
              newTemp[idx] = parseFloat(obj.avg_temperature)  || 0;
              newHum[idx]  = parseFloat(obj.avg_humidity)     || 0;
              newSoil[idx] = parseFloat(obj.avg_soil_moisture)|| 0;
              newCo2[idx]  = parseFloat(obj.avg_co2)          || 0;
            }
          });

          sensorData.monthly.labels      = newLabels;
          sensorData.monthly.temperature = newTemp.map(v => v ?? 0);
          sensorData.monthly.humidity    = newHum.map(v => v ?? 0);
          sensorData.monthly.soil        = newSoil.map(v => v ?? 0);
          sensorData.monthly.co2         = newCo2.map(v => v ?? 0);

          setDummyRender(x => !x);

        } else {
          console.log('[StatsScreen] weekly/monthly -> 서버 fetch 없음(예시)');
        }
      } catch (err) {
        console.log('[StatsScreen] 서버 fetch 오류:', err);
      }
    }

    fetchServerData();
  }, [timeRange, selectedDate]);

  return (
    <BottomTabBarLayout initialTab="stats">
      {/* 상단바 */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>통계그래프</Text>
      </View>

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* (1) 센서 버튼 */}
          <View style={styles.sensorRow}>
            {sensorItems.map((sItem) => {
              const isOn = selectedSensors[sItem.key as keyof typeof selectedSensors];
              return (
                <TouchableOpacity
                  key={sItem.key}
                  style={[styles.sensorBtn, isOn && styles.sensorBtnActive]}
                  onPress={() => toggleSensor(sItem.key)}
                >
                  <Ionicons
                    name={sItem.icon as any}
                    size={24}
                    color={isOn ? '#fff' : '#444'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[styles.sensorBtnLabel, isOn && { color: '#fff' }]}>
                    {sItem.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* (2) 기간 버튼 - 일간/주간/월간 제거, "기간"만 가운데 */}
          <View style={[styles.dropdownContainer, { justifyContent: 'center' }]}>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => setTimeRange('custom')}
            >
              <Text style={{ color: timeRange === 'custom' ? '#78c87e' : '#444' }}>기간</Text>
            </TouchableOpacity>
          </View>

          {/* custom 모드 → 달력 아이콘 */}
          {timeRange === 'custom' && (
            <View style={styles.customDateContainer}>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#666"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.calendarText}>
                  {`${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* (3) 그래프 카드 */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>
                {timeRange === 'daily'   && '일간 통계'}
                {timeRange === 'weekly'  && '주간 통계'}
                {timeRange === 'monthly' && '월간 통계'}
                {timeRange === 'custom'  && `(${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일) 통계`}
              </Text>
            </View>

            <LineChart
              data={{
                labels: currentData.labels,
                datasets: activeDatasets,
                legend: Object.keys(selectedSensors)
                  .filter(k => selectedSensors[k as keyof typeof selectedSensors])
                  .map(k => {
                    const found = sensorItems.find(si => si.key === k);
                    return found?.label || k;
                  }),
              }}
              width={screenWidth - 40}
              height={400}
              chartConfig={chartConfig}
              style={{ ...styles.chartStyle, marginLeft: -10, marginRight: 5 }}
              withOuterLines
              withVerticalLines
              withHorizontalLines
            />
          </View>
        </ScrollView>
      </Animated.View>

      {showDatePicker && (
        <Modal transparent={true} animationType="fade">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                날짜 선택
              </Text>

              <Calendar
                onDayPress={onDayPress}
                style={{ borderRadius: 10 }}
                theme={{
                  arrowColor: '#78c87e',
                  todayTextColor: '#78c87e',
                }}
              />

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={{ color: '#78c87e', fontSize: 16, fontWeight: '600' }}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </BottomTabBarLayout>
  );
}

// `default export` 명시적으로 지정
export default StatsScreen;

// ---------------- Styles (수정 없음) ----------------
const styles = StyleSheet.create({
  topBar: {
    height: 60,
    backgroundColor: '#78c87e',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: 'bold',
  },

  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  sensorBtn: {
    width: '22%',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  sensorBtnActive: {
    backgroundColor: '#78c87e',
  },
  sensorBtnLabel: {
    fontSize: 14,
    color: '#444',
  },

  dropdownContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  dropdownBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  customDateContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  calendarButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    alignItems: 'center',
  },
  calendarText: {
    fontSize: 15,
    color: '#333',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  chartHeader: {
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chartStyle: {
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'center',
  },

  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#78c87e',
    borderRadius: 8,
  },
});
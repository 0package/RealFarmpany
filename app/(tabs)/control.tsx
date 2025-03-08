import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Switch,
  FlatList,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabBarLayout from './bottomtabbar';

// 기기 아이콘 매핑
const deviceIcons: Record<string, string> = {
  fan: 'refresh-outline',
  heater: 'flame-outline',
  ac: 'thermometer-outline',
  pump: 'water-outline',
  led: 'bulb-outline',
};

// 센서 설정
const sensorConfigs = [
  { id: 'temp', label: '온도',    valueKey: 'temperature', unit: '°C',  max: 50 },
  { id: 'hum',  label: '습도',    valueKey: 'humidity',    unit: '%',   max: 100 },
  { id: 'soil', label: '토양습도', valueKey: 'soil',       unit: '%',   max: 100 },
  { id: 'co2',  label: 'CO2',     valueKey: 'co2',         unit: 'ppm', max: 1 },
];

// 게이지 색상/폭 계산
function getColorByValue(value: number, max: number) {
  const ratio = value / max;
  if (ratio < 0.33) return '#78c87e';
  if (ratio < 0.66) return '#fbbf24';
  return '#ef4444';
}
function getProgressWidth(value: number, max: number) {
  let ratio = value / max;
  if (ratio > 1) ratio = 1;
  return Math.round(ratio * 100);
}

export default function ControlScreen() {
  // --------------------------------------------------
  // 1) userId, farmId, farmName를 내부저장소에서 불러오기
  // --------------------------------------------------
  const [userId, setUserId] = useState('');
  const [farmId, setFarmId] = useState('');
  // farmName도 동적으로 표시하기 위해 State로 변경
  const [farmName, setFarmName] = useState('');

  // userId, farmId, farmName 로드
  useEffect(() => {
    async function loadIds() {
      try {
        const storedUserId   = await AsyncStorage.getItem('LOGGED_IN_USER');
        const storedFarmId   = await AsyncStorage.getItem('SELECTED_FARM_ID');
        const storedFarmName = await AsyncStorage.getItem('SELECTED_FARM_NAME');

        if (storedUserId)   setUserId(storedUserId);
        if (storedFarmId)   setFarmId(storedFarmId);
        if (storedFarmName) setFarmName(storedFarmName);
      } catch (err) {
        console.log('[ControlScreen] 내부저장소에서 user/farm ID 불러오기 오류:', err);
      }
    }
    loadIds();
  }, []);

  // --------------------------------------------------
  // 2) 화면 상태
  // --------------------------------------------------
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isAuto, setIsAuto] = useState(false);

  // 서버에서 받아올 센서 데이터
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity]       = useState(0);
  const [soil, setSoil]              = useState(0);
  const [co2, setCo2]                = useState(0);
  const [updatedTime, setUpdatedTime] = useState('');

  // 서버에서 받아올 연결 기기 목록
  const [devices, setDevices] = useState([
    { id: 'fan',    name: '환풍팬', enabled: false },
    { id: 'heater', name: '난방기', enabled: false },
  ]);

  const [availableOptions, setAvailableOptions] = useState([
    { id: 'ac',   name: '에어컨',    selected: false },
    { id: 'pump', name: '급수장치', selected: false },
    { id: 'led',  name: 'LED 조명', selected: false },
  ]);

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // --------------------------------------------------
  // 3) 서버에서 센서/기기 데이터 조회
  // --------------------------------------------------
  async function fetchSensors() {
    if (!userId || !farmId) {
      console.log('[ControlScreen] fetchSensors: userId/farmId가 없어서 중단');
      return;
    }
    try {
      const url = `https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/sensors/status?user_id=${userId}&farm_id=${farmId}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errText = await res.text();
        console.log('[ControlScreen] 센서 fetch 오류(HTTP):', errText);
        return;
      }
      const contentType = res.headers.get('Content-Type') || '';
      const bodyText = await res.text();

      if (!contentType.includes('application/json')) {
        console.log('[ControlScreen] 센서 fetch 오류(HTML?):', bodyText);
        return;
      }
      if (!bodyText) {
        console.log('[ControlScreen] 센서 fetch 오류: 응답 Body가 비어있음');
        return;
      }

      let data;
      try {
        data = JSON.parse(bodyText);
      } catch (parseErr) {
        console.log('[ControlScreen] 센서 fetch JSON 파싱 오류:', parseErr);
        return;
      }

      console.log('[ControlScreen] 센서 fetch data:', data);

      if (data.message && !data.temperature && !data.humidity && !data.soil_moisture && !data.co2) {
        console.log('[ControlScreen] 센서 fetch: 데이터가 없어서 기본값 세팅');
        setTemperature(0);
        setHumidity(0);
        setSoil(0);
        setCo2(0);
        setUpdatedTime('');
        return;
      }

      setTemperature(data.temperature ? parseFloat(data.temperature) : 0);
      setHumidity(data.humidity ? parseFloat(data.humidity) : 0);
      setSoil(data.soil_moisture ? parseFloat(data.soil_moisture) : 0);
      setCo2(data.co2 ?? 0);
      setUpdatedTime(data.created_at ?? '');
    } catch (err) {
      console.log('[ControlScreen] 센서 fetch 오류:', err);
    }
  }

  async function fetchDevices() {
    if (!userId || !farmId) {
      console.log('[ControlScreen] fetchDevices: userId/farmId가 없어서 중단');
      return;
    }
    try {
      const url = `https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/devices/status?user_id=${userId}&farm_id=${farmId}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errText = await res.text();
        console.log('[ControlScreen] 기기 fetch 오류(HTTP):', errText);
        return;
      }
      const contentType = res.headers.get('Content-Type') || '';
      const bodyText = await res.text();

      if (!contentType.includes('application/json')) {
        console.log('[ControlScreen] 기기 fetch 오류(HTML?):', bodyText);
        return;
      }
      if (!bodyText) {
        console.log('[ControlScreen] 기기 fetch 오류: 응답 Body가 비어있음');
        setDevices([]);
        return;
      }

      let data;
      try {
        data = JSON.parse(bodyText);
      } catch (parseErr) {
        console.log('[ControlScreen] 기기 fetch JSON 파싱 오류:', parseErr);
        return;
      }
      console.log('[ControlScreen] 기기 fetch data:', data);

      if (!Array.isArray(data)) {
        if (data.message && !data.id) {
          console.log('[ControlScreen] 기기 fetch: 데이터가 없어서 빈 배열 세팅');
          setDevices([]);
          return;
        }

        const newDevices: { id: string; name: string; enabled: boolean }[] = [];
        if (data.fan === 1) {
          newDevices.push({ id: 'fan', name: '환풍팬', enabled: true });
        }
        if (data.heater === 1) {
          newDevices.push({ id: 'heater', name: '난방기', enabled: true });
        }
        if (data.cooler === 1) {
          newDevices.push({ id: 'ac', name: '에어컨', enabled: true });
        }
        if (data.water === 1) {
          newDevices.push({ id: 'pump', name: '급수장치', enabled: true });
        }
        if (data.led === 1) {
          newDevices.push({ id: 'led', name: 'LED 조명', enabled: true });
        }

        setDevices(newDevices);
        return;
      }

      if (Array.isArray(data)) {
        setDevices(data);
      }
    } catch (err) {
      console.log('[ControlScreen] 기기 fetch 오류:', err);
    }
  }

  // --------------------------------------------------
  // 4) 화면 로드 시 동작 (useEffect 분리)
  // --------------------------------------------------
  useEffect(() => {
    // 페이드 애니메이션
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (userId && farmId) {
      fetchSensors();
      fetchDevices();
    }
  }, [userId, farmId]);

  // --------------------------------------------------
  // 5) 나머지 UI/이벤트 로직
  // --------------------------------------------------
  const [toggleCount] = useState(0); // 기존 코드 유지, 필요 시 삭제 가능
  const toggleAuto = (val: boolean) => {
    setIsAuto(val);
  };

  const handleDeviceToggle = (id: string) => {
    if (isAuto) return;
    setDevices((prev) =>
      prev.map((dev) => dev.id === id ? { ...dev, enabled: !dev.enabled } : dev)
    );
  };

  const openConfig = () => setIsConfigOpen(true);
  const closeConfig = () => setIsConfigOpen(false);

  const toggleConfigItem = (id: string) => {
    setAvailableOptions((prev) =>
      prev.map((opt) => opt.id === id ? { ...opt, selected: !opt.selected } : opt)
    );
  };

  const saveConfig = () => {
    const selectedItems = availableOptions.filter((o) => o.selected);
    if (selectedItems.length > 0) {
      setDevices((prev) => {
        const newList = [...prev];
        selectedItems.forEach((item) => {
          if (!newList.find((dev) => dev.id === item.id)) {
            newList.push({ id: item.id, name: item.name, enabled: false });
          }
        });
        return newList;
      });
    }
    setAvailableOptions((prev) =>
      prev.map((opt) => ({ ...opt, selected: false }))
    );
    closeConfig();
  };

  const handleDeleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((dev) => dev.id !== id));
  };

  const renderSensorGauges = () => (
    <View style={styles.sensorCard}>
      {sensorConfigs.map((cfg) => {
        let sensorValue = 0;
        if (cfg.valueKey === 'temperature') sensorValue = temperature;
        if (cfg.valueKey === 'humidity')    sensorValue = humidity;
        if (cfg.valueKey === 'soil')        sensorValue = soil;
        if (cfg.valueKey === 'co2')         sensorValue = co2;

        const color    = getColorByValue(sensorValue, cfg.max);
        const barWidth = getProgressWidth(sensorValue, cfg.max);

        return (
          <View key={cfg.id} style={styles.sensorItem}>
            <View style={styles.sensorLine}>
              <Text style={styles.sensorLabel}>{cfg.label}</Text>
              <Text style={[styles.sensorValue, { color }]}>
                {sensorValue}{cfg.unit}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: color,
                  height: '100%',
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        );
      })}
      {updatedTime ? (
        <Text style={styles.updateTime}>{updatedTime}</Text>
      ) : (
        <Text style={[styles.updateTime, { color: '#e55' }]}>
          데이터가 없습니다.
        </Text>
      )}
    </View>
  );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <BottomTabBarLayout initialTab="control">
        <SafeAreaView style={styles.safeArea}>
          {/* 상단 바 */}
          <View style={styles.topBar}>
            {/* ★ 여기서 farmName 표시 */}
            <Text style={styles.farmName}>{farmName}</Text>

            {/* 자동/수동 스위치 */}
            <View style={styles.toggleRow}>
              <Text style={{ color: '#fff', marginRight: 8 }}>
                {isAuto ? '자동' : '수동'}
              </Text>
              <Switch
                value={isAuto}
                onValueChange={toggleAuto}
                thumbColor="#fff"
                trackColor={{ false: '#888', true: '#4cd964' }}
              />
            </View>

            {/* 설정 버튼 */}
            <TouchableOpacity onPress={openConfig} style={styles.settingIcon}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 스크롤 영역 */}
          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            {renderSensorGauges()}

            <View style={styles.devicesHeader}>
              <Text style={styles.devicesTitle}>연결 센서</Text>
              <TouchableOpacity
                onPress={() => {
                  // 새로고침 버튼 → 다시 서버 호출
                  fetchSensors();
                  fetchDevices();
                }}
              >
                <Ionicons name="refresh" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.deviceGrid}>
              {devices.map((dev) => {
                const iconName = deviceIcons[dev.id] || 'help-outline';
                return (
                  <View key={dev.id} style={styles.deviceItem}>
                    <Ionicons
                      name={iconName as any}
                      size={24}
                      color="#333"
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={styles.deviceName}>{dev.name}</Text>
                    <Switch
                      value={dev.enabled}
                      onValueChange={() => handleDeviceToggle(dev.id)}
                      disabled={isAuto}
                    />
                    <Text style={styles.deviceStatus}>
                      {dev.enabled ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* 센서/기기 추가 모달 */}
          <Modal
            visible={isConfigOpen}
            animationType="slide"
            transparent={false}
          >
            <SafeAreaView style={styles.modalContainer}>
              <Text style={styles.modalTitle}>센서/기기 추가</Text>

              <Text style={styles.sectionSubtitle}>추가 가능한 목록</Text>
              <FlatList
                data={availableOptions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      item.selected && styles.optionItemSelected
                    ]}
                    onPress={() => toggleConfigItem(item.id)}
                  >
                    <Text style={{ fontSize: 16 }}>{item.name}</Text>
                    {item.selected && (
                      <Ionicons name="checkmark" size={20} color="#333" />
                    )}
                  </TouchableOpacity>
                )}
              />

              <Text style={styles.sectionSubtitle}>이미 추가된 센서/기기</Text>
              <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.addedItemRow}>
                    <Text style={{ fontSize: 16 }}>{item.name}</Text>
                    <TouchableOpacity
                      style={{ padding: 6 }}
                      onPress={() => handleDeleteDevice(item.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity onPress={saveConfig} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>저장</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsConfigOpen(false)}
                  style={[styles.saveBtn, { backgroundColor: '#aaa' }]}
                >
                  <Text style={styles.saveBtnText}>취소</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </BottomTabBarLayout>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f8f4',
  },
  topBar: {
    height: 60,
    backgroundColor: '#78c87e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  farmName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  settingIcon: {
    marginLeft: 'auto',
  },

  sensorCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sensorItem: {
    marginBottom: 12,
  },
  sensorLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sensorValue: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  progressBar: {
    marginTop: 4,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  updateTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },

  devicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  devicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  deviceItem: {
    width: '48%',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 15,
    color: '#333',
    marginVertical: 4,
  },
  deviceStatus: {
    fontSize: 13,
    color: '#999',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  optionItemSelected: {
    backgroundColor: '#ddf7dd',
  },
  addedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveBtn: {
    backgroundColor: '#78c87e',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

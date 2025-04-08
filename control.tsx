import React, { useEffect, useState, useRef } from 'react';
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
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabBarLayout from './bottomtabbar';
import Slider from '@react-native-community/slider';

// ============================
// 1) 기기 아이콘 매핑 (그대로)
// ============================
const deviceIcons: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  fan: 'refresh-outline',
  heater: 'flame',
  ac: 'snow',
  pump: 'water',
  led: 'bulb',
};

// ============================
// 2) 센서 설정 (그대로)
// ============================
const sensorConfigs = [
  { id: 'temp', label: '온도',    valueKey: 'temperature', unit: '°C',  max: 50 },
  { id: 'hum',  label: '습도',    valueKey: 'humidity',    unit: '%',   max: 100 },
  { id: 'soil', label: '토양습도', valueKey: 'soil',       unit: '%',   max: 100 },
  { id: 'co2',  label: 'CO2',     valueKey: 'co2',         unit: 'ppm', max: 1 },
];

// --------------------- (수정 없음) 게이지 계산 함수 ---------------------
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
  // 1) userId, farmId, farmName 로드 (기존 그대로)
  // --------------------------------------------------
  const [userId, setUserId] = useState('');
  const [farmId, setFarmId] = useState('');
  const [farmName, setFarmName] = useState('');

  useEffect(() => {
    async function loadIds() {
      try {
        const uid = await AsyncStorage.getItem('LOGGED_IN_USER');
        const fid = await AsyncStorage.getItem('SELECTED_FARM_ID');
        const fname = await AsyncStorage.getItem('SELECTED_FARM_NAME');
        if (uid) setUserId(uid);
        if (fid) setFarmId(fid);
        if (fname) setFarmName(fname);
      } catch (err) {
        console.log('[ControlScreen] load error:', err);
      }
    }
    loadIds();
  }, []);

  // --------------------------------------------------
  // 2) 화면 상태 (기존 그대로)
  // --------------------------------------------------
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isAuto, setIsAuto] = useState(false);

  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [soil, setSoil] = useState(0);
  const [co2, setCo2] = useState(0);
  const [updatedTime, setUpdatedTime] = useState('');

  // 연결 기기 목록
  const [devices, setDevices] = useState([
    { id: 'fan', name: '환풍팬', enabled: false },
    { id: 'heater', name: '난방기', enabled: false },
  ]);

  // (+) 모달에서 선택할 기기 목록
  const [availableOptions, setAvailableOptions] = useState([
    { id: 'ac', name: '쿨러', selected: false },
    { id: 'pump', name: '급수장치', selected: false },
    { id: 'led', name: 'LED 조명', selected: false },
    { id: 'heater', name: '난방기', selected: false },
    { id: 'fan', name: '환풍팬', selected: false },
  ]);

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // 추가: 온도 설정 관련 상태
  const [deviceSettings, setDeviceSettings] = useState({
    쿨러: { temperature: 40, humidity: 100, soil: 100, co2: 500 },
    급수장치: { temperature: 40, humidity: 100, soil: 100, co2: 500 },
    led조명: { temperature: 40, humidity: 100, soil: 100, co2: 500 },
    히터: { temperature: 40, humidity: 100, soil: 100, co2: 500 },
    환풍팬: { temperature: 40, humidity: 100, soil: 100, co2: 500 },
  });
  const [isTempModalOpen, setIsTempModalOpen] = useState(false);

  // 추가: 저장 상태 관리
  const [isSaved, setIsSaved] = useState(false);

  // 추가: 슬라이더 값 변경 핸들러 (타입 명시)
  const handleSettingChange = (
    deviceId: keyof typeof deviceSettings,
    key: keyof typeof deviceSettings['쿨러'],
    value: number
  ) => {
    setDeviceSettings(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        [key]: value,
      },
    }));
  };

  // 추가: 저장 버튼 클릭 핸들러
  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000); // 2초 후 "저장완료!" 텍스트 사라짐
  };

  // --------------------------------------------------
  // 3) 서버에서 센서/기기 데이터 조회 (기존)
  // --------------------------------------------------
  async function fetchSensors() {
    if (!userId || !farmId) {
      console.log('[ControlScreen] fetchSensors: user/farm 없음');
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
        console.log('[ControlScreen] 센서 fetch: Body 비어있음');
        return;
      }
      let data;
      try {
        data = JSON.parse(bodyText);
      } catch (err) {
        console.log('[ControlScreen] 센서 fetch JSON 파싱 오류:', err);
        return;
      }
      console.log('[ControlScreen] 센서:', data);
      if (data.message && !data.temperature && !data.humidity && !data.soil_moisture && !data.co2) {
        setTemperature(0); setHumidity(0); setSoil(0); setCo2(0); setUpdatedTime('');
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
      console.log('[ControlScreen] fetchDevices: user/farm 없음');
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
        console.log('[ControlScreen] 기기 fetch: Body 비어있음');
        setDevices([]);
        return;
      }
      let data;
      try {
        data = JSON.parse(bodyText);
      } catch (err) {
        console.log('[ControlScreen] 기기 fetch JSON 파싱 오류:', err);
        return;
      }
      console.log('[ControlScreen] 기기:', data);
      if (!Array.isArray(data)) {
        if (data.message && !data.id) {
          console.log('[ControlScreen] 기기 fetch: 데이터 없음 -> 빈배열');
          setDevices([]);
          return;
        }
        const newDev: { id: string; name: string; enabled: boolean }[] = [];
        if (data.fan === 1) newDev.push({ id: 'fan', name: '환풍팬', enabled: true });
        if (data.heater === 1) newDev.push({ id: 'heater', name: '난방기', enabled: true });
        if (data.cooler === 1) newDev.push({ id: 'ac', name: '쿨러', enabled: true });
        if (data.water === 1) newDev.push({ id: 'pump', name: '급수장치', enabled: true });
        if (data.led === 1) newDev.push({ id: 'led', name: 'LED 조명', enabled: true });
        setDevices(newDev);
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
  // 4) 화면 로드 시 (페이드 애니+서버조회) (기존)
  // --------------------------------------------------
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
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
  // 5) 나머지 UI/이벤트 로직 (수정 없음)
  // --------------------------------------------------
  const toggleAuto = (val: boolean) => setIsAuto(val);
  const handleDeviceToggle = (id: string) => {
    if (isAuto) return;
    setDevices(prev =>
      prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d)
    );
  };

  const openConfig = () => setIsConfigOpen(true);
  const closeConfig = () => setIsConfigOpen(false);

  const toggleConfigItem = (id: string) => {
    setAvailableOptions(prev =>
      prev.map(o => o.id === id ? { ...o, selected: !o.selected } : o)
    );
  };
  const saveConfig = () => {
    const sel = availableOptions.filter(o => o.selected);
    if (sel.length > 0) {
      setDevices(prev => {
        const newList = [...prev];
        sel.forEach(it => {
          if (!newList.find(d => d.id === it.id)) {
            newList.push({ id: it.id, name: it.name, enabled: false });
          }
        });
        return newList;
      });
    }
    setAvailableOptions(prev => prev.map(o => ({ ...o, selected: false })));
    closeConfig();
  };
  const handleDeleteDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  // --------------------- 센서 게이지 UI (기존 그대로) ---------------------
  const renderSensorGauges = () => (
    <View style={styles.sensorCard}>
      {sensorConfigs.map(cfg => {
        let sensorValue = 0;
        if (cfg.valueKey === 'temperature') sensorValue = temperature;
        if (cfg.valueKey === 'humidity') sensorValue = humidity;
        if (cfg.valueKey === 'soil') sensorValue = soil;
        if (cfg.valueKey === 'co2') sensorValue = co2;

        const color = getColorByValue(sensorValue, cfg.max);
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
      {updatedTime
        ? <Text style={styles.updateTime}>{updatedTime}</Text>
        : <Text style={[styles.updateTime, { color: '#e55' }]}>데이터가 없습니다.</Text>
      }
    </View>
  );

  // ================================
  // ★ 기기별 애니메이션용 Subcomponent
  // ================================
  const LedIcon: React.FC = () => {
    // 깜빡임(Opacity)
    const blinkAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop(); // 언마운트 시 정지
    }, []);
    return (
      <Animated.View style={{ opacity: blinkAnim }}>
        <Ionicons name="bulb" size={24} color="#FFD700" style={{ marginBottom: 4 }} />
      </Animated.View>
    );
  };

  const AcIcon: React.FC = () => {
    // 회전
    const spinAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }, []);
    const rotate = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    return (
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="snow" size={24} color="#00bfff" style={{ marginBottom: 4 }} />
      </Animated.View>
    );
  };

  const PumpIcon: React.FC = () => {
    // 위아래
    const pumpAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pumpAnim, { toValue: -5, duration: 500, useNativeDriver: true }),
          Animated.timing(pumpAnim, { toValue: 5, duration: 800, useNativeDriver: true }),
          Animated.timing(pumpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, []);
    return (
      <Animated.View style={{ transform: [{ translateY: pumpAnim }] }}>
        <Ionicons name="water" size={24} color="#3498db" style={{ marginBottom: 4 }} />
      </Animated.View>
    );
  };

  const HeaterIcon: React.FC = () => {
    // 빨간색 깜빡임
    const colorAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(colorAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.timing(colorAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, []);
    const animColor = colorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#333', '#ff0000'],
    });
    // Animated.Text로 감싸서 애니메이션 색상 적용
    return (
      <Animated.Text style={{ marginBottom: 4, color: animColor }}>
        <Ionicons name="flame" size={24} />
      </Animated.Text>
    );
  };

  // 수정: 환풍팬 ON/OFF에 따라 회전 애니메이션 추가
  const FanIcon: React.FC<{ isOn: boolean }> = ({ isOn }) => {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isOn) {
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      } else {
        spinAnim.stopAnimation();
        spinAnim.setValue(0);
      }
    }, [isOn]);

    const rotate = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View style={isOn ? { transform: [{ rotate }] } : {}}>
        <Ionicons name="refresh-outline" size={24} color="#333" style={{ marginBottom: 4 }} />
      </Animated.View>
    );
  };

  // ============================
  // ★ renderDeviceIcon()에서 FanIcon에 isOn 전달
  // ============================
  const renderDeviceIcon = (dev: { id: string; enabled: boolean }) => {
    const isOn = dev.enabled || isAuto;
    if (!isOn) {
      // OFF 상태 → 정적 Ionicons
      return (
        <Ionicons
          key={dev.id + '-off'}
          name={deviceIcons[dev.id] || 'help-outline'}
          size={24}
          color="#333"
          style={{ marginBottom: 4 }}
        />
      );
    }
    // ON or auto → 서브컴포넌트 (애니메이션)
    switch (dev.id) {
      case 'led':
        return <LedIcon key={dev.id + '-on'} />;
      case 'ac':
        return <AcIcon key={dev.id + '-on'} />;
      case 'pump':
        return <PumpIcon key={dev.id + '-on'} />;
      case 'heater':
        return <HeaterIcon key={dev.id + '-on'} />;
      case 'fan':
        return <FanIcon key={dev.id + '-on'} isOn={isOn} />;
      default:
        // 없는 아이콘은 fallback
        return (
          <Ionicons
            key={dev.id + '-on'}
            name={deviceIcons[dev.id] || 'help-outline'}
            size={24}
            color="#333"
            style={{ marginBottom: 4 }}
          />
        );
    }
  };

  // ------------------- 렌더링 -------------------
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <BottomTabBarLayout initialTab="control">
        <SafeAreaView style={styles.safeArea}>
          {/* 상단 바 */}
          <View style={styles.topBar}>
             <Text
              style={[styles.farmName, { flex: 1, flexShrink: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
              >
              {farmName}
              </Text>

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

            {/* 수정: 온도 설정 버튼을 아이콘만으로 변경 */}
            <TouchableOpacity
              onPress={() => setIsTempModalOpen(true)}
              style={styles.tempSettingButton}
            >
              <Ionicons name="thermometer-outline" size={24} color="#fff" style={styles.tempIcon} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsConfigOpen(true)} style={styles.settingIcon}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            {renderSensorGauges()}

            <View style={styles.devicesHeader}>
              <Text style={styles.devicesTitle}>연결 센서</Text>
            </View>

            <View style={styles.deviceGrid}>
              {devices.map(dev => (
                <View key={dev.id} style={styles.deviceItem}>
                  {renderDeviceIcon(dev)}

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
              ))}
            </View>
          </ScrollView>

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
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      item.selected && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      setAvailableOptions(prev =>
                        prev.map(opt =>
                          opt.id === item.id
                            ? { ...opt, selected: !opt.selected }
                            : opt
                        )
                      );
                    }}
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
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.addedItemRow}>
                    <Text style={{ fontSize: 16 }}>{item.name}</Text>
                    <TouchableOpacity
                      style={{ padding: 6 }}
                      onPress={() => {
                        setDevices(prev => prev.filter(d => d.id !== item.id));
                      }}
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

          {/* 추가: 온도 설정 모달 */}
          <Modal
            visible={isTempModalOpen}
            animationType="slide"
            transparent={false}
          >
            <SafeAreaView style={styles.modalContainer}>
              <Text style={styles.modalTitle}>온도 설정</Text>
              <ScrollView>
                {(Object.keys(deviceSettings) as (keyof typeof deviceSettings)[]).map(deviceId => (
                  <View key={deviceId} style={styles.deviceSettingSection}>
                    <Text style={styles.deviceSettingTitle}>
                      {devices.find(d => d.id === deviceId)?.name || deviceId}
                    </Text>
                    <View style={styles.sliderItem}>
                      <Text>온도: {deviceSettings[deviceId].temperature.toFixed(1)}°C</Text>
                      <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={0}
                        maximumValue={40}
                        step={0.1}
                        value={deviceSettings[deviceId].temperature}
                        onValueChange={value => handleSettingChange(deviceId, 'temperature', value)}
                        minimumTrackTintColor="#78c87e"
                        maximumTrackTintColor="#ddd"
                        thumbTintColor="#78c87e"
                      />
                    </View>
                    <View style={styles.sliderItem}>
                      <Text>습도: {deviceSettings[deviceId].humidity.toFixed(1)}%</Text>
                      <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={0}
                        maximumValue={100}
                        step={0.1}
                        value={deviceSettings[deviceId].humidity}
                        onValueChange={value => handleSettingChange(deviceId, 'humidity', value)}
                        minimumTrackTintColor="#78c87e"
                        maximumTrackTintColor="#ddd"
                        thumbTintColor="#78c87e"
                      />
                    </View>
                    <View style={styles.sliderItem}>
                      <Text>토양습도: {deviceSettings[deviceId].soil.toFixed(1)}%</Text>
                      <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={0}
                        maximumValue={100}
                        step={0.1}
                        value={deviceSettings[deviceId].soil}
                        onValueChange={value => handleSettingChange(deviceId, 'soil', value)}
                        minimumTrackTintColor="#78c87e"
                        maximumTrackTintColor="#ddd"
                        thumbTintColor="#78c87e"
                      />
                    </View>
                    <View style={styles.sliderItem}>
                      <Text>CO2: {deviceSettings[deviceId].co2.toFixed(1)}ppm</Text>
                      <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={0}
                        maximumValue={500}
                        step={0.1}
                        value={deviceSettings[deviceId].co2}
                        onValueChange={value => handleSettingChange(deviceId, 'co2', value)}
                        minimumTrackTintColor="#78c87e"
                        maximumTrackTintColor="#ddd"
                        thumbTintColor="#78c87e"
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsTempModalOpen(false)}
                  style={[styles.closeBtn, { backgroundColor: '#aaa' }]}
                >
                  <Text style={styles.saveBtnText}>닫기</Text>
                </TouchableOpacity>
              </View>
              {isSaved && <Text style={styles.savedText}>저장완료!</Text>}
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </BottomTabBarLayout>
    </Animated.View>
  );
}

// ---------------- Styles (수정 및 추가) ----------------
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
    maxWidth: '50%',
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
    marginTop: 4,
    paddingHorizontal: 16,
  },
  saveBtn: {
    backgroundColor: '#78c87e',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // 수정: 온도 설정 버튼 스타일 (아이콘만 표시하도록 변경)
  tempSettingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff44', // 반투명 흰색 배경
    padding: 6, // 아이콘 크기에 맞게 패딩 축소
    borderRadius: 8, // 더 작은 원형 느낌
    marginRight: 8,
    marginLeft: 80, // 설정 버튼과의 간격 유지
  },
  tempIcon: {
    // marginRight 제거 (텍스트가 없으므로 불필요)
  },
  tempButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceSettingSection: {
    marginBottom: 20,
  },
  deviceSettingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sliderItem: {
    marginBottom: 15,
  },
  closeBtn: {
    backgroundColor: '#78c87e',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 15,
    alignItems: 'center',
  },
  savedText: {
    textAlign: 'center',
    color: '#78c87e',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
});
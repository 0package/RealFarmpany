import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ListFarmScreen() {
  // --------------------------------------------------
  // 1) 로그인 후 저장된 userId 불러오기
  // --------------------------------------------------
  const [userId, setUserId] = useState('');

  // userId 로드
  async function loadUserId() {
    try {
      const storedId = await AsyncStorage.getItem('LOGGED_IN_USER');
      if (storedId) {
        setUserId(storedId);
        console.log('[ListFarm] 내부저장소 userId:', storedId);
      } else {
        console.log('[ListFarm] userId 없음');
      }
    } catch (err) {
      console.log('[ListFarm] userId 로드 오류:', err);
    }
  }
  useEffect(() => {
    loadUserId();
  }, []);

  // --------------------------------------------------
  // 2) 농장 목록 State
  // --------------------------------------------------
  const [farms, setFarms] = useState([
    // 초기 MOCK 예시
    { id: '1', farmName: '영돌이 농장', location: '부산', crop: '상추' },
    { id: '2', farmName: '티케하우스', location: '서울', crop: '토마토' },
  ]);

  // 테스트용 임시
  const testFarms = [
    { id: 't1', farmName: '테스트농장1', location: 'TestLoc1', crop: 'Test작물1' },
    { id: 't2', farmName: '테스트농장2', location: 'TestLoc2', crop: 'Test작물2' },
  ];

  // --------------------------------------------------
  // 3) 서버에서 농장목록 가져오기
  // --------------------------------------------------
  async function fetchFarmsFromServer(_userId: string) {
    try {
      console.log('[ListFarm] fetchFarmsFromServer 시작, userId:', _userId);
      const response = await fetch(
        `https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/getFarms?user_id=${_userId}`
      );
      console.log('[ListFarm] 응답 status:', response.status);

      const dataObj = await response.json();
      console.log('[ListFarm] 응답 data:', dataObj);

      // dataObj: { farms: [...], message: '...' }
      const farmArray = dataObj.farms;
      if (Array.isArray(farmArray) && farmArray.length > 0) {
        const mapped = farmArray.map((item) => ({
          id: item.farm_id?.toString() || '0',
          farmName: item.farm_name || '이름없음',
          location: item.farm_location || '위치미상',
          crop: item.farm_type || '작물미상',
        }));
        setFarms(mapped);
      } else {
        console.log('[ListFarm] farms 배열이 비어 testFarms 사용');
        setFarms(testFarms);
      }
    } catch (err) {
      console.log('[ListFarm] 서버 통신 오류:', err);
      console.log('[ListFarm] testFarms 적용');
      setFarms(testFarms);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchFarmsFromServer(userId);
    }
  }, [userId]);

  // --------------------------------------------------
  // (+)농장 추가 모달/상태
  // --------------------------------------------------
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');
  const [newFarmCrop, setNewFarmCrop] = useState('');

  const handleAddFarmPress = () => setShowAddModal(true);

  const handleAddFarm = async () => {
    if (!newFarmName || !newFarmLocation || !newFarmCrop) return;

    // 서버에 전송할 JSON
    const farmData = {
      user_id: userId,
      farm_name: newFarmName,
      farm_location: newFarmLocation,
      farm_type: newFarmCrop,
    };
    console.log('[ListFarm] 새 농장 추가 -> POST:', farmData);

    try {
      const addRes = await fetch('https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/addFarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmData),
      });
      console.log('[ListFarm] addFarm 응답 status:', addRes.status);

      const addData = await addRes.json();
      console.log('[ListFarm] addFarm 응답 data:', addData);

      if (addRes.ok) {
        console.log('[ListFarm] 농장추가 서버등록 성공 => 다시 fetch');
        if (userId) {
          await fetchFarmsFromServer(userId);
        }
      } else {
        console.log('[ListFarm] 농장추가 응답이 실패상태');
      }
    } catch (err) {
      console.log('[ListFarm] addFarm 오류:', err);
    }

    setNewFarmName('');
    setNewFarmLocation('');
    setNewFarmCrop('');
    setShowAddModal(false);
  };

  // --------------------------------------------------
  // (-)농장 삭제 (로컬)
  // --------------------------------------------------
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const handleRemoveFarmPress = () => setShowRemoveModal(true);

  const handleRemoveFarm = (id: string) => {
    const updated = farms.filter((farm) => farm.id !== id);
    setFarms(updated);
  };

  // --------------------------------------------------
  // 알림 on/off
  // --------------------------------------------------
  const [isNotificationOn, setIsNotificationOn] = useState(false);
  const handleNotificationToggle = () => setIsNotificationOn(!isNotificationOn);

  // --------------------------------------------------
  // 농장 ID/이름 저장 → ControlScreen에서 사용
  // --------------------------------------------------
  async function storeSelectedFarm(farmId: string, farmName: string) {
    try {
      await AsyncStorage.setItem('SELECTED_FARM_ID', farmId);
      await AsyncStorage.setItem('SELECTED_FARM_NAME', farmName);
      console.log('[ListFarm] 내부저장소 selectedFarmId:', farmId);
      console.log('[ListFarm] 내부저장소 selectedFarmName:', farmName);
    } catch (err) {
      console.log('[ListFarm] selectedFarm 저장 오류:', err);
    }
  }

  // --------------------------------------------------
  // 렌더링
  // --------------------------------------------------
  const renderFarmItem = ({ item }: { item: typeof farms[number] }) => (
    <TouchableOpacity
      style={styles.farmCard}
      // farmId, farmName 함께 저장 → ControlScreen 이동
      onPress={async () => {
        // 1) AsyncStorage에 farmId, farmName 저장
        await storeSelectedFarm(item.id, item.farmName);

        // 2) ControlScreen 라우트로 이동 (예: '/(tabs)/control')
        // 만약 mainUI가 ControlScreen이라면 그대로.
        // ★ 본인 라우트 구조에 맞게 수정
        router.push('/(tabs)/mainUI');
      }}
    >
      <Ionicons name="leaf-outline" size={24} color="#555" />

      <View style={{ marginLeft: 8 }}>
        <Text style={styles.farmName}>{item.farmName}</Text>
        <Text style={styles.farmSub}>위치: {item.location}</Text>
        <Text style={styles.farmSub}>작물: {item.crop}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>레알팜퍼니</Text>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleNotificationToggle}>
            {isNotificationOn ? (
              <Ionicons name="notifications" size={24} color="#fff" />
            ) : (
              <Ionicons name="notifications-off" size={24} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIcon} onPress={handleAddFarmPress}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIcon} onPress={handleRemoveFarmPress}>
            <Ionicons name="remove-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 본문 */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>내 농장 목록</Text>

        <FlatList
          data={farms}
          keyExtractor={(item) => item.id}
          renderItem={renderFarmItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          style={{ marginTop: 16 }}
        />
      </View>

      {/* (+) 농장 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 농장 추가</Text>

            <TextInput
              style={styles.input}
              placeholder="농장 이름"
              value={newFarmName}
              onChangeText={setNewFarmName}
            />
            <TextInput
              style={styles.input}
              placeholder="농장 위치"
              value={newFarmLocation}
              onChangeText={setNewFarmLocation}
            />
            <TextInput
              style={styles.input}
              placeholder="작물"
              value={newFarmCrop}
              onChangeText={setNewFarmCrop}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddFarm}>
                <Text style={styles.modalButtonText}>추가</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* (-) 농장 삭제 모달 */}
      <Modal
        visible={showRemoveModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRemoveModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>농장 삭제 (로컬)</Text>

            <FlatList
              data={farms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.removeItemRow}>
                  <Text style={styles.removeItemText}>{item.farmName}</Text>
                  <TouchableOpacity
                    style={[styles.modalButton, { paddingHorizontal: 10, marginLeft: 10 }]}
                    onPress={() => handleRemoveFarm(item.id)}
                  >
                    <Text style={styles.modalButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#aaa', flex: 1 }]}
                onPress={() => setShowRemoveModal(false)}
              >
                <Text style={styles.modalButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    width: '100%',
    height: 50,
    backgroundColor: '#7ec87e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  farmCard: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
  },
  farmName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  farmSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#7ec87e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  removeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  removeItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

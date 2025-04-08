import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// ★ 공용 레이아웃 임포트
import BottomTabBarLayout from './bottomtabbar';

// ★ 내부저장소에서 farmName을 가져오기 위해 추가
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MenuUIScreen() {
  // ---------------- 추가: farmName 로드 ----------------
  const [farmName, setFarmName] = useState('');

  useEffect(() => {
    async function loadFarmName() {
      try {
        const storedFarmName = await AsyncStorage.getItem('SELECTED_FARM_NAME');
        if (storedFarmName) {
          setFarmName(storedFarmName);
          console.log('[MenuUI] 내부저장소 SELECTED_FARM_NAME:', storedFarmName);
        } else {
          console.log('[MenuUI] farmName 없음');
        }
      } catch (err) {
        console.log('[MenuUI] farmName 로드 오류:', err);
      }
    }
    loadFarmName();
  }, []);

  return (
    <BottomTabBarLayout initialTab="menu">
      {/* 메뉴화면의 본문 */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Ionicons name="menu-outline" size={24} color="#333" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>메뉴 화면</Text>
        </View>

        <View style={styles.content}>
          {/* 수정: farmName 동적 표시, 없으면 '영돌이농장님' 대체 */}
          <Text style={styles.profileText}>
            {farmName ? `${farmName}님 안녕하세요!` : '영돌이농장님 안녕하세요!'}
          </Text>

          {/* 예: 별도 메뉴 버튼 */}
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="exit-outline" size={20} color="#333" style={{ marginRight: 8 }} />
            <Text>로그아웃</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="contrast-outline" size={20} color="#333" style={{ marginRight: 8 }} />
            <Text>테마변경</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="leaf-outline" size={20} color="#333" style={{ marginRight: 8 }} />
            <Text>농장변경</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BottomTabBarLayout>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    padding: 18,
    backgroundColor: '#ddf7dd',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 16,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});

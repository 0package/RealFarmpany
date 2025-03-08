import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBarLayout from './bottomtabbar';

export default function MenuUIScreen() {
  return (
    <BottomTabBarLayout initialTab="menu">
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더(공통 스타일) */}
        <View style={styles.header}>
          <Ionicons name="menu-outline" size={24} color="#047857" style={{ marginRight: 12 }} />
          <Text style={styles.headerTitle}>메뉴 화면</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.profileText}>영돌이농장님 안녕하세요!</Text>

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
    backgroundColor: '#fff',
  },
  // 통일된 헤더
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ecfdf5', // 동일하게
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 22,
    color: '#047857', // 진한 초록
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

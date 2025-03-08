import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated, // 애니메이션
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

// 로고 이미지 (예: /assets/images/app_logo.png)
const appLogo = require('../../assets/images/mainLogo.png');

// 화면 크기
const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  // 로고 페이드 인 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 화면이 마운트되면 로고 페이드 인
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // "시작하기" 버튼 클릭 → 로그인 화면으로 이동
  const handleStart = () => {
    router.push('/(tabs)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 전체 화면 컨테이너 */}
      <View style={styles.container}>
        {/* 로고 + 텍스트 페이드 인 영역 */}
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          {/* 로고 (이미지) */}
          <Animated.Image source={appLogo} style={styles.logo} />
          {/* 앱 메인 텍스트 */}
          <Text style={styles.title}>Real-Farmpany</Text>
          <Text style={styles.subtitle}>내 손안의 스마트 농장</Text>
        </Animated.View>

        {/* 시작하기 버튼 */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // 연한 초록색 배경 (원하는 톤으로 조정)
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,   // 로고 크기 조정
    height: 200,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2E4A21', // 짙은 초록
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
  },
  startButton: {
    backgroundColor: '#7ec87e',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

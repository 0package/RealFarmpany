import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const MAIN_GREEN = '#7EC87E';
const SUB_GREEN = '#81C784';

export default function EcoFriendlyLoginScreen() {
  const router = useRouter();

  // 화면 페이드인 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 일반 로그인용 ID/PW
  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Google 로그인
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '...',
    redirectUri: '...',
  });

  // 화면 페이드 인
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // 로그인 버튼
  const handleLogin = async () => {
    if (!userId || !userPassword) {
      Alert.alert('로그인 실패', '아이디와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      console.log('[Login] 서버에 로그인 요청:', userId, userPassword);

      const response = await fetch('https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, password: userPassword }),
      });
      console.log('[Login] 응답 status:', response.status);

      const data = await response.json();
      console.log('[Login] 응답 data:', data);

      if (response.ok) {
        Alert.alert('로그인 성공', `${userId}님 환영합니다!`);
        // 로그인 성공 -> userId를 AsyncStorage에 저장
        await AsyncStorage.setItem('LOGGED_IN_USER', userId);
        // listfarm 화면으로 이동
        router.replace('/(tabs)/listfarm');
      } else {
        Alert.alert('로그인 실패', data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('[Login] 오류:', error);
      Alert.alert('오류', '서버 요청에 실패했습니다.');
    }
  };

  // "다음" 버튼 (로그인 건너뛰기)
  const handleSkip = () => {
    router.replace('/(tabs)/listfarm');
  };

  // 회원가입 버튼
  const handleSignup = () => {
    router.push('/(tabs)/signup');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Real-FarmPany</Text>
            <Text style={styles.subtitle}>내 손안의 스마트 농장</Text>
          </View>
          <View style={styles.inputZone}>
            <TextInput
              style={styles.input}
              placeholder="아이디"
              placeholderTextColor="#888"
              value={userId}
              onChangeText={setUserId}
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#888"
              secureTextEntry
              value={userPassword}
              onChangeText={setUserPassword}
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>다음</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Text style={styles.signupButtonText}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, color: '#2E4A21', fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 22 },
  inputZone: {},
  input: {
    backgroundColor: '#fff',
    borderColor: '#D3E0D3',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: MAIN_GREEN,
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  skipButton: {
    backgroundColor: '#FFA726',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  skipButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  signupButton: {
    backgroundColor: SUB_GREEN,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signupButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

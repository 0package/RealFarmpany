import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,  // ★ Animated 추가
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { WebView } from "react-native-webview"

// ★ 하단 탭 레이아웃 임포트
import BottomTabBarLayout from "./bottomtabbar"

// 라즈베리파이 카메라 호스트 주소 (예: MJPEG HTTP 스트리밍)
const RPI_STREAM_URL = "https://marsh-weather-reasonable-vids.trycloudflare.com/monitor"

export default function CctvScreen() {
  // 1) 페이드인 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current

  // 2) 컴포넌트 마운트 시 애니메이션 시작
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  // 예시: 캡처/스냅샷 버튼
  const handleCapture = useCallback(() => {
    // 실제로는 WebView 등에서 capture(이미지 저장) 로직이 필요
    Alert.alert("캡처", "캡쳐완료!")
  }, [])

  return (
    <BottomTabBarLayout initialTab="cctv">
      {/* 3) Animated.View로 감싸기 + opacity 적용 */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SafeAreaView style={styles.container}>

          {/* 상단 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>CCTV 화면</Text>
          </View>

          {/* CCTV 화면을 담는 블록(카드) */}
          <View style={styles.cctvBlock}>
            <Text style={styles.blockTitle}>라즈베리파이 카메라</Text>

            {/* 실제 스트리밍: WebView로 표시 */}
            <View style={styles.cameraContainer}>
              <WebView
                source={{ uri: RPI_STREAM_URL }}
                style={styles.cameraWebView}
              />
            </View>

            {/* 하단부 기능: 캡처 버튼 */}
            <View style={styles.captureRow}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
              >
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.captureButtonText}>캡처</Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </Animated.View>
    </BottomTabBarLayout>
  )
}

// ---------------- Styles ----------------
const { width, height } = Dimensions.get("window")
const BLOCK_HEIGHT = 400  // 예시 높이 (원하는 대로 조정)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    height: 60,
    backgroundColor: "#78c87e",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  // CCTV 블록
  cctvBlock: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 12,
    // 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,

    // 높이
    height: BLOCK_HEIGHT,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  cameraWebView: {
    width: "100%",
    height: "100%",
  },
  captureRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  captureButtonText: {
    marginLeft: 6,
    color: "#fff",
    fontWeight: "bold",
  },
})

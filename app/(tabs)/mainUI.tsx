import React, { useState, FC, useEffect, useRef } from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native"
import { Ionicons, Feather } from "@expo/vector-icons"
import BottomTabBarLayout from "./bottomtabbar"

// ---------------- 타입 정의 ----------------
type CropData = {
  id: number
  name: string
  growthRate: number   // 성장률
  daysToHarvest: number// D-Day
  image: any
}
type ContentData = {
  id: number
  title: string
  description: string
  image?: any
}

// 화면 너비 (슬라이드에 사용)
const screenWidth = Dimensions.get("window").width

// D-Day 배지
const Badge: FC<{ days: number; text: string }> = ({ days, text }) => {
  const isUnder7 = days <= 7
  return (
    <View style={[
      styles.badge,
      { backgroundColor: isUnder7 ? "#ef4444" : "#e5e7eb" },
    ]}>
      <Text style={[
        styles.badgeText,
        { color: isUnder7 ? "#fff" : "#374151" }
      ]}>
        {text}
      </Text>
    </View>
  )
}

// 성장률 ProgressBar
const ProgressBar: FC<{ progress: number }> = ({ progress }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
  )
}

const MainUI: FC = () => {
  // 알림 아이콘 on/off
  const [isNotificationOn, setIsNotificationOn] = useState(false)
  const handleNotificationToggle = () => setIsNotificationOn(!isNotificationOn)

  // 작물 데이터 (D-Day & 성장률)
  const crops: CropData[] = [
    {
      id: 1,
      name: "방울토마토",
      growthRate: 75,  
      daysToHarvest: 7,
      image: require("../../assets/images/Tomato.png"),
    },
    {
      id: 2,
      name: "상추",
      growthRate: 90,
      daysToHarvest: 3,
      image: require("../../assets/images/lettuce.png"),
    },
    {
      id: 3,
      name: "딸기",
      growthRate: 45,
      daysToHarvest: 15,
      image: require("../../assets/images/strawberry.png"),
    },
  ]

  // 추천 컨텐츠 데이터
  const normalContents: ContentData[] = [
    {
      id: 1,
      title: "토마토 재배 팁",
      description: "토마토 재배를 위한 최적의 환경 조성 방법",
    },
    {
      id: 2,
      title: "유기농 비료 사용법",
      description: "작물 성장을 촉진하는 유기농 비료 활용 가이드",
    },
  ]

  // 토마토/비료 이미지 3장씩
  const tomatoImages = [
    require("../../assets/images/tomato1.png"),
    require("../../assets/images/Tomato.png"),
    require("../../assets/images/tomato2.png"),
  ]
  const fertilizerImages = [
    require("../../assets/images/fertilizer1.png"),
    require("../../assets/images/fertilizer.png"),
    require("../../assets/images/fertilizer2.png"),
  ]

  // 슬라이드 인덱스/레퍼런스
  const [tomatoIndex, setTomatoIndex] = useState(0)
  const [fertIndex, setFertIndex] = useState(0)
  const tomatoScrollRef = useRef<ScrollView>(null)
  const fertScrollRef = useRef<ScrollView>(null)

  // 5초마다 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      setTomatoIndex((prev) => {
        const next = prev + 1
        if (next >= tomatoImages.length) {
          tomatoScrollRef.current?.scrollTo({ x: 0, animated: true })
          return 0
        } else {
          tomatoScrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true })
          return next
        }
      })
      setFertIndex((prev) => {
        const next = prev + 1
        if (next >= fertilizerImages.length) {
          fertScrollRef.current?.scrollTo({ x: 0, animated: true })
          return 0
        } else {
          fertScrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true })
          return next
        }
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const SLIDE_WIDTH = screenWidth * 0.8

  // 수동 스와이프 종료
  const onTomatoScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x
    let idx = Math.round(offsetX / SLIDE_WIDTH)
    if (idx >= tomatoImages.length) {
      tomatoScrollRef.current?.scrollTo({ x: 0, animated: false })
      idx = 0
    }
    setTomatoIndex(idx)
  }
  const onFertScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x
    let idx = Math.round(offsetX / SLIDE_WIDTH)
    if (idx >= fertilizerImages.length) {
      fertScrollRef.current?.scrollTo({ x: 0, animated: false })
      idx = 0
    }
    setFertIndex(idx)
  }

  // ============ 챗봇 상태 ============
  // 1) 초기 메시지: (영돌이농장)님 무엇을 도와드릴까요? → user 버블(초록색)
  const [chatLogs, setChatLogs] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "user", text: "(영돌이농장)님 무엇을 도와드릴까요?" },
  ])
  
  const [chatInput, setChatInput] = useState("")
  
  const handleSendChat = () => {
    if (!chatInput.trim()) return
    const userMsg = { role: "user" as const, text: chatInput }
    setChatLogs((prev) => [...prev, userMsg])

    // 예시 답변
    const botReply = { role: "bot" as const, text: `“${chatInput}”에 대한 안내입니다. (예시)` }
    setChatLogs((prev) => [...prev, botReply])

    setChatInput("")
  }

  // ============ UI 렌더링 ============
  return (
    <BottomTabBarLayout initialTab="main">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ecfdf5" />

        {/* 상단 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>레알팜퍼니</Text>

          <View style={styles.headerRight}>
            <View style={styles.avatar}>
              <Image
                source={{ uri: "https://via.placeholder.com/32" }}
                style={styles.avatarImage}
              />
            </View>

            <TouchableOpacity
              style={[styles.iconButton, { marginLeft: "auto" }]}
              onPress={handleNotificationToggle}
            >
              <Ionicons
                name={isNotificationOn ? "notifications" : "notifications-off"}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* ----------- 작물 현황 ----------- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내 작물 현황</Text>

            <View style={styles.cropList}>
              {crops.map((crop) => (
                <View key={crop.id} style={styles.cropCard}>
                  <Image source={crop.image} style={styles.cropImage} />
                  <View style={styles.cropInfo}>
                    <View style={styles.cropHeader}>
                      <Text style={styles.cropName}>{crop.name}</Text>
                      <Badge days={crop.daysToHarvest} text={`D-${crop.daysToHarvest}`} />
                    </View>

                    <View style={styles.growthInfo}>
                      <View style={styles.growthHeader}>
                        <Text style={styles.growthLabel}>성장률</Text>
                        <Text
                          style={[
                            styles.growthValue,
                            { color: crop.growthRate >= 70 ? "#ef4444" : "#6b7280" },
                          ]}
                        >
                          {crop.growthRate}%
                        </Text>
                      </View>
                      <ProgressBar progress={crop.growthRate} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ----------- 추천 컨텐츠 (슬라이드) ----------- */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>추천 컨텐츠</Text>
              <TouchableOpacity>
                <Text style={styles.seeMoreText}>더보기</Text>
              </TouchableOpacity>
            </View>

            {/* (1) 토마토 재배 팁 -> 슬라이드 */}
            <View style={styles.contentCard}>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>{normalContents[0].title}</Text>
                <Text style={styles.contentDescription}>{normalContents[0].description}</Text>
              </View>

              <ScrollView
                ref={tomatoScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onTomatoScrollEnd}
                style={{ width: SLIDE_WIDTH, alignSelf: "center" }}
              >
                {tomatoImages.map((img, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: SLIDE_WIDTH,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Image source={img} style={styles.slideImage} />
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* (2) 유기농 비료 사용법 -> 슬라이드 */}
            <View style={styles.contentCard}>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>{normalContents[1].title}</Text>
                <Text style={styles.contentDescription}>{normalContents[1].description}</Text>
              </View>

              <ScrollView
                ref={fertScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onFertScrollEnd}
                style={{ width: SLIDE_WIDTH, alignSelf: "center" }}
              >
                {fertilizerImages.map((img, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: SLIDE_WIDTH,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Image source={img} style={styles.slideImage} />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* ----------- 스마트 농부 도우미(챗봇) ----------- */}
          <View style={[styles.section, { marginBottom: 80 }]}>
            <Text style={styles.sectionTitle}>스마트 농부 도우미</Text>

            <View style={styles.chatMessages}>
              {chatLogs.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatBubble,
                    msg.role === "user" ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text style={styles.chatText}>{msg.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="질문을 입력하세요..."
                placeholderTextColor="#9ca3af"
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendChat}>
                <Feather name="send" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BottomTabBarLayout>
  )
}

export default MainUI

// ------------------------ Styles ------------------------
const SLIDE_WIDTH = Math.round(screenWidth * 0.8)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#78c87e",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#fff",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 5,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 8,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },

  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 12,
  },
  seeMoreText: {
    fontSize: 15,
    color: "#059669",
  },
  cropList: {
    gap: 12,
  },
  cropCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cropImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  cropInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  cropHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cropName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  growthInfo: {
    gap: 4,
  },
  growthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  growthLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  growthValue: {
    fontSize: 14,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  contentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    padding: 12,
    alignItems: "center",
  },
  contentInfo: {
    width: "100%",
    marginBottom: 8,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  slideImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  chatMessages: {
    minHeight: 100,
    maxHeight: 300,
    marginBottom: 8,
  },
  chatBubble: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#a7f3d0", // 초록색 박스
    borderTopRightRadius: 4,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#d1fae5",
    borderTopLeftRadius: 4,
  },
  chatText: {
    fontSize: 14,
    color: "#1f2937",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#059669",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
})

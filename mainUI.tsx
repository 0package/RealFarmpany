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
} from "react-native"
import { Ionicons, Feather } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import BottomTabBarLayout from "./bottomtabbar"
import axios from "axios"
import Svg, { Circle } from "react-native-svg"

// ---------------------
// (추가) 알림 아이템 타입
// ---------------------
type AlarmItem = {
  type: string;      // 알림 종류: '위험' | '경고' | '완료' 등
  content: string;   // 알림 내용
  created_at: string; // 알림 생성 날짜
  device: string;    // 변경 장치명
}

type CropData = {
  id: number
  name: string
  growthRate: number
  daysToHarvest: number
  image: any
}

const screenWidth = Dimensions.get("window").width

const Badge: FC<{ days: number; text: string }> = ({ days, text }) => {
  const isUnder7 = days <= 7
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isUnder7 ? "#ef4444" : "#e5e7eb" },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: isUnder7 ? "#fff" : "#374151" },
        ]}
      >
        {text}
      </Text>
    </View>
  )
}

const ProgressBar: FC<{ progress: number }> = ({ progress }) => {
  const barColor = progress >= 80 ? "#ef4444" : "#10b981"
  return (
    <View style={styles.progressContainer}>
      <View
        style={[
          styles.progressBar,
          { width: `${progress}%`, backgroundColor: barColor },
        ]}
      />
    </View>
  )
}

const CircularProgress: FC<{ progress: number }> = ({ progress }) => {
  const size = 100
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <View style={styles.circularProgressContainer}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        rotation={-180}
      >
        <Circle
          stroke="#e5e7eb"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke="#10b981"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.circularProgressText}>{progress}%</Text>
    </View>
  )
}

const MainUI: FC = () => {
  const [farmTitle, setFarmTitle] = useState("테스트농장1")
  const [farmId, setFarmId] = useState<string | null>(null)

  useEffect(() => {
    const loadFarmData = async () => {
      try {
        const storedName = await AsyncStorage.getItem("SELECTED_FARM_NAME")
        const storedFarmId = await AsyncStorage.getItem("SELECTED_FARM_ID")
        if (storedName) setFarmTitle(storedName)
        if (storedFarmId) setFarmId(storedFarmId)
      } catch (err) {
        console.log("[mainUI] farmData 불러오기 오류:", err)
      }
    }
    loadFarmData()
  }, [])

  const [isNotificationOn, setIsNotificationOn] = useState(false)
  const handleNotificationToggle = () => setIsNotificationOn(!isNotificationOn)

  const [startDate, setStartDate] = useState<string | null>(null)
  const [dDay, setDDay] = useState<number>(0)
  const [isStarted, setIsStarted] = useState<boolean>(false)
  const [growthStage, setGrowthStage] = useState<number>(0)
  const [growthRate, setGrowthRate] = useState<number>(20)

  const stageImages = [
    require("../../assets/images/stage1.png"),
    require("../../assets/images/stage2.png"),
    require("../../assets/images/stage3.png"),
    require("../../assets/images/stage4.png"),
    require("../../assets/images/Tomato.png"),
  ]

  // -----------------------------
  // (1) 기존 작물 성장도 fetch
  // -----------------------------
  useEffect(() => {
    const fetchFarmStatus = async () => {
      if (!farmId) return
      try {
        const response = await axios.get(
          `https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/get-farm-status/${farmId}`
        )
        const { startDate, harvestDays, growthRate, farmActive } = response.data
        console.log("내 작물 성장률:", growthRate)
        console.log("내 작물 D-Day:", harvestDays)
        console.log("내 작물 시작일:", startDate)
        console.log("내 작물 활성화 여부:", farmActive)

        const safeDday = harvestDays === 0 ? 1 : harvestDays
        const safeGrowthRate = growthRate === 0 ? 1 : growthRate

        if (startDate && safeDday && safeGrowthRate) {
          setStartDate(startDate)
          // D-DAY 계산: 시작일로부터 현재까지의 일수를 계산하고, 총 수확일에서 뺌
          const start = new Date(startDate)
          const today = new Date()
          const timeDiff = today.getTime() - start.getTime()
          const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24)) // 지난 일수
          const remainingDays = Math.max(safeDday - daysPassed, 0) // 남은 일수 (0 이하로는 내려가지 않음)
          setDDay(remainingDays)
          setGrowthRate(growthRate)
          setIsStarted(farmActive)
        }
      } catch (err) {
        console.log("[mainUI] 성장도 불러오기 오류:", err)
      }
    }
    fetchFarmStatus()
  }, [farmId])

  // -----------------------------
  // "시작하기" 버튼
  // -----------------------------
  const handleStart = async () => {
    if (!farmId) {
      console.log("[mainUI] farmId가 없습니다.")
      return
    }
    try {
      const response = await axios.post(
        "https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/start-farm",
        { farmId }
      )
      const { startDate, harvestDays, growthRate, farmActive } = response.data

      const safeDday = harvestDays === 0 ? 1 : harvestDays
      const safeGrowthRate = growthRate === 0 ? 1 : growthRate

      if (startDate && safeDday && safeGrowthRate) {
        setStartDate(startDate)
        // D-DAY 계산: 시작일로부터 현재까지의 일수를 계산하고, 총 수확일에서 뺌
        const start = new Date(startDate)
        const today = new Date()
        const timeDiff = today.getTime() - start.getTime()
        const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24)) // 지난 일수
        const remainingDays = Math.max(safeDday - daysPassed, 0) // 남은 일수 (0 이하로는 내려가지 않음)
        setDDay(remainingDays)
        setGrowthRate(growthRate)
        setIsStarted(farmActive)
      }
    } catch (err) {
      console.log("[mainUI] 시작하기 오류:", err)
    }
  }

  // -----------------------------
  // "다음 단계" 버튼
  // -----------------------------
  const handleNextStage = () => {
    setGrowthStage((prev) => (prev < 4 ? prev + 1 : 0))
    setGrowthRate((prev) => (prev < 100 ? prev + 20 : 0))
  }

  // -----------------------------
  // (3) 새 알림 목록 (10개)
  // -----------------------------
  const [alarmItems, setAlarmItems] = useState<AlarmItem[]>([])
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    if (!farmId) return
    const fetchAlarmItems = async () => {
      try {
        const response = await axios.get(
          `https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/getAlarm?farm_id=${farmId}`
        )
        console.log("[mainUI] 알림 목록 응답:", response.data)
        // 최근 알림이 맨 위로 오도록 배열을 역순으로 설정
        setAlarmItems(response.data.reverse())
      } catch (err) {
        console.log("[mainUI] 알림목록 fetch 오류:", err)
      }
    }
    fetchAlarmItems()
  }, [farmId])

  // "더보기"로 알림 최대 3개 vs 전체
  const visibleAlarms = showMore ? alarmItems : alarmItems.slice(0, 3)

  // ========== AI 영농일지 ==========
  const [chatLogs, setChatLogs] = useState<{ role: "user" | "bot"; text: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chatScrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    chatScrollRef.current?.scrollToEnd({ animated: true })
  }, [chatLogs])

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const handleSendChat = async () => {
    if (!chatInput.trim()) return

    const userMsg = { role: "user" as const, text: chatInput }
    setChatLogs((prev) => [...prev, userMsg])
    setChatInput("")
    setIsLoading(true)

    const maxRetries = 3
    let retryCount = 0
    let retryDelay = 20000
    const startTime = Date.now()

    while (retryCount < maxRetries) {
      try {
        if (retryCount > 0) {
          setChatLogs((prev) => [
            ...prev,
            {
              role: "bot" as const,
              text: `요청 한도를 초과했습니다. ${retryDelay / 1000}초 후 재시도 중입니다... (${retryCount}/${maxRetries})`,
            },
          ])
          await delay(retryDelay)
          retryDelay += 20000
        }

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "당신은 하루 영농일지를 작성해주는 한국어 AI입니다. " +
                  "하루 동안의 센서 변화, 제어장치 작동, CCTV 보안 상태, 작물 성장 등을 요약하고, " +
                  "필요한 조치나 권장 사항을 간결히 안내해 주세요. 영농일지 스타일로 답변을 구성하세요.",
              },
              { role: "user", content: chatInput },
            ],
            max_tokens: 150,
            temperature: 0.7,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer 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",
            },
          }
        )

        console.log("[Chatbot] API 응답 성공:", {
          total_tokens: response.data.usage?.total_tokens,
          response_length: response.data.choices[0].message.content.length,
          response: response.data.choices[0].message.content,
        })

        const botReply = response.data.choices[0].message.content
        const isTruncated = !/[.!?]$/.test(botReply.trim())
        if (isTruncated) {
          setChatLogs((prev) => [
            ...prev,
            { role: "bot" as const, text: botReply },
            {
              role: "bot" as const,
              text: "응답이 길어져 일부가 생략되었습니다. 더 자세한 정보를 원하시면 질문을 나눠서 물어보세요.",
            },
          ])
        } else {
          setChatLogs((prev) => [...prev, { role: "bot" as const, text: botReply }])
        }
        break
      } catch (error: any) {
        if (error.response && error.response.status === 429) {
          retryCount++
          console.warn(`[Chatbot] 요청 한도 초과, 재시도 중... (${retryCount}/${maxRetries})`)
          if (retryCount === maxRetries) {
            const elapsedTime = Date.now() - startTime
            const waitTime = 60000 - (elapsedTime % 60000)
            const waitSeconds = Math.ceil(waitTime / 1000)
            setChatLogs((prev) => [
              ...prev,
              {
                role: "bot" as const,
                text: `죄송합니다. 요청 한도를 초과했습니다. ${waitSeconds}초 후 다시 시도해주세요. Open AI 계정의 Tier를 확인하거나, 다른 앱에서 동일한 API 키를 사용 중인지 확인해주세요.`,
              },
            ])
          }
        } else {
          const errorMessage = error.response?.data?.error?.message || error.message
          console.error("[Chatbot] Open AI API 호출 오류:", errorMessage)
          setChatLogs((prev) => [
            ...prev,
            { role: "bot" as const, text: `죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 오류 메시지: ${errorMessage}` },
          ])
          break
        }
      }
    }

    setIsLoading(false)
  }

  // (B) 스마트 농부 도우미
  const [helperLogs, setHelperLogs] = useState<{ role: "user" | "bot"; text: string }[]>([])
  const [helperInput, setHelperInput] = useState("")
  const [isHelperLoading, setIsHelperLoading] = useState(false)
  const helperScrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    helperScrollRef.current?.scrollToEnd({ animated: true })
  }, [helperLogs])

  const handleSendHelper = async () => {
    if (!helperInput.trim()) return

    const userMsg = { role: "user" as const, text: helperInput }
    setHelperLogs((prev) => [...prev, userMsg])
    setHelperInput("")
    setIsHelperLoading(true)

    const maxRetries = 3
    let retryCount = 0
    let retryDelay = 20000
    const startTime = Date.now()

    while (retryCount < maxRetries) {
      try {
        if (retryCount > 0) {
          setHelperLogs((prev) => [
            ...prev,
            {
              role: "bot" as const,
              text: `요청 한도를 초과했습니다. ${retryDelay / 1000}초 후 재시도 중입니다... (${retryCount}/${maxRetries})`,
            },
          ])
          await delay(retryDelay)
          retryDelay += 20000
        }

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant for farming and plant care. Answer questions in Korean about growing plants and crops.",
              },
              { role: "user", content: helperInput },
            ],
            max_tokens: 150,
            temperature: 0.7,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer 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",
            },
          }
        )

        console.log("[SmartHelper] API 응답 성공:", {
          total_tokens: response.data.usage?.total_tokens,
          response_length: response.data.choices[0].message.content.length,
          response: response.data.choices[0].message.content,
        })

        const botReply = response.data.choices[0].message.content
        const isTruncated = !/[.!?]$/.test(botReply.trim())
        if (isTruncated) {
          setHelperLogs((prev) => [
            ...prev,
            { role: "bot" as const, text: botReply },
            {
              role: "bot" as const,
              text: "응답이 길어져 일부가 생략되었습니다. 더 자세한 정보를 원하시면 질문을 나눠서 물어보세요.",
            },
          ])
        } else {
          setHelperLogs((prev) => [
            ...prev,
            { role: "bot" as const, text: botReply },
          ])
        }
        break
      } catch (error: any) {
        if (error.response && error.response.status === 429) {
          retryCount++
          console.warn(`[SmartHelper] 요청 한도 초과, 재시도 중... (${retryCount}/${maxRetries})`)
          if (retryCount === maxRetries) {
            const elapsedTime = Date.now() - startTime
            const waitTime = 60000 - (elapsedTime % 60000)
            const waitSeconds = Math.ceil(waitTime / 1000)
            setHelperLogs((prev) => [
              ...prev,
              {
                role: "bot" as const,
                text: `죄송합니다. 요청 한도를 초과했습니다. ${waitSeconds}초 후 다시 시도해주세요. Open AI 계정의 Tier를 확인하거나, 다른 앱에서 동일한 API 키를 사용 중인지 확인해주세요.`,
              },
            ])
          }
        } else {
          const errorMessage = error.response?.data?.error?.message || error.message
          console.error("[SmartHelper] Open AI API 호출 오류:", errorMessage)
          setHelperLogs((prev) => [
            ...prev,
            { role: "bot" as const, text: `죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 오류 메시지: ${errorMessage}` },
          ])
          break
        }
      }
    }

    setIsHelperLoading(false)
  }

  return (
    <BottomTabBarLayout initialTab="main">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ecfdf5" />

        {/* 상단 헤더 */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.headerTitle}>{farmTitle}</Text>
            <Text style={{ fontSize: 16, color: "#fff", marginLeft: 8 }} />
          </View>

          <View style={styles.headerRight}>
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
          {/* 작물 성장도 */}
          <View style={[styles.section, { marginBottom: 24 }]}>
            <Text style={styles.sectionTitle}>작물 성장도</Text>
            <Text
              style={{
                fontSize: 16,
                color: "#065f46",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              내 작물이름: 토마토
            </Text>

            <View style={styles.growthContainer}>
              <View style={styles.plantImageContainer}>
                <Image
                  source={stageImages[growthStage]}
                  style={styles.plantImage}
                />
              </View>

              <View style={[styles.stageIndicators, { justifyContent: "space-evenly" }]}>
                <View style={[styles.stageDot, growthStage === 0 && styles.activeDot]} />
                <View style={[styles.stageDot, growthStage === 1 && styles.activeDot]} />
                <View style={[styles.stageDot, growthStage === 2 && styles.activeDot]} />
                <View style={[styles.stageDot, growthStage === 3 && styles.activeDot]} />
                <View style={[styles.stageDot, growthStage === 4 && styles.activeDot]} />
              </View>
              <View style={[styles.stageLabels, { justifyContent: "space-evenly" }]}>
                <Text style={[styles.stageLabel, growthStage === 0 && styles.activeLabel]}>씨앗</Text>
                <Text style={[styles.stageLabel, growthStage === 1 && styles.activeLabel]}>새싹</Text>
                <Text style={[styles.stageLabel, growthStage === 2 && styles.activeLabel]}>성장</Text>
                <Text style={[styles.stageLabel, growthStage === 3 && styles.activeLabel]}>열매</Text>
                <Text style={[styles.stageLabel, growthStage === 4 && styles.activeLabel]}>수확</Text>
              </View>

              <View style={styles.growthRateContainer}>
                <Text style={styles.growthRateText}>성장률: {growthRate}%</Text>
                <ProgressBar progress={growthRate} />
              </View>

              <View style={styles.dateContainer}>
                <View style={styles.startDate}>
                  <Ionicons name="calendar-outline" size={20} color="#059669" />
                  <Text style={styles.startDateText} numberOfLines={1} ellipsizeMode="tail">
                    시작일: {isStarted && startDate ? startDate.slice(0, 10) : ""}
                  </Text>
                </View>
                <View style={styles.dDay}>
                  <Ionicons name="time-outline" size={20} color="#059669" />
                  <Text style={[styles.dDayText, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                    D-DAY: {dDay ? `${dDay}일 남음` : "0일 남음"}
                  </Text>
                </View>
              </View>

              <CircularProgress progress={growthRate} />

              {!isStarted && (
                <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                  <Text style={styles.startButtonText}>시작하기</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.startButton} onPress={handleNextStage}>
                <Text style={styles.startButtonText}>다음 단계</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 내 경고알림 (합쳐진 섹션) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내 경고알림</Text>
            <View style={styles.alertContainer}>
              {/* 안전, 경고, 위험 동그라미 UI 유지 */}
              <View style={styles.alertGuide}>
                <View style={styles.guideItem}>
                  <View style={[styles.guideCircle, { backgroundColor: "#10b981" }]} />
                  <Text style={styles.guideText}>안전</Text>
                </View>
                <View style={styles.guideItem}>
                  <View style={[styles.guideCircle, { backgroundColor: "#facc15" }]} />
                  <Text style={styles.guideText}>경고</Text>
                </View>
                <View style={styles.guideItem}>
                  <View style={[styles.guideCircle, { backgroundColor: "#ef4444" }]} />
                  <Text style={styles.guideText}>위험</Text>
                </View>
              </View>

              {/* 알림 목록 추가 */}
              {alarmItems.length === 0 && (
                <Text style={[styles.alertText, { color: "#666" }]}>
                  알림이 없습니다.
                </Text>
              )}

              {visibleAlarms.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.alertItem,
                    item.type === "위험"
                      ? { backgroundColor: "#fee2e2" }
                      : item.type === "경고"
                      ? { backgroundColor: "#fef9c3" }
                      : { backgroundColor: "#d1fae5" },
                  ]}
                >
                  <Ionicons
                    name={
                      item.type === "위험"
                        ? "alert-circle-outline"
                        : item.type === "경고"
                        ? "warning-outline"
                        : "checkmark-circle-outline"
                    }
                    size={20}
                    color={
                      item.type === "위험"
                        ? "#ef4444"
                        : item.type === "경고"
                        ? "#facc15"
                        : "#10b981"
                    }
                    style={{ marginRight: 6 }}
                  />
                  <View>
                    <Text style={[styles.alertText, { fontWeight: "bold" }]}>
                      [{item.type}] {item.content} ({item.device})
                    </Text>
                    <Text style={[styles.alertText, { color: "#666" }]}>
                      {item.created_at}
                    </Text>
                  </View>
                </View>
              ))}

              {alarmItems.length > 3 && (
                <TouchableOpacity
                  style={{ marginTop: 8 }}
                  onPress={() => setShowMore(!showMore)}
                >
                  <Text style={{ color: "#059669", fontWeight: "bold" }}>
                    {showMore ? "접기" : "더보기"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* (A) AI 영농일지 */}
          <View style={[styles.section, styles.chatSection, styles.aiDiaryBlock]}>
            <Text style={styles.sectionTitle}>AI 영농일지</Text>

            <ScrollView
              ref={chatScrollRef}
              style={[styles.chatMessages, styles.aiDiaryChatMessages]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatMessagesContent}
            >
              {chatLogs.map((msg, idx) => {
                const date = new Date()
                const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
                return (
                  <View
                    key={idx}
                    style={[
                      styles.chatBubble,
                      msg.role === "user" ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text style={styles.chatText}>{msg.text}</Text>
                    <Text style={styles.chatTime}>{time}</Text>
                    <View
                      style={[
                        styles.bubbleTail,
                        msg.role === "user"
                          ? styles.userBubbleTail
                          : styles.botBubbleTail,
                      ]}
                    />
                  </View>
                )
              })}
              {isLoading && (
                <View style={styles.botBubble}>
                  <Text style={styles.chatText}>답변을 생성 중입니다...</Text>
                  <View style={styles.botBubbleTail} />
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.chatInput}
                  placeholder="오늘 농장 상황을 기록해보세요!"
                  placeholderTextColor="#9ca3af"
                  value={chatInput}
                  onChangeText={setChatInput}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleSendChat}
                disabled={isLoading}
              >
                <Feather name="send" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* (B) 스마트 농부 도우미 */}
          <View style={[styles.section, styles.chatSection, styles.smartHelperBlock]}>
            <Text style={styles.sectionTitle}>스마트 농부 도우미</Text>

            <ScrollView
              ref={helperScrollRef}
              style={styles.chatMessages}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatMessagesContent}
            >
              {helperLogs.map((msg, idx) => {
                const date = new Date()
                const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
                return (
                  <View
                    key={idx}
                    style={[
                      styles.chatBubble,
                      msg.role === "user" ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text style={styles.chatText}>{msg.text}</Text>
                    <Text style={styles.chatTime}>{time}</Text>
                    <View
                      style={[
                        styles.bubbleTail,
                        msg.role === "user"
                          ? styles.userBubbleTail
                          : styles.botBubbleTail,
                      ]}
                    />
                  </View>
                )
              })}
              {isHelperLoading && (
                <View style={styles.botBubble}>
                  <Text style={styles.chatText}>답변을 생성 중입니다...</Text>
                  <View style={styles.botBubbleTail} />
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.chatInput}
                  placeholder="농작물 관리 팁을 물어보세요! (예: 상추 키우는 방법)"
                  placeholderTextColor="#9ca3af"
                  value={helperInput}
                  onChangeText={setHelperInput}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButton, isHelperLoading && styles.sendButtonDisabled]}
                onPress={handleSendHelper}
                disabled={isHelperLoading}
              >
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

  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 12,
  },

  // 성장률 바
  progressContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },

  // 경고 알림
  alertContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  alertGuide: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  guideText: {
    fontSize: 14,
    color: "#1f2937",
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    borderRadius: 8,
    padding: 6,
  },
  alertText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // 식물 성장도
  growthContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },
  plantImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  plantImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  stageIndicators: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 10,
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  activeDot: {
    backgroundColor: "#059669",
  },
  stageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 16,
  },
  stageLabel: {
    fontSize: 16,
    color: "#6b7280",
  },
  activeLabel: {
    color: "#059669",
    fontWeight: "600",
  },
  growthRateContainer: {
    width: "90%",
    marginBottom: 16,
  },
  growthRateText: {
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 16,
  },
  startDate: {
    flexDirection: "row",
    alignItems: "center",
  },
  startDateText: {
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 6,
  },
  dDay: {
    flexDirection: "row",
    alignItems: "center",
  },
  dDayText: {
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 6,
  },
  circularProgressContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  circularProgressText: {
    position: "absolute",
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
  },
  startButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  startButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },

  // AI 영농일지 + 스마트 농부 도우미 (챗봇) 공통
  chatSection: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 80,
  },

  aiDiaryBlock: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: "#f0fff4",
    marginBottom: 24,
  },
  aiDiaryChatMessages: {
    minHeight: 220,
    backgroundColor: "#fff",
  },

  smartHelperBlock: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: "#e6fffa",
    marginBottom: 40,
  },

  chatMessages: {
    minHeight: 100,
    maxHeight: 350,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  chatMessagesContent: {
    paddingBottom: 8,
  },
  chatBubble: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
    position: "relative",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#10b981",
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
  chatTime: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  bubbleTail: {
    position: "absolute",
    width: 0,
    height: 0,
    borderWidth: 8,
    borderStyle: "solid",
    bottom: -8,
  },
  userBubbleTail: {
    right: 8,
    borderColor: "transparent transparent transparent #10b981",
  },
  botBubbleTail: {
    left: 8,
    borderColor: "transparent #d1fae5 transparent transparent",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
  },
  sendButton: {
    backgroundColor: "#059669",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
    elevation: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
})
import React, { useState, useRef, ReactNode, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// 화면 크기/높이
const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const DRAWER_WIDTH = 260;

// 탭 아이콘/텍스트 색상
function getTabColor(activeTab: string, tabName: string) {
  return activeTab === tabName ? '#78c87e' : '#666';
}

// 컴포넌트 Props
type LayoutProps = {
  children: ReactNode;  // 가운데(본문)에 렌더링할 화면
  initialTab?: string;  // 기본 탭
};

export default function BottomTabBarLayout({
  children,
  initialTab = 'main',
}: LayoutProps) {
  // 현재 탭 상태
  const [activeTab, setActiveTab] = useState(initialTab);

  // 사이드바 애니메이션 상태
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  // 테마 상태 및 모달
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  // 페이드인 애니메이션 (children 전환 시)
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // activeTab(또는 기능 전환)마다 fade-in 효과 실행 (1000ms)
  useEffect(() => {
    if (activeTab === 'stats' || activeTab ==='cctv') {
        fadeAnim.setValue(1);
    } else {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
   }
  }, [activeTab]);

  // 사이드바 열고 닫기
  const toggleDrawer = () => {
    const toValue = drawerOpen ? 0 : 1;
    setDrawerOpen(!drawerOpen);
    Animated.timing(drawerAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // 오른쪽→왼쪽 슬라이드 (translateX)
  const translateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DRAWER_WIDTH, 0],
  });
  // 어두워지는 배경 오버레이
  const overlayOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  // 사이드바 내부 버튼들 실제 기능 구현
  const handleLogout = () => {
    alert('로그아웃 되었습니다');
    router.push('/login');
    toggleDrawer();
  };

  // 테마변경: 드로어를 닫은 후 모달 열기
  const handleThemeToggle = () => {
    toggleDrawer();
    setTimeout(() => {
      setThemeModalOpen(true);
    }, 300);
  };

  const handleFarmChange = () => {
    router.push('/(tabs)/listfarm');
    toggleDrawer();
  };

  // 테마 모달에서 테마 선택 처리
  const handleThemeSelect = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    setThemeModalOpen(false);
  };

  // 테마에 따라 SafeAreaView 배경색 변경 (필요시 다른 스타일도 변경)
  const safeAreaStyle = [
    styles.safeArea,
    { backgroundColor: theme === 'light' ? '#f3f8f4' : '#333' },
  ];

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* 1) 가운데 children(본문) - 페이드인 효과 적용 */}
      <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
        {children}
      </Animated.View>

      {/* 2) 하단 탭 바 */}
      <View style={styles.tabBar}>
        {/* (1) 메인 */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('main');
            router.push('/(tabs)/mainUI');
          }}
        >
          <Ionicons
            name="home-outline"
            size={24}
            color={getTabColor(activeTab, 'main')}
          />
          <Text style={[styles.tabLabel, { color: getTabColor(activeTab, 'main') }]}>
            메인
          </Text>
        </TouchableOpacity>

        {/* (2) 통계 */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('stats');
            router.push('/(tabs)/stats');
          }}
        >
          <Ionicons
            name="stats-chart-outline"
            size={24}
            color={getTabColor(activeTab, 'stats')}
          />
          <Text style={[styles.tabLabel, { color: getTabColor(activeTab, 'stats') }]}>
            통계
          </Text>
        </TouchableOpacity>

        {/* (3) CCTV */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('cctv');
            router.push('/(tabs)/cctv');
          }}
        >
          <Ionicons
            name="videocam-outline"
            size={24}
            color={getTabColor(activeTab, 'cctv')}
          />
          <Text style={[styles.tabLabel, { color: getTabColor(activeTab, 'cctv') }]}>
            CCTV
          </Text>
        </TouchableOpacity>

        {/* (4) 제어 */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('control');
            router.push('/(tabs)/control');
          }}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={getTabColor(activeTab, 'control')}
          />
          <Text style={[styles.tabLabel, { color: getTabColor(activeTab, 'control') }]}>
            제어
          </Text>
        </TouchableOpacity>

        {/* (5) 메뉴 => 사이드바 열기 */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('menu');
            toggleDrawer();
          }}
        >
          <Ionicons
            name="menu-outline"
            size={24}
            color={getTabColor(activeTab, 'menu')}
          />
          <Text style={[styles.tabLabel, { color: getTabColor(activeTab, 'menu') }]}>
            메뉴
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3) 어두운 배경 오버레이 */}
      <Animated.View
        pointerEvents={drawerOpen ? 'auto' : 'none'}
        style={[
          styles.overlay,
          { opacity: overlayOpacity, zIndex: drawerOpen ? 99 : -1 },
        ]}
      />

      {/* 4) 사이드바 (오른쪽 → 왼쪽) */}
      <Animated.View
        style={[
          styles.drawerContainer,
          { transform: [{ translateX }], zIndex: 100 },
        ]}
      >
        {/* 사이드바 상단 (연한 초록색 헤더) */}
        <View style={styles.drawerHeader}>
          <Text style={styles.headerText}>영돌이농장님 안녕하세요!!</Text>
        </View>

        {/* 사이드바 버튼 목록 */}
        <View style={styles.drawerContent}>
          <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
            <Ionicons
              name="exit-outline"
              size={20}
              color="#333"
              style={{ marginRight: 8 }}
            />
            <Text>로그아웃</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={handleThemeToggle}>
            <Ionicons
              name="contrast-outline"
              size={20}
              color="#333"
              style={{ marginRight: 8 }}
            />
            <Text>테마변경</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={handleFarmChange}>
            <Ionicons
              name="leaf-outline"
              size={20}
              color="#333"
              style={{ marginRight: 8 }}
            />
            <Text>농장변경</Text>
          </TouchableOpacity>
        </View>

        {/* 닫기 버튼 (오른쪽 아래) */}
        <TouchableOpacity style={styles.closeButton} onPress={toggleDrawer}>
          <Ionicons name="close-circle-outline" size={24} color="#666" />
        </TouchableOpacity>
      </Animated.View>

      {/* 5) 테마 선택 모달 */}
      <Modal visible={themeModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>테마 선택</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleThemeSelect('light')}
            >
              <Text style={styles.modalOptionText}>라이트 모드</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleThemeSelect('dark')}
            >
              <Text style={styles.modalOptionText}>다크 모드</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, { marginTop: 20 }]}
              onPress={() => setThemeModalOpen(false)}
            >
              <Text style={[styles.modalOptionText, { color: 'red' }]}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  // 하단 탭 바
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    zIndex: 50,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  // 오버레이
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
  },
  // 사이드바
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    backgroundColor: '#78c87e',
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomColor: '#ccc',
    borderBottomWidth: 0.5,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

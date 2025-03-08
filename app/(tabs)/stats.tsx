import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import BottomTabBarLayout from './bottomtabbar';

const screenWidth = Dimensions.get('window').width;

// 예시 데이터 (일별, 주별, 월별)
const sensorData = {
  daily: {
    labels: ['0시', '4시', '8시', '12시', '16시', '20시', '24시'],
    temperature: [22, 23, 24, 28, 30, 27, 25],
    humidity: [40, 42, 45, 50, 55, 50, 45],
    soil: [30, 32, 33, 35, 36, 34, 32],
    co2: [400, 420, 430, 450, 460, 440, 420],
  },
  weekly: {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    temperature: [24, 25, 26, 27, 28, 26, 25],
    humidity: [45, 47, 50, 52, 55, 53, 50],
    soil: [35, 36, 37, 38, 39, 37, 36],
    co2: [420, 430, 440, 450, 460, 440, 430],
  },
  monthly: {
    labels: Array.from({ length: 10 }, (_, i) => `${(i + 1) * 3}일`),
    temperature: [23, 24, 25, 26, 27, 26, 25, 24, 23, 22],
    humidity: [42, 44, 46, 48, 50, 49, 48, 47, 45, 43],
    soil: [33, 34, 35, 36, 37, 36, 35, 34, 33, 32],
    co2: [410, 420, 430, 440, 450, 440, 430, 420, 410, 400],
  },
};

export default function StatsScreen() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const currentData = sensorData[timeRange];

  // 페이드인 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, timeRange]);

  // 차트 공통 설정
  const chartConfig = {
    backgroundGradientFrom: '#fb8c00',
    backgroundGradientTo: '#ffa726',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  return (
    <BottomTabBarLayout initialTab="stats">
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>센서 통계</Text>

          {/* 시간 범위 선택 버튼 그룹 */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.timeButton, timeRange === 'daily' && styles.activeButton]}
              onPress={() => setTimeRange('daily')}
            >
              <Text style={[styles.buttonText, timeRange === 'daily' && styles.activeButtonText]}>
                일별
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, timeRange === 'weekly' && styles.activeButton]}
              onPress={() => setTimeRange('weekly')}
            >
              <Text style={[styles.buttonText, timeRange === 'weekly' && styles.activeButtonText]}>
                주별
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, timeRange === 'monthly' && styles.activeButton]}
              onPress={() => setTimeRange('monthly')}
            >
              <Text style={[styles.buttonText, timeRange === 'monthly' && styles.activeButtonText]}>
                월별
              </Text>
            </TouchableOpacity>
          </View>

          {/* 온도 그래프 */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>온도 (°C)</Text>
            <LineChart
              data={{
                labels: currentData.labels,
                datasets: [{ data: currentData.temperature }],
              }}
              // 차트를 좀 더 작게
              width={screenWidth - 80} // 블록 대비 차트 폭을 줄임
              height={180}            // 높이도 줄임
              yAxisSuffix="°C"
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>

          {/* 습도 그래프 */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>습도 (%)</Text>
            <LineChart
              data={{
                labels: currentData.labels,
                datasets: [{ data: currentData.humidity }],
              }}
              width={screenWidth - 80}
              height={180}
              yAxisSuffix="%"
              chartConfig={{
                ...chartConfig,
                backgroundGradientFrom: '#08130D',
                backgroundGradientTo: '#1E2923',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#1E2923',
                },
              }}
              style={styles.chart}
            />
          </View>

          {/* 토양습도 그래프 */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>토양습도 (%)</Text>
            <LineChart
              data={{
                labels: currentData.labels,
                datasets: [{ data: currentData.soil }],
              }}
              width={screenWidth - 80}
              height={180}
              yAxisSuffix="%"
              chartConfig={{
                ...chartConfig,
                backgroundGradientFrom: '#1E2923',
                backgroundGradientTo: '#08130D',
                decimalPlaces: 0,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#ffa726',
                },
              }}
              style={styles.chart}
            />
          </View>

          {/* CO2 그래프 */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>CO2 (ppm)</Text>
            <LineChart
              data={{
                labels: currentData.labels,
                datasets: [{ data: currentData.co2 }],
              }}
              width={screenWidth - 80}
              height={180}
              yAxisSuffix="ppm"
              chartConfig={{
                ...chartConfig,
                decimalPlaces: 0,
              }}
              style={styles.chart}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </BottomTabBarLayout>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  activeButton: {
    backgroundColor: '#78c87e',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
  },
  activeButtonText: {
    color: '#fff',
  },
  chartContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    // 강한 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    // 블록 내부 여백
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',    // 자식(차트)이 가운데 정렬
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
    alignSelf: 'center', // 차트 자체도 가운데 정렬
  },
});

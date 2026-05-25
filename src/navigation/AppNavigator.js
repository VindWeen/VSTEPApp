import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';

// Home
import HomeScreen from '../screens/Home/HomeScreen';
import MockTestIntroScreen from '../screens/MockTest/MockTestIntroScreen';
import MockTestHubScreen from '../screens/MockTest/MockTestHubScreen';
import MockTestResultScreen from '../screens/MockTest/MockTestResultScreen';
import MockTestHistoryScreen from '../screens/MockTest/MockTestHistoryScreen';

// Listening
import ListeningListScreen from '../screens/Listening/ListeningListScreen';
import ListeningDetailScreen from '../screens/Listening/ListeningDetailScreen';
import ListeningResultScreen from '../screens/Listening/ListeningResultScreen';

// Reading
import ReadingListScreen from '../screens/Reading/ReadingListScreen';
import ReadingDetailScreen from '../screens/Reading/ReadingDetailScreen';
import ReadingResultScreen from '../screens/Reading/ReadingResultScreen';

// Writing
import WritingListScreen from '../screens/Writing/WritingListScreen';
import WritingScreen from '../screens/Writing/WritingScreen';
import WritingResultScreen from '../screens/Writing/WritingResultScreen';

// Speaking
import SpeakingListScreen from '../screens/Speaking/SpeakingListScreen';
import SpeakingPrepScreen from '../screens/Speaking/SpeakingPrepScreen';
import SpeakingScreen from '../screens/Speaking/SpeakingScreen';
import SpeakingResultScreen from '../screens/Speaking/SpeakingResultScreen';

// History (kept for reference, but moved out of bottom tabs)
import HistoryScreen from '../screens/History/HistoryScreen';

// Profile
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ProfileSettingsScreen from '../screens/Profile/ProfileSettingsScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const dynamicCardStyleInterpolator = ({ route }) => ({
  cardStyleInterpolator: (props) => {
    const isBack = route.params?.animationDirection === 'back';
    if (isBack) {
      const { current, layouts } = props;
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-layouts.screen.width, 0],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      };
    }
    return CardStyleInterpolators.forHorizontalIOS(props);
  },
});

// ── Home Stack ────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="MockTestIntro" component={MockTestIntroScreen} />
      <Stack.Screen name="MockTestHub" component={MockTestHubScreen} options={dynamicCardStyleInterpolator} />
      <Stack.Screen name="MockTestResult" component={MockTestResultScreen} />
      <Stack.Screen name="MockTestHistory" component={MockTestHistoryScreen} />
      <Stack.Screen name="FullMockListeningDetail" component={ListeningDetailScreen} />
      <Stack.Screen name="FullMockListeningResult" component={ListeningResultScreen} />
      <Stack.Screen name="FullMockReadingDetail" component={ReadingDetailScreen} />
      <Stack.Screen name="FullMockReadingResult" component={ReadingResultScreen} />
      <Stack.Screen name="FullMockWritingCompose" component={WritingScreen} />
      <Stack.Screen name="FullMockWritingResult" component={WritingResultScreen} />
      <Stack.Screen name="FullMockSpeakingPrep" component={SpeakingPrepScreen} options={dynamicCardStyleInterpolator} />
      <Stack.Screen name="FullMockSpeakingRecord" component={SpeakingScreen} options={dynamicCardStyleInterpolator} />
      <Stack.Screen name="FullMockSpeakingResult" component={SpeakingResultScreen} />
    </Stack.Navigator>
  );
}

// ── Listening Stack ───────────────────────────────────────
function ListeningStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
      <Stack.Screen name="ListeningList" component={ListeningListScreen} />
      <Stack.Screen name="ListeningDetail" component={ListeningDetailScreen} />
      <Stack.Screen name="ListeningResult" component={ListeningResultScreen} />
    </Stack.Navigator>
  );
}

// ── Reading Stack ─────────────────────────────────────────
function ReadingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
      <Stack.Screen name="ReadingList" component={ReadingListScreen} />
      <Stack.Screen name="ReadingDetail" component={ReadingDetailScreen} />
      <Stack.Screen name="ReadingResult" component={ReadingResultScreen} />
    </Stack.Navigator>
  );
}

// ── Writing Stack ─────────────────────────────────────────
function WritingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
      <Stack.Screen name="WritingList" component={WritingListScreen} />
      <Stack.Screen name="WritingCompose" component={WritingScreen} />
      <Stack.Screen name="WritingResult" component={WritingResultScreen} />
    </Stack.Navigator>
  );
}

// ── Speaking Stack ────────────────────────────────────────
function SpeakingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
      <Stack.Screen name="SpeakingList" component={SpeakingListScreen} options={dynamicCardStyleInterpolator} />
      <Stack.Screen name="SpeakingPrep" component={SpeakingPrepScreen} options={dynamicCardStyleInterpolator} />
      <Stack.Screen name="SpeakingRecord" component={SpeakingScreen} options={dynamicCardStyleInterpolator} />
      <Stack.Screen name="SpeakingResult" component={SpeakingResultScreen} />
      {/* Legacy route for backward compat */}
      <Stack.Screen name="Speaking" component={SpeakingListScreen} options={dynamicCardStyleInterpolator} />
    </Stack.Navigator>
  );
}

// ── Profile Stack ────────────────────────────────────────
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
}


function TabIcon({ iconName, label, focused, color }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 2 }}>
      <Ionicons name={focused ? iconName : `${iconName}-outline`} size={24} color={color} />
      <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '500', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

// ── Main Tabs ─────────────────────────────────────────────
function MainTabs() {
  const { theme, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 10,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconName="home"
              label="Home"
              focused={focused}
              color={focused ? (isDarkMode ? '#90CAF9' : '#1A73E8') : (isDarkMode ? '#757575' : '#aaa')}
            />
          ),
          tabBarActiveTintColor: isDarkMode ? '#90CAF9' : '#1A73E8',
        }}
      />
      <Tab.Screen
        name="Listening"
        component={ListeningStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconName="headset"
              label="Nghe"
              focused={focused}
              color={focused ? (isDarkMode ? '#64B5F6' : '#1565C0') : (isDarkMode ? '#757575' : '#aaa')}
            />
          ),
          tabBarActiveTintColor: isDarkMode ? '#64B5F6' : '#1565C0',
        }}
      />
      <Tab.Screen
        name="Reading"
        component={ReadingStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconName="book"
              label="Đọc"
              focused={focused}
              color={focused ? (isDarkMode ? '#81C784' : '#2E7D32') : (isDarkMode ? '#757575' : '#aaa')}
            />
          ),
          tabBarActiveTintColor: isDarkMode ? '#81C784' : '#2E7D32',
        }}
      />
      <Tab.Screen
        name="Writing"
        component={WritingStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconName="create"
              label="Viết"
              focused={focused}
              color={focused ? (isDarkMode ? '#FFB74D' : '#E65100') : (isDarkMode ? '#757575' : '#aaa')}
            />
          ),
          tabBarActiveTintColor: isDarkMode ? '#FFB74D' : '#E65100',
        }}
      />
      <Tab.Screen
        name="SpeakingTab"
        component={SpeakingStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconName="mic"
              label="Nói"
              focused={focused}
              color={focused ? (isDarkMode ? '#BA68C8' : '#6A1B9A') : (isDarkMode ? '#757575' : '#aaa')}
            />
          ),
          tabBarActiveTintColor: isDarkMode ? '#BA68C8' : '#6A1B9A',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Profile', { screen: 'ProfileMain' });
          },
        })}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconName="person"
              label="Hồ sơ"
              focused={focused}
              color={focused ? (isDarkMode ? '#CFD8DC' : '#37474F') : (isDarkMode ? '#757575' : '#aaa')}
            />
          ),
          tabBarActiveTintColor: isDarkMode ? '#CFD8DC' : '#37474F',
        }}
      />
    </Tab.Navigator>
  );
}

// ── Auth Stack ────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────
export default function AppNavigator() {
  const { token, loading } = useAuth();
  const { isDarkMode } = useTheme();
  const [isReady, setIsReady] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState('Auth');

  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        setInitialRoute('Onboarding');
      } catch (e) {
        setInitialRoute('Onboarding');
      } finally {
        setIsReady(true);
      }
    };
    checkOnboarding();
  }, []);

  if (loading || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const MyLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#1565C0',
      background: '#F5F7FA',
      card: '#ffffff',
      text: '#1A1A2E',
      border: '#F0F2F5',
    },
  };

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#2196F3',
      background: '#121212',
      card: '#1E1E1E',
      text: '#E0E0E0',
      border: '#2C2C2C',
    },
  };

  return (
    <NavigationContainer theme={isDarkMode ? MyDarkTheme : MyLightTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }} initialRouteName={!token ? initialRoute : 'Main'}>
        {!token ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

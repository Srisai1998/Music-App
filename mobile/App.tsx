import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import ArtistScreen from './src/screens/ArtistScreen';
import AlbumScreen from './src/screens/AlbumScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import MiniPlayer from './src/components/MiniPlayer';
import { setupPlayer } from './src/services/trackPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMe } from './src/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from './src/hooks/useRedux';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Home: focused ? 'home' : 'home-outline',
            Search: focused ? 'search' : 'search-outline',
            Library: focused ? 'library' : 'library-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1db954',
        tabBarInactiveTintColor: '#b3b3b3',
        tabBarStyle: { backgroundColor: '#121212', borderTopColor: '#282828' },
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const dispatch = useAppDispatch();
  const { currentSong } = useAppSelector((s) => s.player);

  useEffect(() => {
    setupPlayer();
    AsyncStorage.getItem('accessToken').then((token) => {
      if (token) dispatch(fetchMe());
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen name="Player" component={PlayerScreen} options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="Artist" component={ArtistScreen} options={{ headerShown: true }} />
          <Stack.Screen name="Album" component={AlbumScreen} options={{ headerShown: true }} />
          <Stack.Screen name="Playlist" component={PlaylistScreen} options={{ headerShown: true }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Log In' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, title: 'Sign Up' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: 'Reset Password' }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: true, title: 'Set New Password' }} />
        </Stack.Navigator>
        {currentSong && <MiniPlayer />}
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
});

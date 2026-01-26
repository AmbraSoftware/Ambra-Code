import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      router.replace('/(tabs)/home');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Falha no login. Verifique suas credenciais.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</Text>
        <Text className="text-gray-500 mb-8">Faça login para continuar.</Text>

        <View className="space-y-4 gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Senha</Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            className="w-full bg-primary py-4 rounded-xl items-center mt-4"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-6 items-center" onPress={() => router.back()}>
          <Text className="text-gray-500">Voltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

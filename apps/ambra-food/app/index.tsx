import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white justify-between p-6">
      <View className="flex-1 items-center justify-center">
        <View className="w-32 h-32 bg-primary rounded-full items-center justify-center mb-6">
            {/* Placeholder Logo */}
            <Text className="text-4xl font-bold text-white">AF</Text>
        </View>
        <Text className="text-3xl font-title font-bold text-gray-900 text-center mb-2">
          Ambra Food
        </Text>
        <Text className="text-base text-gray-500 text-center px-4">
          Alimentação escolar saudável, prática e segura para quem você ama.
        </Text>
      </View>

      <View className="w-full space-y-4 gap-4">
        <TouchableOpacity 
          className="w-full bg-primary py-4 rounded-xl items-center shadow-sm active:opacity-90"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-white font-bold text-lg">Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full bg-gray-100 py-4 rounded-xl items-center active:opacity-90"
          onPress={() => router.push('/(auth)/register')}
        >
          <Text className="text-gray-900 font-bold text-lg">Criar Conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</Text>
        <Text className="text-gray-500 mb-8">Junte-se ao Ambra Food hoje.</Text>

        <View className="space-y-4 gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Nome Completo</Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
              placeholder="Seu nome"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
              placeholder="seu@email.com"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Senha</Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
              placeholder="••••••••"
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            className="w-full bg-primary py-4 rounded-xl items-center mt-4"
          >
            <Text className="text-white font-bold text-lg">Cadastrar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-6 items-center" onPress={() => router.back()}>
          <Text className="text-gray-500">Já tenho conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

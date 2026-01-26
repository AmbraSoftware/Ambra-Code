import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-gray-200 rounded-full mb-3" />
        <Text className="text-xl font-bold">João Silva</Text>
        <Text className="text-gray-500">joao.pai@email.com</Text>
      </View>

      <View className="space-y-2 gap-2">
        <TouchableOpacity className="p-4 bg-gray-50 rounded-xl flex-row justify-between">
          <Text className="font-medium">Meus Alunos</Text>
          <Text className="text-gray-400">{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="p-4 bg-gray-50 rounded-xl flex-row justify-between">
          <Text className="font-medium">Carteira Digital</Text>
          <Text className="text-primary font-bold">R$ 45,00</Text>
        </TouchableOpacity>

        <TouchableOpacity className="p-4 bg-gray-50 rounded-xl flex-row justify-between">
          <Text className="font-medium">Configurações</Text>
          <Text className="text-gray-400">{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            className="p-4 bg-red-50 rounded-xl flex-row justify-between mt-4"
            onPress={() => router.replace('/')}
        >
          <Text className="font-medium text-red-600">Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-lg font-bold">Seu Carrinho está vazio</Text>
      <Text className="text-gray-500 mt-2">Adicione itens deliciosos para começar.</Text>
    </SafeAreaView>
  );
}

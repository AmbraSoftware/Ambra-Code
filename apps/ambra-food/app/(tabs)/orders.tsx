import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-lg font-bold">Histórico de Pedidos</Text>
      <Text className="text-gray-500 mt-2">Você ainda não fez nenhum pedido.</Text>
    </SafeAreaView>
  );
}

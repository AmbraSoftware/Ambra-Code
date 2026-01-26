import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center bg-white">
        <View>
          <Text className="text-gray-500 text-sm">Bom dia,</Text>
          <Text className="text-gray-900 text-xl font-bold">João Silva</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Bell size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-4">
        {/* Search Bar */}
        <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-100 mb-6">
          <Search size={20} color="#999" />
          <Text className="ml-2 text-gray-400">O que vamos comer hoje?</Text>
        </View>

        {/* Categories */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Categorias</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {['Lanches', 'Almoço', 'Bebidas', 'Saudável', 'Doces'].map((cat, i) => (
            <TouchableOpacity key={i} className="mr-3 bg-white px-4 py-2 rounded-full border border-gray-100">
              <Text className="text-gray-700 font-medium">{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Popular Items */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Destaques do Dia</Text>
        <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((item) => (
                <View key={item} className="w-[48%] bg-white rounded-xl mb-4 overflow-hidden shadow-sm">
                    <View className="h-32 bg-gray-200 items-center justify-center">
                        <Text className="text-gray-400">IMG</Text>
                    </View>
                    <View className="p-3">
                        <Text className="font-bold text-gray-900">Sanduíche Natural</Text>
                        <Text className="text-xs text-gray-500 mb-2">Frango, Alface, Tomate</Text>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-primary font-bold">R$ 12,00</Text>
                            <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                                <Text className="text-white text-xs">+</Text>
                            </View>
                        </View>
                    </View>
                </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

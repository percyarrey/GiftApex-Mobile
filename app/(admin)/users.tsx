import { FlatList, StyleSheet, Text, View } from "react-native";

const users = [
  { id: "1", name: "John Doe", email: "john@gmail.com" },
  { id: "2", name: "Jane Doe", email: "jane@gmail.com" },
];

export default function Users() {
  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.name}</Text>
            <Text>{item.email}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  card: {
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 10,
  },
});

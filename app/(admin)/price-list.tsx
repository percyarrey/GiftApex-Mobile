import { FlatList, StyleSheet, Text, View } from "react-native";

const data = [
  { id: "1", user: "John", type: "Sell Code", status: "Pending" },
  { id: "2", user: "Mary", type: "Deposit", status: "Approved" },
];

export default function PriceList() {
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.user}</Text>
            <Text>{item.type}</Text>
            <Text>{item.status}</Text>
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

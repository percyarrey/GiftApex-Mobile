import { FlatList, StyleSheet, Text, View } from "react-native";

const data = [
  { id: "1", user: "Alex", amount: "$50", status: "Pending" },
  { id: "2", user: "Sarah", amount: "$120", status: "Approved" },
];

export default function PayoutRequests() {
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.user}</Text>
            <Text>{item.amount}</Text>
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

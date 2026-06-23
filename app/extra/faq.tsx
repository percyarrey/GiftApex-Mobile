import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { List } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const faqs = [
  {
    question: "How do I sell codes?",
    answer:
      "Tap 'Sell Codes', enter one code per line (up to 20 codes), then press 'Submit Codes'.",
  },
  {
    question: "How much Bitcoin (BTC) will I receive?",
    answer:
      "Your balance increases based on your reward rate for valid codes. Withdrawals are converted to BTC using the current market rate.",
  },
  {
    question: "Can I submit multiple codes?",
    answer:
      "Yes. You can submit up to 20 codes in one batch, with one code per line.",
  },
  {
    question: "How long does processing take?",
    answer: "Most batches of 1–20 codes are processed in about 2 minutes.",
  },
  {
    question: "Where can I see my payouts?",
    answer:
      "Open the Payouts page to view pending and completed withdrawals along with their TXIDs.",
  },
  {
    question: "What is the Payout Password?",
    answer:
      "It is an additional security password required when changing your BTC wallet address during withdrawal.",
  },
];

export default function FaqScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          <Text className="mytxt">F</Text>requently Asked Questions
        </Text>
        <Text style={styles.subtitle}>
          Tap any question below to reveal its answer.
        </Text>

        {faqs.map((item, index) => (
          <List.Accordion
            key={index}
            title={item.question}
            titleStyle={styles.question}
            style={styles.accordion}
          >
            <List.Item
              title={item.answer}
              titleNumberOfLines={0}
              titleStyle={styles.answer}
            />
          </List.Accordion>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 20,
  },
  accordion: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
  },
});

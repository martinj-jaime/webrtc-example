import { useRouter } from "expo-router";
import React from "react";
import { Button, Text, View } from "react-native";

const HomeScreen = () => {
  const router = useRouter();

  return (
    <View>
      <Text>index</Text>
      <Button
        title="stream"
        onPress={() => {
          router.navigate("stream");
        }}
      />
    </View>
  );
};

export default HomeScreen;

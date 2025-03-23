import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  StatusBar,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";

const STORAGE_KEY = "@file_history";
const APP_FOLDER = FileSystem.documentDirectory + "ZapXfer/";
const SENT_FOLDER = APP_FOLDER + "Sent/";
const RECEIVED_FOLDER = APP_FOLDER + "Received/";

const mockDevices = ["Device A", "Device B", "Device C"];

const DashboardScreen = () => {
  const [fileHistory, setFileHistory] = useState<any[]>([]);
  const [showSent, setShowSent] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      await FileSystem.makeDirectoryAsync(SENT_FOLDER, { intermediates: true });
      await FileSystem.makeDirectoryAsync(RECEIVED_FOLDER, { intermediates: true });
      loadHistory();
    })();
  }, []);

  const loadHistory = async () => {
    const history = await AsyncStorage.getItem(STORAGE_KEY);
    if (history) setFileHistory(JSON.parse(history));
  };

  const saveHistory = async (newHistory: any[]) => {
    setFileHistory(newHistory);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const encryptFile = async (uri: string) => {
    const data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return CryptoJS.AES.encrypt(data, "SECRET_KEY").toString();
  };

  const sendFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
    if (result.canceled) return;
    setSelectedFile(result.assets[0]);
    setModalVisible(true);
  };

  const confirmSend = async (device: string) => {
    setModalVisible(false);
    if (!selectedFile) return;

    const { uri, name } = selectedFile;
    const encryptedData = await encryptFile(uri);
    const savedUri = SENT_FOLDER + name;
    await FileSystem.writeAsStringAsync(savedUri, encryptedData, { encoding: FileSystem.EncodingType.Base64 });
    const newHistory = [{ name, type: "Sent", date: new Date().toLocaleString(), uri: savedUri, device }, ...fileHistory];
    saveHistory(newHistory);
    Alert.alert("File Sent", `File encrypted and sent to ${device}.`);
  };

  const receiveFile = async (name: string, encryptedData: string) => {
    const savedUri = RECEIVED_FOLDER + name;
    await FileSystem.writeAsStringAsync(savedUri, encryptedData, { encoding: FileSystem.EncodingType.Base64 });
    const newHistory = [{ name, type: "Received", date: new Date().toLocaleString(), uri: savedUri }, ...fileHistory];
    saveHistory(newHistory);
    Alert.alert("File Received", "File stored successfully.");
  };

  const sendStoredFile = async (uri: string) => {
    Alert.alert("File Sharing", "Simulating file sending...");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.header}>ZapXfer - File Sharing</Text>
      <Button title="Send File" onPress={sendFile} />
      <Button title="Receive File" onPress={() => receiveFile("sample.txt", "encrypted_content_here")} />
      <Button title={showSent ? "Show Received" : "Show Sent"} onPress={() => setShowSent(!showSent)} />
      <FlatList
        data={fileHistory.filter((item) => (showSent ? item.type === "Sent" : item.type === "Received"))}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => sendStoredFile(item.uri)}>
            <Text style={styles.item}>{item.name} ({item.type}) - {item.date}</Text>
          </TouchableOpacity>
        )}
      />
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Receiver</Text>
            {mockDevices.map((device) => (
              <Button key={device} title={device} onPress={() => confirmSend(device)} />
            ))}
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight || 20, padding: 20, backgroundColor: "#f9f9f9" },
  header: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", padding: 20, backgroundColor: "white", borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
});

export default DashboardScreen;
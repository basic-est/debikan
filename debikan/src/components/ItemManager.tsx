import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { getItems, addItem, deleteItem, updateItem } from '../Database';

const ItemManager = () => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [defaultDay, setDefaultDay] = useState('');

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingAccount, setEditingAccount] = useState('');
  const [editingDefaultDay, setEditingDefaultDay] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    getItems()
      .then(setItems)
      .catch(console.error);
  };

  const handleAddItem = () => {
    if (name && account) {
      const day = parseInt(defaultDay, 10) || null;
      addItem(name, account, day)
        .then(() => {
          loadItems();
          setName('');
          setAccount('');
          setDefaultDay('');
        })
        .catch(console.error);
    }
  };

  const handleDeleteItem = (id) => {
    deleteItem(id)
      .then(loadItems)
      .catch(console.error);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditingName(item.name);
    setEditingAccount(item.account);
    setEditingDefaultDay(item.default_day ? item.default_day.toString() : '');
    setIsModalVisible(true);
  };

  const handleUpdateItem = () => {
    if (editingItem && editingName && editingAccount) {
      const day = parseInt(editingDefaultDay, 10) || null;
      updateItem(editingItem.id, editingName, editingAccount, day)
        .then(() => {
          loadItems();
          setIsModalVisible(false);
          setEditingItem(null);
        })
        .catch(console.error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemAccount}>{item.account}</Text>
        {item.default_day && <Text style={styles.itemDefaultDay}>毎月{item.default_day}日払い</Text>}
      </View>
      <View style={styles.itemActionsContainer}>
        <Button title="編集" onPress={() => handleEditItem(item)} />
        <Button title="削除" onPress={() => handleDeleteItem(item.id)} color="red" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>支払項目管理</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="項目名 (例: クレジットカードA)"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="引き落とし口座 (例: A銀行)"
          value={account}
          onChangeText={setAccount}
        />
        <TextInput
          style={styles.input}
          placeholder="デフォルト支払日 (例: 27)"
          keyboardType="numeric"
          value={defaultDay}
          onChangeText={setDefaultDay}
        />
        <Button title="追加" onPress={handleAddItem} />
      </View>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setIsModalVisible(!isModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>項目を編集</Text>
            <TextInput
              style={styles.input}
              placeholder="項目名"
              value={editingName}
              onChangeText={setEditingName}
            />
            <TextInput
              style={styles.input}
              placeholder="引き落とし口座"
              value={editingAccount}
              onChangeText={setEditingAccount}
            />
            <TextInput
              style={styles.input}
              placeholder="デフォルト支払日"
              keyboardType="numeric"
              value={editingDefaultDay}
              onChangeText={setEditingDefaultDay}
            />
            <View style={styles.modalButtons}>
              <Button title="保存" onPress={handleUpdateItem} />
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setIsModalVisible(!isModalVisible)}
              >
                <Text style={styles.textStyle}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemAccount: {
    fontSize: 14,
    color: '#666',
  },
  itemDefaultDay: {
      fontSize: 12,
      color: '#888',
      marginTop: 4,
  },
  itemActionsContainer: {
    flexDirection: 'row',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ItemManager;
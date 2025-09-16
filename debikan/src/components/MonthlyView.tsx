import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TextInput, Switch, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { getItems, getMonthlyAmountsByMonth, saveMonthlyAmount } from '../Database';
import { debounce } from 'lodash';

const MonthlyView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState([]);
  const [monthlyAmounts, setMonthlyAmounts] = useState({});
  const [displayData, setDisplayData] = useState([]);
  const [summary, setSummary] = useState({});

  // Date Picker State
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      Promise.all([getItems(), getMonthlyAmountsByMonth(month, year)])
        .then(([fetchedItems, fetchedAmounts]) => {
          setItems(fetchedItems);
          setMonthlyAmounts(fetchedAmounts);
        })
        .catch(console.error);
    }, [currentDate])
  );

  useEffect(() => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const combined = items.map(item => {
      const amountData = monthlyAmounts[item.id] || {};
      let itemDate;
      if (amountData.date) {
        itemDate = new Date(amountData.date);
      } else {
        const day = item.default_day || 1;
        itemDate = new Date(year, month - 1, day);
      }
      return {
        ...item,
        amount: amountData.amount ? amountData.amount.toString() : '',
        paid: amountData.paid || false,
        date: itemDate,
      };
    });
    setDisplayData(combined.sort((a, b) => a.date.getTime() - b.date.getTime()));

    // Calculate Summary
    const unpaidItems = combined.filter(item => !item.paid && item.amount);
    const summaryData = unpaidItems.reduce((acc, item) => {
      const account = item.account || 'Unknown';
      if (!acc[account]) {
        acc[account] = {};
      }

      const itemDateStr = item.date.toISOString().split('T')[0];

      if (!acc[account][itemDateStr]) {
        acc[account][itemDateStr] = {
          total: 0,
          names: [],
          date: item.date,
        };
      }

      acc[account][itemDateStr].total += parseInt(item.amount, 10);
      acc[account][itemDateStr].names.push(item.name);

      return acc;
    }, {});
    setSummary(summaryData);

  }, [items, monthlyAmounts, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const handleSave = (item, amount, paid, date) => {
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      saveMonthlyAmount(item.id, dateString, parseInt(amount, 10) || 0, paid)
        .then(() => {
            setMonthlyAmounts(prevAmounts => {
                const newAmounts = { ...prevAmounts };
                if (!newAmounts[item.id]) {
                    newAmounts[item.id] = {};
                }
                newAmounts[item.id].amount = parseInt(amount, 10) || 0;
                newAmounts[item.id].paid = paid;
                newAmounts[item.id].date = dateString;
                return newAmounts;
            });
        })
        .catch(console.error);
  };

  const debouncedSave = useCallback(debounce(handleSave, 1000), []);

  const openDatePicker = (item) => {
    setEditingItem(item);
    setDatePickerVisible(true);
  };

  const renderItem = ({ item }) => {
    const handleAmountChange = (amount) => {
      const newData = displayData.map(d => d.id === item.id ? { ...d, amount } : d);
      setDisplayData(newData);
      debouncedSave(item, amount, item.paid, item.date);
    };

    const handlePaidChange = (paid) => {
      const newData = displayData.map(d => d.id === item.id ? { ...d, paid } : d);
      setDisplayData(newData);
      handleSave(item, item.amount, paid, item.date);
    };

    return (
      <View style={[styles.itemContainer, item.paid && styles.itemPaid]}>
        <View style={styles.itemDetails}>
            <Text style={[styles.itemName, item.paid && styles.itemNamePaid]}>{item.name}</Text>
            <TouchableOpacity onPress={() => openDatePicker(item)}>
                <Text style={styles.dateText}>{item.date.toLocaleDateString('ja-JP')}</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.itemControls}>
          <TextInput
            style={styles.amountInput}
            placeholder="金額"
            keyboardType="numeric"
            value={item.amount}
            onChangeText={handleAmountChange}
          />
          <Switch
            value={item.paid}
            onValueChange={handlePaidChange}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthSelector}>
        <Button title="< 前月" onPress={handlePrevMonth} />
        <Text style={styles.monthText}>
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </Text>
        <Button title="次月 >" onPress={handleNextMonth} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>口座別 未払い合計</Text>
        {Object.keys(summary).length > 0 ? (
          Object.entries(summary).map(([account, dateGroups]) => {
            const paymentsByDate = Object.values(dateGroups).sort((a, b) => a.date.getTime() - b.date.getTime());
            const totalForAccount = paymentsByDate.reduce((sum, p) => sum + p.total, 0);

            if (paymentsByDate.length === 0) {
                return null;
            }

            const lastPaymentDate = paymentsByDate[paymentsByDate.length - 1].date;

            return (
              <View style={styles.summaryAccountContainer} key={account}>
                <Text style={styles.summaryAccount}>{account}</Text>
                {paymentsByDate.map((payment, index) => (
                  <View style={styles.summaryItem} key={index}>
                    <Text style={styles.summaryItemText}>
                      {`${payment.date.getDate()}日: ¥${payment.total.toLocaleString()} (${payment.names.join(', ')})`}
                    </Text>
                  </View>
                ))}
                <Text style={styles.summaryTotal}>
                  {`→ ${lastPaymentDate.getDate()}日までに合計 ¥${totalForAccount.toLocaleString()} が必要`}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.summaryEmpty}>未払いの項目はありません。</Text>
        )}
      </View>

      <FlatList
        data={displayData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<View style={styles.listHeader}><Text style={styles.listHeaderText}>支払項目</Text><Text style={styles.listHeaderText}>金額と支払状況</Text></View>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>支払い項目を登録してください。</Text>
          </View>
        }
      />

      {editingItem && (
        <DatePicker
            modal
            open={isDatePickerVisible}
            date={editingItem.date}
            mode="date"
            onConfirm={(date) => {
                setDatePickerVisible(false);
                const newData = displayData.map(d => d.id === editingItem.id ? { ...d, date } : d);
                setDisplayData(newData);
                handleSave(editingItem, editingItem.amount, editingItem.paid, date);
            }}
            onCancel={() => {
                setDatePickerVisible(false);
            }}
            title="引き落とし日を選択"
            confirmText="決定"
            cancelText="キャンセル"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    summaryContainer: {
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    summaryAccountContainer: {
        marginBottom: 15,
    },
    summaryAccount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingVertical: 2,
    },
    summaryItemText: {
        fontSize: 14,
        color: '#555',
    },
    summaryTotal: {
        marginTop: 5,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#d9534f',
        textAlign: 'right',
    },
    summaryEmpty: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        paddingVertical: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#777',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    listHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
    },
    itemPaid: {
        backgroundColor: '#f0f0f0',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
    },
    itemNamePaid: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    dateText: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 4,
    },
    itemControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        width: 80, // Adjusted width
        marginRight: 10,
        textAlign: 'right',
    },
});

export default MonthlyView;

import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';

interface Column {
  key: string;
  title: string;
  width?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AdminTableProps {
  columns: Column[];
  data: any[];
  onRowPress?: (row: any) => void;
  emptyMessage?: string;
}

export const AdminTable: React.FC<AdminTableProps> = ({
  columns,
  data,
  onRowPress,
  emptyMessage = 'No data available',
}) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.headerRow}>
          {columns.map(column => (
            <View
              key={column.key}
              style={[styles.headerCell, {width: column.width || 120}]}>
              <Text style={styles.headerText}>{column.title}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.map((row, index) => {
          const RowContent = (
            <View
              key={index}
              style={[
                styles.row,
                index % 2 === 0 && styles.evenRow,
              ]}>
              {columns.map(column => (
                <View
                  key={column.key}
                  style={[styles.cell, {width: column.width || 120}]}>
                  {column.render ? (
                    column.render(row[column.key], row)
                  ) : (
                    <Text style={styles.cellText} numberOfLines={2}>
                      {row[column.key]?.toString() || '-'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          );

          if (onRowPress) {
            return (
              <TouchableOpacity key={index} onPress={() => onRowPress(row)}>
                {RowContent}
              </TouchableOpacity>
            );
          }

          return RowContent;
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerCell: {
    padding: 12,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  evenRow: {
    backgroundColor: '#F9FAFB',
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#1F2937',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GradientHeader = ({ title }) => {
    return (
        <LinearGradient colors={['#00796b', '#4db6ac']} style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    headerTitle: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default GradientHeader;
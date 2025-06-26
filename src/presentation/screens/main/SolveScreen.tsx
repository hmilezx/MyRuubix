import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';

import { CubeMove } from '../../../core/domain/models/CubeTypes';
import { ICubeSolverService } from '../../../core/domain/services/ICubeSolverService';
import { ICubeDetectionService } from '../../../core/domain/services/ICubeDetectionService';

const { width } = Dimensions.get('window');

interface SolveMethod {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

type SolveScreenRouteProp = RouteProp<{
  params: { cubeState?: string; algorithm?: string };
}, 'params'>;

export default function SolveScreen() {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<SolveScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  // State
  const [cubeState, setCubeState] = useState(route.params?.cubeState || '');
  const [solution, setSolution] = useState<CubeMove[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [solveMethod, setSolveMethod] = useState<string>('kociemba');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Solve methods
  const solveMethods: SolveMethod[] = [
    {
      id: 'kociemba',
      name: 'Kociemba Algorithm',
      description: 'Optimal 20-move solution',
      icon: 'flash',
      color: theme.colors.primary,
      difficulty: 'Beginner',
    },
    {
      id: 'layer-by-layer',
      name: 'Layer by Layer',
      description: 'Easy to learn method',
      icon: 'layers',
      color: theme.colors.secondary,
      difficulty: 'Beginner',
    },
    {
      id: 'cfop',
      name: 'CFOP Method',
      description: 'Cross, F2L, OLL, PLL',
      icon: 'grid',
      color: theme.colors.tertiary,
      difficulty: 'Advanced',
    },
  ];

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Validate cube state
   */
  const validateCubeState = (state: string): boolean => {
    // Basic validation: 54 characters (9 faces × 6 sides)
    if (state.length !== 54) {
      Alert.alert('Invalid Cube State', 'Cube state must be exactly 54 characters.');
      return false;
    }
    
    // Check valid characters (U, R, F, D, L, B)
    const validChars = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (let i = 0; i < state.length; i++) {
      if (!validChars.includes(state[i].toUpperCase())) {
        Alert.alert('Invalid Cube State', 'Cube state contains invalid characters. Use only U, R, F, D, L, B.');
        return false;
      }
    }
    
    return true;
  };

  /**
   * Solve the cube
   */
  const handleSolveCube = async () => {
    if (!cubeState.trim()) {
      Alert.alert('Missing Cube State', 'Please enter a cube state or scan your cube first.');
      return;
    }
    
    if (!validateCubeState(cubeState)) {
      return;
    }
    
    try {
      setIsLoading(true);
      setSolution([]);
      
      // Mock cube solver implementation
      // In real app, inject ICubeSolverService
      const mockSolution: CubeMove[] = ['R', 'U', 'R\'', 'U\'', 'R\'', 'F', 'R', 'F\''];
      
      // Simulate solving delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSolution(mockSolution);
      
      Alert.alert(
        'Cube Solved! 🎉',
        `Found solution in ${mockSolution.length} moves using ${solveMethods.find(m => m.id === solveMethod)?.name}.`,
        [
          {
            text: 'View Solution',
            onPress: () => navigation.navigate('Solution' as never, {
              solution: mockSolution,
              cubeState: cubeState
            }),
          },
          { text: 'OK' }
        ]
      );
      
    } catch (error) {
      console.error('Solve error:', error);
      Alert.alert('Solve Failed', 'Unable to solve the cube. Please check your cube state and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open camera for cube detection
   */
  const handleScanCube = () => {
    navigation.navigate('CameraCapture' as never);
  };

  /**
   * Generate random scramble
   */
  const handleGenerateScramble = () => {
    const moves: CubeMove[] = ['R', 'L', 'U', 'D', 'F', 'B', 'R\'', 'L\'', 'U\'', 'D\'', 'F\'', 'B\''];
    const scramble = Array.from({ length: 20 }, () => moves[Math.floor(Math.random() * moves.length)]);
    
    Alert.alert(
      'Scramble Generated',
      `Apply these moves: ${scramble.join(' ')}`,
      [
        { text: 'Copy', onPress: () => {} },
        { text: 'OK' }
      ]
    );
  };

  /**
   * Render cube visualization placeholder
   */
  const renderCubeVisualization = () => (
    <Card elevation="medium" style={styles.cubeContainer}>
      <View style={styles.cubeVisualization}>
        <View style={[styles.cubeIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name="cube" size={64} color={theme.colors.primary} />
        </View>
        <Text style={[styles.cubeTitle, { color: theme.colors.textPrimary }]}>
          3D Cube Visualization
        </Text>
        <Text style={[styles.cubeSubtitle, { color: theme.colors.textSecondary }]}>
          {cubeState ? 'Cube state loaded' : 'Enter cube state to visualize'}
        </Text>
        
        {cubeState && (
          <View style={styles.cubeStatePreview}>
            <Text style={[styles.cubeStateText, { color: theme.colors.textSecondary }]}>
              State: {cubeState.substring(0, 12)}...
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  /**
   * Render solve method selector
   */
  const renderSolveMethodSelector = () => (
    <View style={styles.methodContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Solve Method
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.methodsGrid}>
          {solveMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                {
                  borderColor: solveMethod === method.id ? method.color : theme.colors.border,
                  backgroundColor: solveMethod === method.id ? method.color + '10' : 'transparent',
                }
              ]}
              onPress={() => setSolveMethod(method.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                <Ionicons name={method.icon} size={24} color={method.color} />
              </View>
              <Text style={[styles.methodName, { color: theme.colors.textPrimary }]}>
                {method.name}
              </Text>
              <Text style={[styles.methodDescription, { color: theme.colors.textSecondary }]}>
                {method.description}
              </Text>
              <View style={[styles.methodDifficulty, { backgroundColor: method.color + '20' }]}>
                <Text style={[styles.methodDifficultyText, { color: method.color }]}>
                  {method.difficulty}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  /**
   * Render cube input section
   */
  const renderCubeInput = () => (
    <View style={styles.inputContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Cube State
      </Text>
      
      <TextField
        label="Cube State (54 characters)"
        value={cubeState}
        onChangeText={setCubeState}
        placeholder="UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
        multiline
        style={styles.cubeInput}
        helper="Enter the state using U, R, F, D, L, B notation"
      />
      
      <View style={styles.inputActions}>
        <Button
          title="Scan Cube"
          variant="outline"
          onPress={handleScanCube}
          icon={<Ionicons name="camera" size={20} color={theme.colors.primary} />}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title="Random Scramble"
          variant="outline"
          onPress={handleGenerateScramble}
          icon={<Ionicons name="shuffle" size={20} color={theme.colors.secondary} />}
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>
    </View>
  );

  /**
   * Render solution display
   */
  const renderSolution = () => {
    if (solution.length === 0) return null;

    return (
      <Card elevation="medium" style={styles.solutionContainer}>
        <View style={styles.solutionHeader}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.tertiary} />
          <Text style={[styles.solutionTitle, { color: theme.colors.textPrimary }]}>
            Solution Found!
          </Text>
        </View>
        
        <Text style={[styles.solutionStats, { color: theme.colors.textSecondary }]}>
          {solution.length} moves • {solveMethods.find(m => m.id === solveMethod)?.name}
        </Text>
        
        <View style={styles.solutionMoves}>
          {solution.map((move, index) => (
            <View key={index} style={[styles.moveChip, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.moveText, { color: theme.colors.primary }]}>
                {move}
              </Text>
            </View>
          ))}
        </View>
        
        <Button
          title="View Step-by-Step"
          onPress={() => navigation.navigate('Solution' as never, {
            solution,
            cubeState
          })}
          style={{ marginTop: 16 }}
        />
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Solve Cube
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Tutorial' as never)}>
          <Ionicons name="help-circle-outline" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          {renderCubeVisualization()}
          {renderCubeInput()}
          {renderSolveMethodSelector()}
          {renderSolution()}
          
          {/* Solve Button */}
          <View style={styles.solveButtonContainer}>
            <Button
              title={isLoading ? "Solving..." : "Solve Cube"}
              onPress={handleSolveCube}
              loading={isLoading}
              disabled={!cubeState.trim() || isLoading}
              size="large"
              icon={<Ionicons name="play" size={20} color={theme.colors.surface} />}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cubeContainer: {
    padding: 24,
    marginBottom: 24,
  },
  cubeVisualization: {
    alignItems: 'center',
  },
  cubeIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cubeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cubeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  cubeStatePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cubeStateText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  inputContainer: {
    marginBottom: 24,
  },
  cubeInput: {
    minHeight: 80,
  },
  inputActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  methodContainer: {
    marginBottom: 24,
  },
  methodsGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 4,
  },
  methodCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 140,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  methodName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  methodDifficulty: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  methodDifficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  solutionContainer: {
    padding: 20,
    marginBottom: 24,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  solutionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  solutionStats: {
    fontSize: 14,
    marginBottom: 16,
  },
  solutionMoves: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  moveChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moveText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  solveButtonContainer: {
    marginBottom: 32,
  },
});
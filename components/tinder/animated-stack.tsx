import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const ROTATION = 18;
const SWIPE_VELOCITY = 450;
const ADVANCE_DEBOUNCE_MS = 120;
const SWIPE_ANIMATION = { duration: 240, easing: Easing.out(Easing.cubic) };
const FADE_IN_MS = 300;

export type AnimatedStackProps<T> = {
  data: T[];
  renderItem: (props: { item: T }) => React.ReactNode;
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
};

export function AnimatedStack<T>({ data, renderItem, onSwipeLeft, onSwipeRight }: AnimatedStackProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const advanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const hiddenTranslateX = useMemo(() => screenWidth * 1.25, [screenWidth]);
  const swipeThreshold = useMemo(() => screenWidth * 0.2, [screenWidth]);

  const total = data.length;
  const currentProfile = total > 0 ? data[currentIndex % total] : undefined;

  const rotate = useDerivedValue(
    () => `${interpolate(translateX.value, [-hiddenTranslateX, 0, hiddenTranslateX], [-ROTATION, 0, ROTATION])}deg`,
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: rotate.value },
    ],
    opacity: cardOpacity.value,
  }));

  const likeOpacity = useDerivedValue(() =>
    withTiming(translateX.value > 0 ? Math.min(translateX.value / (hiddenTranslateX / 3), 1) : 0, {
      duration: 140,
      easing: Easing.out(Easing.quad),
    }),
  );

  const nopeOpacity = useDerivedValue(() =>
    withTiming(translateX.value < 0 ? Math.min(-translateX.value / (hiddenTranslateX / 3), 1) : 0, {
      duration: 140,
      easing: Easing.out(Easing.quad),
    }),
  );

  const likeStyle = useAnimatedStyle(() => ({
    opacity: likeOpacity.value,
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: nopeOpacity.value,
  }));

  const queueAdvance = useCallback(() => {
    if (advanceTimeout.current) {
      clearTimeout(advanceTimeout.current);
    }
    advanceTimeout.current = setTimeout(() => {
      setCurrentIndex(index => {
        if (total === 0) return 0;
        const next = index + 1;
        return next >= total ? 0 : next;
      });
    }, ADVANCE_DEBOUNCE_MS);
  }, [total]);

  const panGesture = useMemo(() => {
    if (total === 0) {
      return Gesture.Pan();
    }

    return Gesture.Pan()
      .onUpdate(event => {
        translateX.value = event.translationX;
      })
      .onEnd(event => {
        const { translationX, velocityX } = event;
        const hasVelocity = Math.abs(velocityX) > SWIPE_VELOCITY;
        const hasDistance = Math.abs(translationX) > swipeThreshold;

        if (!hasVelocity && !hasDistance) {
          translateX.value = withTiming(0, SWIPE_ANIMATION);
          return;
        }

        const direction = Math.sign(translationX || velocityX) || 1;
        const destination = hiddenTranslateX * direction;
        const swipedProfile = currentProfile;

        translateX.value = withTiming(destination, SWIPE_ANIMATION, finished => {
          if (finished) {
            translateX.value = 0;
            cardOpacity.value = 0;
            runOnJS(queueAdvance)();
          }
        });

        if (!swipedProfile) {
          return;
        }

        const callback = direction > 0 ? onSwipeRight : onSwipeLeft;
        if (callback) {
          runOnJS(callback)(swipedProfile);
        }
      });
  }, [currentProfile, hiddenTranslateX, onSwipeLeft, onSwipeRight, queueAdvance, swipeThreshold, total, translateX]);

  useEffect(() => {
    translateX.value = 0;
    cardOpacity.value = 0;
    cardOpacity.value = withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.quad) });
  }, [cardOpacity, currentIndex, translateX]);

  useEffect(() => {
    setCurrentIndex(0);
    translateX.value = 0;
    cardOpacity.value = 0;
    cardOpacity.value = withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.quad) });
  }, [cardOpacity, total, translateX]);

  useEffect(
    () => () => {
      if (advanceTimeout.current) {
        clearTimeout(advanceTimeout.current);
      }
    },
    [],
  );

  return (
    <View style={styles.root}>
      {currentProfile && (
        <GestureDetector gesture={panGesture}>
          <Animated.View key={`current-${currentIndex}`} style={[styles.animatedCard, cardStyle]}>
            <Animated.Image
              source={require('@/assets/images/LIKE.png')}
              style={[styles.overlay, styles.like, likeStyle]}
              resizeMode="contain"
            />
            <Animated.Image
              source={require('@/assets/images/nope.png')}
              style={[styles.overlay, styles.nope, nopeStyle]}
              resizeMode="contain"
            />
            {renderItem({ item: currentProfile })}
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  animatedCard: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    width: 150,
    height: 150,
    position: 'absolute',
    top: 10,
    zIndex: 1,
    elevation: 1,
  },
  like: {
    left: 10,
  },
  nope: {
    right: 10,
  },
});

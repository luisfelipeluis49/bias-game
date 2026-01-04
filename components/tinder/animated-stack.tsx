import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const ROTATION = 18;
const SWIPE_VELOCITY = 800;

export type AnimatedStackProps<T> = {
  data: T[];
  renderItem: (props: { item: T }) => React.ReactNode;
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
};

export function AnimatedStack<T>({ data, renderItem, onSwipeLeft, onSwipeRight }: AnimatedStackProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width: screenWidth } = useWindowDimensions();

  const translateX = useSharedValue(0);
  const hiddenTranslateX = useMemo(() => screenWidth * 1.25, [screenWidth]);
  const swipeThreshold = useMemo(() => screenWidth * 0.25, [screenWidth]);

  const total = data.length;
  const currentProfile = total > 0 ? data[currentIndex % total] : undefined;
  const nextProfile = total > 1 ? data[(currentIndex + 1) % total] : undefined;

  const rotate = useDerivedValue(
    () => `${interpolate(translateX.value, [-hiddenTranslateX, 0, hiddenTranslateX], [-ROTATION, 0, ROTATION])}deg`,
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: rotate.value },
    ],
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(translateX.value, [-hiddenTranslateX, 0, hiddenTranslateX], [1, 0.9, 1]),
      },
    ],
    opacity: interpolate(translateX.value, [-hiddenTranslateX, 0, hiddenTranslateX], [1, 0.6, 1]),
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, hiddenTranslateX / 4], [0, 1]),
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -hiddenTranslateX / 4], [0, 1]),
  }));

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
          translateX.value = withSpring(0);
          return;
        }

        const direction = Math.sign(translationX || velocityX) || 1;
        const destination = hiddenTranslateX * direction;
        const swipedProfile = currentProfile;

        translateX.value = withSpring(destination, { velocity: velocityX }, finished => {
          if (finished) {
            translateX.value = 0;
            runOnJS(setCurrentIndex)(index => {
              if (total === 0) return 0;
              const next = index + 1;
              return next >= total ? 0 : next;
            });
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
  }, [currentProfile, hiddenTranslateX, onSwipeLeft, onSwipeRight, swipeThreshold, total, translateX]);

  useEffect(() => {
    translateX.value = 0;
  }, [currentIndex, translateX]);

  useEffect(() => {
    setCurrentIndex(0);
    translateX.value = 0;
  }, [total, translateX]);

  return (
    <View style={styles.root}>
      {nextProfile && (
        <View style={styles.nextCardContainer} pointerEvents="none">
          <Animated.View key={`next-${currentIndex + 1}`} style={[styles.animatedCard, nextCardStyle]}>
            {renderItem({ item: nextProfile })}
          </Animated.View>
        </View>
      )}

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
  nextCardContainer: {
    ...StyleSheet.absoluteFillObject,
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

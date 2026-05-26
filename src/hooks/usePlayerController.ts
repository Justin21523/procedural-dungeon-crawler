import { useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { usePlayerStore } from '../stores/playerStore';

const keyState = { w: false, a: false, s: false, d: false };

/**
 * Handles player movement (WASD), pointer lock, and mouse look.
 * Returns refs for yaw/pitch and an onClick handler to lock the pointer.
 */
export function usePlayerController(
  rigidBodyRef: React.RefObject<RapierRigidBody>,
  yawRef: React.MutableRefObject<number>,
  pitchRef: React.MutableRefObject<number>
){
  const moveSpeed = 6;
  const mouseSensitivity = 0.002;
  const isPointerLocked = usePlayerStore((s) => s.isPointerLocked);
  const setPointerLocked = usePlayerStore((s) => s.setPointerLocked);

  // Request pointer lock on click
  const onCanvasClick = useCallback(() => {
    document.body.requestPointerLock();
  }, []);

  // Track pointer lock state changes
  useEffect(() => {
    const onChange = () => {
      setPointerLocked(document.pointerLockElement === document.body);
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, [setPointerLocked]);

  // Mouse move rotates yaw/pitch when locked
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return;
      yawRef.current -= e.movementX * mouseSensitivity;
      pitchRef.current -= e.movementY * mouseSensitivity;
      pitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current));
    };
    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, [isPointerLocked, mouseSensitivity, yawRef, pitchRef]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keyState) {
        keyState[key as keyof typeof keyState] = true;
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keyState) {
        keyState[key as keyof typeof keyState] = false;
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Movement update in the physics loop
  useFrame((_, delta) => {
    const body = rigidBodyRef.current;
    if (!body) return;

    const forward = {
      x: Math.sin(yawRef.current),
      z: Math.cos(yawRef.current),
    };
    const right = {
      x: Math.cos(yawRef.current),
      z: -Math.sin(yawRef.current),
    };

    let moveX = 0;
    let moveZ = 0;
    if (keyState.w) { moveX += forward.x; moveZ += forward.z; }
    if (keyState.s) { moveX -= forward.x; moveZ -= forward.z; }
    if (keyState.a) { moveX -= right.x; moveZ -= right.z; }
    if (keyState.d) { moveX += right.x; moveZ += right.z; }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ) || 0;
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    const moveDelta = delta * moveSpeed;
    const currentPos = body.translation();
    const newPos = {
      x: currentPos.x + moveX * moveDelta,
      y: currentPos.y,
      z: currentPos.z + moveZ * moveDelta,
    };

    body.setNextKinematicTranslation(newPos);

    // Sync position to store for UI (throttled by R3F frame)
    usePlayerStore.getState().setPlayerPosition([newPos.x, newPos.y, newPos.z]);
  });

  return { onCanvasClick, yawRef, pitchRef };
}
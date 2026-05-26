import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Vector3 } from 'three';

export function useThirdPersonCamera(targetRef: React.MutableRefObject<Vector3 | undefined>, yawRef: React.MutableRefObject<number>, pitchRef: React.MutableRefObject<number>) {
  const { camera } = useThree();
  const cameraOffset = new Vector3(0, 3, -5); // behind and above

  useFrame(() => {
    if (!targetRef.current) return;
    const targetPos = targetRef.current;
    const yaw = yawRef.current;
    const pitch = pitchRef.current;

    // Calculate camera position
    const offset = cameraOffset.clone();
    offset.applyEuler(new Euler(pitch, yaw, 0, 'YXZ'));
    const desiredPos = targetPos.clone().add(offset);
    camera.position.lerp(desiredPos, 0.1);
    camera.lookAt(targetPos.x, targetPos.y + 1, targetPos.z);
  });
}
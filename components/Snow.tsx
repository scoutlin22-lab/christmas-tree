
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 2000;
  const range = 40;

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * range;
      p[i * 3 + 1] = Math.random() * range;
      p[i * 3 + 2] = (Math.random() - 0.5) * range;
    }
    return p;
  }, []);

  const velocities = useMemo(() => {
    const v = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      v[i] = 0.02 + Math.random() * 0.05;
    }
    return v;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      let x = positionsAttr.getX(i);
      let y = positionsAttr.getY(i);
      let z = positionsAttr.getZ(i);

      y -= velocities[i];
      // Wind effect
      x += Math.sin(time + i) * 0.01;
      z += Math.cos(time + i) * 0.01;

      if (y < -10) {
        y = range;
        x = (Math.random() - 0.5) * range;
        z = (Math.random() - 0.5) * range;
      }

      positionsAttr.setXYZ(i, x, y, z);
    }
    positionsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Snow;

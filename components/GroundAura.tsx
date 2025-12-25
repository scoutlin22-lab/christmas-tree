
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GroundAura: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.2;
      meshRef.current.scale.setScalar(1 + Math.sin(t) * 0.05);
    }
    if (ringRef.current) {
        ringRef.current.rotation.z = -t * 0.1;
    }
  });

  return (
    <group position={[0, -4.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Soft floor glow */}
      <mesh ref={meshRef}>
        <circleGeometry args={[6, 64]} />
        <meshBasicMaterial 
          color="#ffaa00" 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending} 
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Decorative Energy Ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[5.2, 5.5, 64]} />
        <meshBasicMaterial 
          color="#ffcc00" 
          transparent 
          opacity={0.4} 
          blending={THREE.AdditiveBlending} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Outer Glow Circle */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[8, 32]} />
        <meshBasicMaterial 
          color="#111" 
          transparent 
          opacity={0.5} 
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default GroundAura;

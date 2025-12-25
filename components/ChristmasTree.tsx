
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ChristmasTreeProps {
  gesture: string;
  handPos: { x: number; y: number };
  mousePos: { x: number; y: number };
  isCameraActive: boolean;
  pulseTrigger: number;
}

const ChristmasTree: React.FC<ChristmasTreeProps> = ({ gesture, handPos, mousePos, isCameraActive, pulseTrigger }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const trunkRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const starRef = useRef<THREE.Mesh>(null!);

  const [pulseValue, setPulseValue] = useState(0);

  const particleCount = 14000;
  const treeHeight = 10;
  const maxRadius = 4;

  const expansionRef = useRef(0);

  useEffect(() => {
    if (pulseTrigger > 0) {
      setPulseValue(1.2); // 击中瞬间脉冲稍强
    }
  }, [pulseTrigger]);

  const { initialPositions, colors, sizes, randoms } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    const szs = new Float32Array(particleCount);
    const rnds = new Float32Array(particleCount);

    const gold = new THREE.Color('#ffcc33');
    const green = new THREE.Color('#0a4d1c');
    const emerald = new THREE.Color('#16a34a');

    for (let i = 0; i < particleCount; i++) {
      const y = Math.random() * treeHeight;
      const progress = 1 - y / treeHeight;
      const radiusAtY = progress * maxRadius;
      
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radiusAtY;

      pos[i * 3] = Math.cos(angle) * distance;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * distance;

      const colorMix = Math.random();
      const finalColor = new THREE.Color();
      if (colorMix < 0.6) {
        finalColor.lerpColors(green, emerald, Math.random());
      } else {
        finalColor.copy(gold).multiplyScalar(1.2 + Math.random() * 0.5);
      }
      
      cols[i * 3] = finalColor.r;
      cols[i * 3 + 1] = finalColor.g;
      cols[i * 3 + 2] = finalColor.b;

      szs[i] = Math.random() * 0.15 + 0.05;
      rnds[i] = Math.random();
    }

    return { initialPositions: pos, colors: cols, sizes: szs, randoms: rnds };
  }, []);

  const heartGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0, y = 0;
    shape.moveTo( x + 5, y + 5 );
    shape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
    shape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
    shape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
    shape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
    shape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
    shape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );

    const extrudeSettings = {
      depth: 2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 1,
      bevelThickness: 1,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.scale(0.04, 0.04, 0.04);
    geo.rotateX(Math.PI);
    return geo;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    const targetExpansion = gesture === 'Open_Palm' ? 1 : 0;
    expansionRef.current = THREE.MathUtils.lerp(expansionRef.current, targetExpansion, 0.08);

    if (pulseValue > 0) {
      setPulseValue(prev => Math.max(0, prev - delta * 0.6));
    }

    if (pointsRef.current) {
      const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const sizesAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        const originalX = initialPositions[ix];
        const originalY = initialPositions[iy];
        const originalZ = initialPositions[iz];

        const dirX = originalX;
        const dirY = (originalY - treeHeight / 2) * 0.3;
        const dirZ = originalZ;

        positionsAttr.setX(i, originalX + dirX * expansionRef.current * 5);
        positionsAttr.setY(i, originalY + dirY * expansionRef.current * 4);
        positionsAttr.setZ(i, originalZ + dirZ * expansionRef.current * 5);

        const pulse = Math.sin(time * 3 + randoms[i] * 20) * 0.5 + 0.5;
        const expansionSize = expansionRef.current * 2.0;
        const arrivalBoost = pulseValue * 3.0;
        
        sizesAttr.setX(i, sizes[i] * (1 + (randoms[i] > 0.75 ? pulse * 2.5 : 0) + expansionSize + arrivalBoost));
      }
      positionsAttr.needsUpdate = true;
      sizesAttr.needsUpdate = true;
    }

    let targetX = 0;
    let targetY = 0;

    if (isCameraActive && gesture !== 'None') {
      targetX = handPos.x * Math.PI * 0.2;
      targetY = handPos.y * Math.PI * 0.1;
    } else {
      targetX = mousePos.x * Math.PI * 0.05;
      targetY = mousePos.y * Math.PI * 0.02;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.05);
    }

    if (starRef.current) {
      const s = 1 + expansionRef.current * 0.5 + Math.sin(time * 2) * 0.05 + pulseValue * 1.2;
      starRef.current.scale.set(s, s, s);
      starRef.current.rotation.y = time * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -5, 0]}>
      <mesh ref={trunkRef} position={[0, 1, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 2.5, 32]} />
        <meshStandardMaterial 
          color="#1a110a" 
          roughness={0.8} 
          metalness={0.0} 
          emissive="#050301"
        />
      </mesh>

      <points ref={pointsRef} position={[0, 2, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={new Float32Array(initialPositions)}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation={true}
        />
      </points>

      {/* Heart topper: 温润的琥珀金，击中时爆发柔和光芒 */}
      <mesh ref={starRef} position={[0, 12, 0]} geometry={heartGeometry}>
        <meshStandardMaterial 
          color="#92400e" 
          emissive="#78350f" 
          emissiveIntensity={1 + expansionRef.current * 6 + pulseValue * 30} 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
};

export default ChristmasTree;

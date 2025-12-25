
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WishParticleProps {
  id: number;
  onArrival: () => void;
}

const WishParticle: React.FC<WishParticleProps> = ({ id, onArrival }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const [arrived, setArrived] = useState(false);
  const [progress, setProgress] = useState(0);
  const explosionRef = useRef(0);

  const particleCount = 800;
  // 目标：树冠顶端
  const targetPos = new THREE.Vector3(0, 7.2, 0); 
  
  // 起点：固定在左侧，让轨迹更有叙事性
  const startPos = useMemo(() => new THREE.Vector3(-25, -8, 15), []);

  // 弧线控制点：向左侧偏移并抬高，形成优美的抛物线
  const midPos = useMemo(() => new THREE.Vector3(-15, 25, 5), []);

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(startPos, midPos, targetPos);
  }, [startPos, midPos, targetPos]);

  // 生成“星星”形状的初始粒子分布
  const { initialData, colors, sizes, randomSpeeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    const szs = new Float32Array(particleCount);
    const rnds = new Float32Array(particleCount);

    const gold = new THREE.Color('#FFD700');
    const amber = new THREE.Color('#F59E0B');
    const white = new THREE.Color('#FFFFFF');

    for (let i = 0; i < particleCount; i++) {
      // 构造五角星几何 (2D xy平面，z为深度)
      const angle = Math.random() * Math.PI * 2;
      // 简单的星星极坐标公式：r = a * (1 + b * sin(5θ))
      const isCore = Math.random() > 0.3;
      const r_base = isCore ? 0.3 : 0.8;
      const r = r_base * (0.8 + 0.2 * Math.sin(5 * angle));
      
      const px = Math.cos(angle) * r * Math.random();
      const py = Math.sin(angle) * r * Math.random();
      const pz = (Math.random() - 0.5) * 0.2;

      pos[i * 3] = px;
      pos[i * 3 + 1] = py;
      pos[i * 3 + 2] = pz;

      const mix = Math.random();
      const finalColor = mix > 0.5 ? gold : (mix > 0.2 ? amber : white);
      cols[i * 3] = finalColor.r;
      cols[i * 3 + 1] = finalColor.g;
      cols[i * 3 + 2] = finalColor.b;

      szs[i] = Math.random() * 0.25 + 0.08;
      rnds[i] = Math.random();
    }
    return { initialData: pos, colors: cols, sizes: szs, randomSpeeds: rnds };
  }, []);

  const explosionVectors = useMemo(() => {
    const vecs = [];
    for (let i = 0; i < particleCount; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize().multiplyScalar(Math.random() * 6 + 2);
      vecs.push(v);
    }
    return vecs;
  }, []);

  useFrame((state, delta) => {
    if (!arrived) {
      // 加快飞行进度 (从 0.12 增加到 0.40)
      const newProgress = Math.min(1, progress + delta * 0.40);
      setProgress(newProgress);
      
      const easeInOutQuint = (x: number) => x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
      const t = easeInOutQuint(newProgress);
      const currentPos = curve.getPoint(t);

      if (pointsRef.current) {
        pointsRef.current.position.copy(currentPos);
        // 星星持续自转，增加灵动感
        pointsRef.current.rotation.z += delta * 6;
        pointsRef.current.rotation.x += delta * 2;
        
        const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const tangent = curve.getTangent(t);
        
        // 为星星添加微小的尾迹抖动
        for (let i = 0; i < particleCount; i++) {
          const jitter = Math.sin(state.clock.elapsedTime * 15 + i) * 0.02;
          // 在飞行中，星星后部粒子略微滞后
          const trailOff = (1 - t) * randomSpeeds[i] * 0.1;
          posAttr.setXYZ(
            i,
            initialData[i*3] - tangent.x * trailOff + jitter,
            initialData[i*3+1] - tangent.y * trailOff + jitter,
            initialData[i*3+2] - tangent.z * trailOff
          );
        }
        posAttr.needsUpdate = true;
      }

      if (newProgress >= 1) {
        setArrived(true);
        onArrival();
      }
    } else {
      // “雪花弥散”效果 - 击中后星星解体
      explosionRef.current += delta;
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const sizeAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;
      const colorAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < particleCount; i++) {
        const v = explosionVectors[i];
        // 变慢物理衰减以维持页面停留时间
        const slowDown = Math.max(0, 1 - explosionRef.current * 0.25);
        const driftX = Math.sin(state.clock.elapsedTime * 2.5 + i) * 0.025;
        const driftY = -delta * 0.4; // 模拟较轻的重力

        posAttr.setX(i, posAttr.getX(i) + v.x * delta * slowDown + driftX);
        posAttr.setY(i, posAttr.getY(i) + v.y * delta * slowDown + driftY);
        posAttr.setZ(i, posAttr.getZ(i) + v.z * delta * slowDown);

        // 逐渐变为纯白雪花
        colorAttr.setXYZ(i, 
          THREE.MathUtils.lerp(colorAttr.getX(i), 1, delta * 1.5),
          THREE.MathUtils.lerp(colorAttr.getY(i), 1, delta * 1.5),
          THREE.MathUtils.lerp(colorAttr.getZ(i), 1, delta * 1.5)
        );

        sizeAttr.setX(i, Math.max(0, sizeAttr.getX(i) * 0.99));
      }
      posAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      if (explosionRef.current > 10.0) {
        pointsRef.current.visible = false;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={new Float32Array(initialData)}
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
        size={0.6}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        opacity={arrived ? Math.max(0, 1 - (explosionRef.current - 7.0) * 0.35) : 1}
      />
    </points>
  );
};

export default WishParticle;

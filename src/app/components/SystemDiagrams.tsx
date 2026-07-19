import { motion } from 'motion/react';

const drawProps = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 1.4, ease: [0.2, 0.7, 0.3, 1], delay: 0.1 }
};

export function SystemDiagrams({ name }: { name: string }) {
  const getDiagram = () => {
    switch (name) {
      case 'REVA4 Runtime':
      case 'RLAE (REVA4)':
      case 'rlae-research':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full opacity-70">
            {/* Stacked Model Architecture (Draws in) */}
            <motion.rect 
              x="140" y="60" width="120" height="120" rx="4" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4"
              {...drawProps}
            />
            <text x="200" y="125" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">BASE MODEL</text>

            {/* Reversible LoRA Layers */}
            {[0, 1, 3].map((i) => (
              <motion.g
                key={i}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.3 + 0.5, duration: 0.8 }}
              >
                <rect x="150" y={70 + i * 25} width="100" height="20" rx="1" fill="rgba(45, 91, 255, 0.1)" stroke="var(--accent-color)" strokeWidth="0.5" />
                <text x="200" y={83 + i * 25} textAnchor="middle" fill="var(--accent-color)" fontSize="6" fontFamily="var(--font-mono)">ADAPTATION LAYER {i + 1}</text>
              </motion.g>
            ))}

            {/* Rollback Action */}
            <motion.path
              animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, times: [0, 0.8, 1] }}
              d="M270,160 Q300,160 300,120 Q300,80 270,80"
              fill="none"
              stroke="#D4183D"
              strokeWidth="1"
            />
            <text x="310" y="123" fill="#D4183D" fontSize="6" fontFamily="var(--font-mono)">ROLLBACK</text>
          </svg>
        );
      case 'emrac':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full opacity-75">
            {/* Source code repo (Left) */}
            <motion.rect x="30" y="90" width="70" height="60" rx="3" fill="none" stroke="var(--text-muted)" strokeWidth="0.8" {...drawProps} />
            <text x="65" y="125" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">SRC REPO</text>
            
            {/* Dependency resolver box (Middle-top) */}
            <motion.rect x="160" y="45" width="80" height="40" rx="2" fill="none" stroke="var(--accent-color)" strokeWidth="0.6" {...drawProps} />
            <text x="200" y="68" textAnchor="middle" fill="var(--accent-color)" fontSize="7" fontFamily="var(--font-mono)">DEP RESOLVER</text>
            
            {/* Compiler / Builder engine (Middle-bottom) */}
            <motion.rect x="160" y="145" width="80" height="40" rx="2" fill="none" stroke="var(--text-secondary)" strokeWidth="0.6" {...drawProps} />
            <text x="200" y="168" textAnchor="middle" fill="var(--text-secondary)" fontSize="7" fontFamily="var(--font-mono)">BUILD ENGINE</text>

            {/* Installed Target filesystem (Right) */}
            <motion.rect x="300" y="90" width="70" height="60" rx="3" fill="none" stroke="var(--accent-color)" strokeWidth="0.8" {...drawProps} />
            <text x="335" y="125" textAnchor="middle" fill="var(--accent-color)" fontSize="9" fontFamily="var(--font-mono)">ARCH SYS</text>

            {/* Telemetry flow arrows / paths */}
            <motion.path d="M100,110 L140,110 Q150,110 150,90 L150,75 L160,75" fill="none" stroke="var(--text-muted)" strokeWidth="0.5" strokeDasharray="3 3" {...drawProps} />
            <motion.path d="M100,130 L140,130 Q150,130 150,150 L150,165 L160,165" fill="none" stroke="var(--text-muted)" strokeWidth="0.5" strokeDasharray="3 3" {...drawProps} />
            <motion.line x1="200" y1="85" x2="200" y2="145" stroke="var(--accent-color)" strokeWidth="0.5" strokeDasharray="2 2" {...drawProps} />
            <motion.path d="M240,165 L270,165 Q280,165 280,145 L280,120 L300,120" fill="none" stroke="var(--text-secondary)" strokeWidth="0.5" {...drawProps} />
            
            {/* Animated dependency compilation dots flowing from source to resolver/builder */}
            <motion.circle
              animate={{ cx: [65, 150, 150, 200], cy: [110, 110, 75, 75], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              r="2.5" fill="var(--accent-color)"
            />
            <motion.circle
              animate={{ cx: [65, 150, 150, 200], cy: [130, 130, 165, 165], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 1.25, ease: "linear" }}
              r="2.5" fill="var(--text-secondary)"
            />
            
            {/* Animated compiled package building and shipping to target filesystem */}
            <motion.circle
              animate={{ cx: [200, 280, 280, 335], cy: [165, 165, 120, 120], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5, ease: "linear" }}
              r="3.5" fill="var(--accent-color)"
            />

            {/* Spinning loader inside build engine to represent compilation activity */}
            <motion.circle
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ originX: '225px', originY: '155px' }}
              cx="225" cy="155" r="5" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4 2"
            />
            
            <text x="200" y="215" textAnchor="middle" fill="var(--accent-color)" fontSize="8" fontFamily="var(--font-mono)" letterSpacing="0.15em">SRC-FIRST PIPELINE</text>
          </svg>
        );
      case 'LBSM':
      case 'lbsm-research':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full opacity-70">
            {/* Statistical manifold grid */}
            <defs>
              <pattern id="lbsm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color)" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="400" height="240" fill="url(#lbsm-grid)" />

            {/* Behavioral attractor basins */}
            {[
              { cx: 110, cy: 145, rx: 55, ry: 35, label: 'STABLE', delay: 0 },
              { cx: 200, cy: 92, rx: 52, ry: 30, label: 'ADAPTIVE', delay: 0.5 },
              { cx: 292, cy: 145, rx: 60, ry: 36, label: 'EXPLORATORY', delay: 1 }
            ].map((basin) => (
              <g key={basin.label}>
                <motion.ellipse
                  cx={basin.cx}
                  cy={basin.cy}
                  rx={basin.rx}
                  ry={basin.ry}
                  fill="rgba(45, 91, 255, 0.08)"
                  stroke="var(--accent-color)"
                  strokeWidth="0.4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: basin.delay * 0.5 }}
                />
                <text
                  x={basin.cx}
                  y={basin.cy}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="6"
                  fontFamily="var(--font-mono)"
                >
                  {basin.label}
                </text>
              </g>
            ))}

            {/* Transitional manifold bridge */}
            <motion.path
              animate={{
                d: [
                  'M105,145 C145,95 175,75 205,94 C235,115 255,135 295,145',
                  'M105,145 C148,105 178,70 205,94 C232,118 258,128 295,145'
                ],
                pathLength: 1,
                opacity: 1
              }}
              initial={{ pathLength: 0, opacity: 0 }}
              transition={{ 
                d: { duration: 4, repeat: Infinity, repeatType: 'reverse' },
                pathLength: { duration: 1.4, ease: 'easeOut' },
                opacity: { duration: 1.4 }
              }}
              d="M105,145 C145,95 175,75 205,94 C235,115 255,135 295,145"
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />

            {/* Latent telemetry nodes */}
            {[
              { x: 90, y: 140 },
              { x: 145, y: 112 },
              { x: 205, y: 94 },
              { x: 250, y: 120 },
              { x: 310, y: 148 }
            ].map((node, i) => (
              <g key={i}>
                <motion.circle cx={node.x} cy={node.y} r="2.5" fill="var(--accent-color)" {...drawProps} />
                <motion.circle
                  animate={{ r: [2.5, 10], opacity: [0.5, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.25 }}
                  cx={node.x}
                  cy={node.y}
                  fill="var(--accent-color)"
                />
              </g>
            ))}

            {/* Temporal trajectory */}
            <motion.path
              animate={{ strokeDashoffset: [0, -180] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              d="M75,160 C110,120 150,115 178,102 S240,88 285,120 S325,160 340,128"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="0.7"
              strokeDasharray="5 7"
            />
            <motion.circle
              animate={{
                cx: [75, 110, 150, 178, 225, 285, 340],
                cy: [160, 120, 115, 102, 92, 120, 128],
                opacity: [0.4, 1, 1, 1, 1, 1, 0.4]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              r="4"
              fill="#D4183D"
            />

            {/* Unstable drift zone */}
            <motion.circle
              animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.22, 0.08] }}
              transition={{ duration: 3, repeat: Infinity }}
              cx="324" cy="74" r="26" fill="#D4183D"
            />
            <text x="324" y="77" textAnchor="middle" fill="#D4183D" fontSize="5" fontFamily="var(--font-mono)">DRIFT</text>
            <text x="200" y="220" textAnchor="middle" fill="var(--accent-color)" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.18em">LATENT BEHAVIORAL MANIFOLDS</text>
          </svg>
        );
      case 'KB':
      case 'Kernel Borderlands':
      case 'kernel-borderlands':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full opacity-75">
            {/* User space / Kernel space boundary */}
            <motion.line
              x1="20" y1="130" x2="380" y2="130"
              stroke="var(--accent-color)" strokeWidth="1" strokeDasharray="6 3"
              {...drawProps}
            />
            <text x="370" y="122" textAnchor="end" fill="var(--accent-color)" fontSize="6" fontFamily="var(--font-mono)" letterSpacing="0.15em">RING 0 BOUNDARY</text>

            <text x="30" y="45" fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono)">USER SPACE</text>
            <text x="30" y="225" fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono)">KERNEL SPACE</text>

            {/* User-space processes */}
            {[
              { x: 70, y: 65, label: 'proc.1', anomalous: false },
              { x: 150, y: 55, label: 'proc.2', anomalous: false },
              { x: 230, y: 70, label: 'proc.3', anomalous: true },
              { x: 310, y: 58, label: 'proc.4', anomalous: false }
            ].map((p, i) => (
              <g key={i}>
                <motion.circle
                  animate={p.anomalous
                    ? { stroke: ['var(--text-secondary)', '#D4183D', '#D4183D'], r: [8, 9, 8] }
                    : { opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  cx={p.x} cy={p.y} r="8"
                  fill="var(--bg-surface)"
                  strokeWidth="1"
                />
                <text x={p.x} y={p.y + 2} textAnchor="middle" fill="var(--text-muted)" fontSize="4" fontFamily="var(--font-mono)">{p.label}</text>

                {/* Anomalous drift pulse */}
                {p.anomalous && (
                  <motion.circle
                    animate={{ r: [8, 22], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    cx={p.x} cy={p.y} fill="none" stroke="#D4183D" strokeWidth="0.6"
                  />
                )}
              </g>
            ))}

            {/* eBPF hooks piercing the boundary, telemetry rising */}
            {[70, 150, 230, 310].map((x, i) => (
              <g key={i}>
                <motion.line x1={x} y1="90" x2={x} y2="130" stroke="var(--text-muted)" strokeWidth="0.5" {...drawProps} />
                <motion.circle
                  animate={{ cy: [130, 90], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
                  cx={x} r="2" fill="var(--accent-color)"
                />
              </g>
            ))}
            <text x="200" y="145" textAnchor="middle" fill="var(--text-secondary)" fontSize="5" fontFamily="var(--font-mono)">eBPF INSTRUMENTATION</text>

            {/* Kernel-space behavioral context engine */}
            <motion.rect x="140" y="155" width="120" height="35" rx="2" fill="none" stroke="var(--text-muted)" strokeWidth="0.8" strokeDasharray="3 3" {...drawProps} />
            <text x="200" y="176" textAnchor="middle" fill="var(--text-muted)" fontSize="6" fontFamily="var(--font-mono)">BEHAVIORAL CONTEXT</text>

            {/* Multi-agent orchestration swarm reacting */}
            {[0, 1, 2].map((i) => {
              const cx = 130 + i * 70;
              return (
                <g key={i}>
                  <motion.circle cx={cx} cy="212" r="9" fill="var(--bg-surface)" stroke="var(--accent-color)" strokeWidth="0.6" {...drawProps} />
                  <motion.circle
                    animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
                    cx={cx} cy="212" r="2.5" fill="var(--accent-color)"
                  />
                  <text x={cx} y="214" textAnchor="middle" fill="var(--text-muted)" fontSize="3.5" fontFamily="var(--font-mono)">AGENT</text>
                  {/* Link from context engine to agents */}
                  <motion.line
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                    x1="200" y1="190" x2={cx} y2="203"
                    stroke="var(--accent-color)" strokeWidth="0.4"
                  />
                </g>
              );
            })}

            {/* Containment action drawn around anomalous process */}
            <motion.rect
              animate={{ opacity: [0, 0.9, 0.9, 0], scale: [0.8, 1, 1, 1.1] }}
              transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
              x="212" y="52" width="36" height="36" rx="18"
              fill="none" stroke="#D4183D" strokeWidth="1" strokeDasharray="2 2"
            />

            <text x="200" y="20" textAnchor="middle" fill="var(--accent-color)" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.18em">RUNTIME CONTAINMENT ACTIVE</text>
          </svg>
        );
      case 'Project Ouroboros':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full opacity-70">
            {/* ESP32 Module */}
            <motion.rect x="160" y="80" width="80" height="80" rx="2" fill="#1A1A1A" stroke="var(--text-muted)" strokeWidth="1" {...drawProps} />
            <motion.rect x="175" y="95" width="50" height="50" rx="1" fill="none" stroke="var(--accent-color)" strokeWidth="0.5" {...drawProps} />
            <text x="200" y="125" textAnchor="middle" fill="var(--accent-color)" fontSize="10" fontFamily="var(--font-mono)">ESP32</text>

            {/* Pins */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.rect key={i} x="155" y={85 + i * 12} width="5" height="4" fill="var(--text-muted)" {...drawProps} />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.rect key={i} x="240" y={85 + i * 12} width="5" height="4" fill="var(--text-muted)" {...drawProps} />
            ))}

            {/* Wireless Defense Waves */}
            {[1, 2, 3].map((i) => (
              <motion.path
                key={i}
                animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                d={`M240,120 Q280,${120 - i * 20} 320,120 Q280,${120 + i * 20} 240,120`}
                fill="none"
                stroke="var(--accent-color)"
                strokeWidth="0.5"
              />
            ))}

            {/* Monitoring visualization */}
            <motion.path
              animate={{ strokeDashoffset: [100, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              d="M80,80 L160,120 M80,160 L160,120"
              stroke="var(--text-secondary)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <text x="100" y="100" fill="var(--text-secondary)" fontSize="6" fontFamily="var(--font-mono)">RF SCAN</text>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full opacity-50">
            <motion.path d="M50,120 Q200,20 350,120 T50,120" fill="none" stroke="var(--accent-color)" strokeWidth="0.5" strokeDasharray="2 2" {...drawProps} />
            <motion.circle cx="200" cy="120" r="40" fill="none" stroke="var(--text-muted)" strokeWidth="0.5" strokeDasharray="2 2" {...drawProps} />
            <text x="200" y="125" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">{name} ARCHITECTURE</text>
          </svg>
        );
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {getDiagram()}
    </div>
  );
}
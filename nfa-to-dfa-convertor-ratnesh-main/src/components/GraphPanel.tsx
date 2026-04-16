import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { NFADefinition, ConversionResult } from '@/lib/nfa-types';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface NodeDatum extends SimulationNodeDatum {
  id: string;
  isStart: boolean;
  isFinal: boolean;
}

interface LinkDatum extends SimulationLinkDatum<NodeDatum> {
  label: string;
}

function mergeLinks(links: LinkDatum[]): { source: string; target: string; labels: string[] }[] {
  const map = new Map<string, string[]>();
  for (const l of links) {
    const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
    const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
    const key = `${s}|${t}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l.label);
  }
  return Array.from(map.entries()).map(([key, labels]) => {
    const [source, target] = key.split('|');
    return { source, target, labels };
  });
}

function GraphSVG({ nodes, links, width, height, title }: {
  nodes: NodeDatum[];
  links: LinkDatum[];
  width: number;
  height: number;
  title: string;
}) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const simRef = useRef<any>(null);
  const simNodesRef = useRef<any[]>([]);
  const draggingRef = useRef<{ id: string | null; offsetX: number; offsetY: number } | null>(null);
  const panningRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const nodeIds = nodes.map(n => n.id).join(',');
  const linkKey = links.map(l => {
    const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
    const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
    return `${s}-${t}-${l.label}`;
  }).join(',');

  useEffect(() => {
    if (nodes.length === 0) { setPositions({}); return; }

    const simNodes = nodes.map(n => ({ ...n, x: width / 2 + (Math.random() - 0.5) * 100, y: height / 2 + (Math.random() - 0.5) * 100 }));
    const simLinks = links.map(l => ({ ...l }));
    simNodesRef.current = simNodes;

    const sim = forceSimulation(simNodes)
      .force('link', forceLink(simLinks).id((d: any) => d.id).distance(90))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(40));

    simRef.current = sim;

    sim.on('tick', () => {
      const pos: Record<string, { x: number; y: number }> = {};
      for (const n of simNodes) {
        pos[n.id] = { x: n.x ?? width / 2, y: n.y ?? height / 2 };
      }
      setPositions({ ...pos });
    });

    sim.alpha(1).restart();

    return () => { sim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeIds, linkKey, width, height]);

  const screenToGraph = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
  }, [pan, zoom]);

  const onNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const pt = screenToGraph(e.clientX, e.clientY);
    const node = simNodesRef.current.find(n => n.id === id);
    if (!node) return;
    draggingRef.current = { id, offsetX: pt.x - (node.x ?? 0), offsetY: pt.y - (node.y ?? 0) };
    if (simRef.current) simRef.current.alphaTarget(0.3).restart();
    node.fx = node.x;
    node.fy = node.y;
  };

  const onSvgMouseDown = (e: React.MouseEvent) => {
    panningRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingRef.current?.id) {
        const node = simNodesRef.current.find(n => n.id === draggingRef.current!.id);
        if (node) {
          const pt = screenToGraph(e.clientX, e.clientY);
          node.fx = pt.x - draggingRef.current.offsetX;
          node.fy = pt.y - draggingRef.current.offsetY;
        }
      } else if (panningRef.current) {
        const dx = e.clientX - panningRef.current.startX;
        const dy = e.clientY - panningRef.current.startY;
        setPan({ x: panningRef.current.panX + dx, y: panningRef.current.panY + dy });
      }
    };
    const onUp = () => {
      if (draggingRef.current?.id) {
        const node = simNodesRef.current.find(n => n.id === draggingRef.current!.id);
        if (node) { node.fx = null; node.fy = null; }
        if (simRef.current) simRef.current.alphaTarget(0);
      }
      draggingRef.current = null;
      panningRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [screenToGraph]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.3, Math.min(3, zoom * (1 + delta)));
    // zoom toward cursor
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const k = newZoom / zoom;
      setPan(p => ({ x: cx - (cx - p.x) * k, y: cy - (cy - p.y) * k }));
    }
    setZoom(newZoom);
  };

  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  if (nodes.length === 0) {
    return (
      <div className="border rounded bg-muted/20 flex items-center justify-center" style={{ width, height }}>
        <p className="text-xs text-muted-foreground">{title} — no data yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-0.5">
          <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(z => Math.min(3, z * 1.2))} title="Zoom in">
            <ZoomIn className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(z => Math.max(0.3, z / 1.2))} title="Zoom out">
            <ZoomOut className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={reset} title="Reset view">
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border rounded bg-white cursor-grab active:cursor-grabbing"
        onMouseDown={onSvgMouseDown}
        onWheel={onWheel}
      >
        <defs>
          <marker id={`arrow-${title}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {mergeLinks(links).map((link, i) => {
            const sp = positions[link.source];
            const tp = positions[link.target];
            if (!sp || !tp) return null;

            const isSelf = link.source === link.target;
            if (isSelf) {
              const cx = sp.x;
              const cy = sp.y - 40;
              return (
                <g key={i}>
                  <path
                    d={`M ${sp.x - 10} ${sp.y - 18} C ${cx - 30} ${cy - 25}, ${cx + 30} ${cy - 25}, ${sp.x + 10} ${sp.y - 18}`}
                    fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5}
                    markerEnd={`url(#arrow-${title})`}
                  />
                  <text x={cx} y={cy - 20} textAnchor="middle" className="text-[10px] fill-foreground font-medium">
                    {link.labels.join(', ')}
                  </text>
                </g>
              );
            }

            const dx = tp.x - sp.x;
            const dy = tp.y - sp.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;
            const r = 20;
            const sx = sp.x + ux * r;
            const sy = sp.y + uy * r;
            const ex = tp.x - ux * (r + 6);
            const ey = tp.y - uy * (r + 6);
            const mx = (sx + ex) / 2;
            const my = (sy + ey) / 2 - 12;

            return (
              <g key={i}>
                <line x1={sx} y1={sy} x2={ex} y2={ey}
                  stroke="hsl(var(--muted-foreground))" strokeWidth={1.5}
                  markerEnd={`url(#arrow-${title})`}
                />
                <text x={mx} y={my} textAnchor="middle" className="text-[10px] fill-foreground font-medium">
                  {link.labels.join(', ')}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;
            return (
              <g key={node.id}
                onMouseDown={e => onNodeMouseDown(e, node.id)}
                style={{ cursor: 'grab' }}
              >
                {node.isStart && (
                  <line x1={pos.x - 45} y1={pos.y} x2={pos.x - 22} y2={pos.y}
                    stroke="hsl(var(--foreground))" strokeWidth={1.5}
                    markerEnd={`url(#arrow-${title})`}
                  />
                )}
                {node.isFinal && (
                  <circle cx={pos.x} cy={pos.y} r={24} fill="none"
                    stroke="hsl(var(--foreground))" strokeWidth={1.5} />
                )}
                <circle cx={pos.x} cy={pos.y} r={20} fill="white"
                  stroke="hsl(var(--foreground))" strokeWidth={1.5} />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle"
                  className="text-[9px] fill-foreground font-medium select-none pointer-events-none">
                  {node.id.length > 10 ? node.id.slice(0, 9) + '…' : node.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

interface Props {
  nfa: NFADefinition | null;
  result: ConversionResult | null;
}

export default function GraphPanel({ nfa, result }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 380, h: 280 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setDims({ w: Math.floor(e.contentRect.width) - 8, h: Math.floor((e.contentRect.height - 80) / 2) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const nfaGraph = useMemo(() => {
    if (!nfa || nfa.states.length === 0) return { nodes: [] as NodeDatum[], links: [] as LinkDatum[] };
    const nodes: NodeDatum[] = nfa.states.map(s => ({
      id: s, isStart: s === nfa.startState, isFinal: nfa.finalStates.includes(s),
    }));
    const links: LinkDatum[] = [];
    const validStates = new Set(nfa.states);
    for (const t of nfa.transitions) {
      if (!validStates.has(t.from)) continue;
      for (const to of t.to) {
        if (validStates.has(to)) links.push({ source: t.from, target: to, label: t.symbol });
      }
    }
    return { nodes, links };
  }, [nfa]);

  const dfaGraph = useMemo(() => {
    if (!result) return { nodes: [] as NodeDatum[], links: [] as LinkDatum[] };
    const nodes: NodeDatum[] = result.dfaStates.map(s => ({
      id: s.id, isStart: s.isStart, isFinal: s.isFinal,
    }));
    const links: LinkDatum[] = result.dfaTransitions.map(t => ({
      source: t.from, target: t.to, label: t.symbol,
    }));
    return { nodes, links };
  }, [result]);

  return (
    <div ref={containerRef} className="flex flex-col h-full p-4 gap-3 overflow-hidden">
      <h2 className="text-base font-semibold text-foreground">Visualizations</h2>
      <GraphSVG nodes={nfaGraph.nodes} links={nfaGraph.links} width={dims.w} height={dims.h} title="NFA" />
      <GraphSVG nodes={dfaGraph.nodes} links={dfaGraph.links} width={dims.w} height={dims.h} title="DFA" />
    </div>
  );
}

  import { useEffect, useMemo, useState } from 'react'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
  import type { Asignatura } from '@/types/plan'
  import {
    ReactFlow,
    Background,
    MarkerType,
    type Edge,
    type Node,
    ReactFlowProvider,
    useReactFlow,
    BackgroundVariant
  } from "@xyflow/react";
  import "@xyflow/react/dist/style.css";
  import dagre from 'dagre';

  interface Props {
    asignatura: Asignatura | null
    todasLasAsignaturas: Asignatura[]
    isOpen: boolean
    onClose: () => void
  }

  // 🔹 Layout con dagre (TOP -> BOTTOM)
  const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
      rankdir: 'TB',
      nodesep: 80,
      ranksep: 120,
    });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 80 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return {
      nodes: nodes.map((node) => {
        const pos = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: pos.x - 90,
            y: pos.y - 40,
          },
        };
      }),
      edges,
    };
  };

  // 🔹 Contenido del Flow
  function FlowContent({ nodes, edges }: { nodes: Node[], edges: Edge[] }) {
    const { fitView } = useReactFlow();

    useEffect(() => {
      requestAnimationFrame(() => {
        fitView({ padding: 0.3 });
      });
    }, [nodes, fitView]);

    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        colorMode="light"
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        style={{ width: '100%', height: '100%', background: '#ffffff' }}
      >
        <Background color="#e5e7eb" gap={20} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    );
  }

  export function VisualizadorSeriacionModal({
    asignatura,
    todasLasAsignaturas,
    isOpen,
    onClose
  }: Props) {

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      if (isOpen) {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => {
          clearTimeout(timer);
          setIsMounted(false);
        };
      }
    }, [isOpen]);

    const getAllPrerequisitos = (
    materia: Asignatura,
    todas: Asignatura[],
    visited = new Set<string>()
  ): Asignatura[] => {
    if (!materia.prerrequisito_asignatura_id) return [];

    const parent = todas.find(a => a.id === materia.prerrequisito_asignatura_id);
    if (!parent || visited.has(parent.id)) return [];

    visited.add(parent.id);

    return [
      parent,
      ...getAllPrerequisitos(parent, todas, visited)
    ];
  };

  const getAllConsecuentes = (
    materia: Asignatura,
    todas: Asignatura[],
    visited = new Set<string>()
  ): Asignatura[] => {
    const children = todas.filter(a => a.prerrequisito_asignatura_id === materia.id);

    return children.flatMap(child => {
      if (visited.has(child.id)) return [];
      visited.add(child.id);

      return [
        child,
        ...getAllConsecuentes(child, todas, visited)
      ];
    });
  };

    // 🔥 Generación de nodos + edges + layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
      if (!asignatura) return { nodes: [], edges: [] };

      const nodes: Node[] = [];
      const edges: Edge[] = [];

      // 🔵 Nodo principal
      nodes.push({
        id: 'current',
        data: { label: asignatura.nombre },
        position: { x: 0, y: 0 },
        style: {
          background: '#2563eb',
          color: '#fff',
          width: 180,
          padding: '12px',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '12px',
          border: '2px solid #60a5fa'
        }
      });

      const prerrequisitos = getAllPrerequisitos(asignatura, todasLasAsignaturas);

      prerrequisitos.forEach(p => {
        const id = `node-${p.id}`;

        nodes.push({
          id,
          data: { label: p.nombre },
          position: { x: 0, y: 0 },
          style: {
            background: '#7f1d1d',
            color: '#fecaca',
            width: 180,
            padding: '10px',
            borderRadius: '8px',
            fontSize: '11px',
            border: '1px solid #f87171'
          }
        });

        // 🔥 EDGE REAL
        if (p.prerrequisito_asignatura_id) {
          edges.push({
            id: `e-${p.prerrequisito_asignatura_id}-${p.id}`,
            source:
              p.prerrequisito_asignatura_id === asignatura.id
                ? 'current'
                : `node-${p.prerrequisito_asignatura_id}`,
            target: id,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#f87171' }
          });
        } else {
          // conecta al current si es directo
          edges.push({
            id: `e-${id}-current`,
            source: id,
            target: 'current',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#f87171' }
          });
        }
      });

      const consecuentes = getAllConsecuentes(asignatura, todasLasAsignaturas);

      consecuentes.forEach(c => {
        const id = `node-${c.id}`;

        // nodo
        nodes.push({
          id,
          data: { label: c.nombre },
          position: { x: 0, y: 0 },
          style: {
            background: '#064e3b',
            color: '#d1fae5',
            width: 180,
            padding: '10px',
            borderRadius: '8px',
            fontSize: '11px',
            border: '1px solid #34d399'
          }
        });

        // 🔥 EDGE REAL (NO current)
        if (c.prerrequisito_asignatura_id) {
          edges.push({
            id: `e-${c.prerrequisito_asignatura_id}-${c.id}`,
            source:
              c.prerrequisito_asignatura_id === asignatura.id
                ? 'current'
                : `node-${c.prerrequisito_asignatura_id}`,
            target: id,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#34d399' }
          });
        }
      });

      // 🔥 Aplicar layout jerárquico
      return getLayoutedElements(nodes, edges);

    }, [asignatura, todasLasAsignaturas]);

    if (!asignatura) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[550px] bg-slate-950 text-white border-slate-800 p-0 flex flex-col overflow-hidden">
          
          <DialogHeader className="p-4 border-b border-slate-800">
            <DialogTitle className="text-lg">
              Seriación: <span >{asignatura.nombre}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full min-h-[350px]">
            {isMounted && (
              <ReactFlowProvider>
                <FlowContent
                  key={asignatura.id} // 🔥 importante para refrescar
                  nodes={layoutedNodes}
                  edges={layoutedEdges}
                />
              </ReactFlowProvider>
            )}
          </div>

        </DialogContent>
      </Dialog>
    );
  }
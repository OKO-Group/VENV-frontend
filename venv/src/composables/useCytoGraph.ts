import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import euler from 'cytoscape-euler'
import type { Ref } from 'vue'

cytoscape.use(euler)

interface RawGraphData {
  nodes: Array<Record<string, any>>
  edges: Array<{ from: string; to: string }>
}

function normalizeGraph(raw: RawGraphData): ElementDefinition[] {
  const nodeElements: ElementDefinition[] = raw.nodes.map((node) => ({
    group: 'nodes',
    data: {
      ...node,
      id: node.id,
    },
  }))

  const edgeElements: ElementDefinition[] = raw.edges.map((edge, index) => ({
    group: 'edges',
    data: {
      id: `e${index}`,
      source: edge.from,
      target: edge.to,
    },
  }))

  return [...nodeElements, ...edgeElements]
}

interface NodeData extends Record<string, any> {
  id: string
  type?: string
}

interface EdgeData {
  from: string
  to: string
}

interface GraphData {
  nodes: NodeData[]
  edges: EdgeData[]
}

export function useCytoscapeGraph(
  container: HTMLElement,
  graphData: GraphData,
  onNodeClick: (data: NodeData) => void,
): Core {
  const nodeMap = new Map<string, NodeData>()
  graphData.nodes.forEach((node) => {
    nodeMap.set(node.id, node)
  })
  const cy = cytoscape({
    container,
    pixelRatio: 1,
    hideEdgesOnViewport: true,
    textureOnViewport: true,
    style: [
      {
        selector: 'node',
        style: {
          width: (node) => (node.data('type') == 'org' ? 12 : 8),
          height: (node) => (node.data('type') == 'org' ? 12 : 8),
          shape: 'ellipse',
          'background-fit': 'cover',
          'background-repeat': 'no-repeat',
          'border-width': 0.5,
          opacity: 0.88,
          'background-color': (node) => (node.data('type') == 'org' ? '#efd699' : '#86c1ef'),
          'border-color': (node) => (node.data('type') == 'org' ? '#e8bb10' : '#2196F3'),
          'border-opacity': 0.8,
          'border-style': (node) => (node.data('type') == 'org' ? 'dotted' : 'solid'),
          'text-valign': 'center',
          'text-halign': 'center',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 0.3,
          'line-color': (edge) =>
            nodeMap.get(edge.data('source'))?.type == 'org' ||
            nodeMap.get(edge.data('target'))?.type == 'org'
              ? '#e8bb10'
              : '#2196F3',

          'line-style': (edge) =>
            nodeMap.get(edge.data('source'))?.type == 'org' ||
            nodeMap.get(edge.data('target'))?.type == 'org'
              ? 'dashed'
              : 'solid',
          'line-opacity': 0.7,
          'target-arrow-shape': 'triangle',
        },
      },
      {
        selector: 'node.fade',
        style: {
          'background-color': 'rgba(0,0,0,0.38)',
          'border-color': 'rgba(204,204,204,0.39)',
          'border-width': 0.5,
          'border-opacity': 0.1,
          'border-style': 'dotted',
        },
      },
      {
        selector: 'node.highlighted',
        style: {
          'border-color': '#FF9800',
          'border-width': 2,
          'background-color': '#FFF3E0'
        }
      },
      {
        selector: 'edge.highlighted',
        style: {
          'line-color': '#FF9800',
          'width': 1.2
        }
      },
      {
        selector: '.faded',
        style: {
          'opacity': 0.33
        }
      }
    ],
    elements: [],
    layout: {
      name: 'euler',
      springLength: () => 160, // ← was 100
      springCoeff: () => 0.0006, // ← was 0.001
      gravity: -0.15, // global repulsion
      pull: 0.001, // weaker pull to centre
      mass: () => 3,
      dragCoeff: 0.02,
      timeStep: 20,
      movementThreshold: 0.25,
      maxIterations: 2000,
      maxSimulationTime: 12000,
      animate: true,
      fit: true,
      ungrabifyWhileSimulating: true,
      padding: 40,
      randomize: true, // required for reliable convergence
    },
  })

  cy.batch(() => {
    const nodes = graphData.nodes.map((n) => ({
      group: 'nodes',
      data: {
        ...n,
        id: n.id,
      },
    }))

    const edges = graphData.edges
      .filter(
        (e) =>
          graphData.nodes.find((n) => n.id === e.from) &&
          graphData.nodes.find((n) => n.id === e.to),
      )
      .map((e, index) => ({
        group: 'edges',
        data: {
          id: `e-${index}`,
          source: e.from,
          target: e.to,
        },
      }))

    cy.add([...nodes, ...edges])
  })

  cy.on('tap', 'node', function(evt) {
    const node = evt.target;
    const connectedEdges = node.connectedEdges();
    const connectedNodes = connectedEdges.connectedNodes();

    // Clear previous highlights
    cy.elements().removeClass('highlighted faded');

    // Highlight the tapped node
    node.addClass('highlighted');

    // Highlight connected edges and nodes
    connectedEdges.addClass('highlighted');
    connectedNodes.addClass('highlighted');

    // Fade all other elements
    cy.elements().difference(node.union(connectedEdges).union(connectedNodes)).addClass('faded');
    onNodeClick(node.data())
  });

  cy.on('tap', function(evt) {
    if (evt.target === cy) {
      cy.elements().removeClass('highlighted faded');
      onNodeClick(null); // Clear selection if background is clicked
    }
  });


  cy.on('layoutstop', () => {
    cy.fit()
  })

  const AVATAR_ZOOM_THRESHOLD = 1.5

  function updateAvatarsInView() {
    const extent = cy.extent() // { x1, y1, x2, y2 }
    const zoom = cy.zoom()
    const nodes = []
    const excl_n = []
    for (const node of cy.nodes()) {
      const pos = node.position()
      const inView =
        pos.x >= extent.x1 && pos.x <= extent.x2 && pos.y >= extent.y1 && pos.y <= extent.y2

      if (inView && zoom >= AVATAR_ZOOM_THRESHOLD) {
        nodes.push(node)
        if (nodes.length > 300) {
          return
        }
      } else {
        excl_n.push(node)
      }
    }

    nodes.forEach((node) => {
      node.style('background-image', node.data('avatar') || '')
    })
    excl_n.forEach((node) => {
      node.style('background-image', '')
    })
  }

  // Attach the listener
  cy.on('zoom pan', updateAvatarsInView)
  cy.layout({ name: 'euler', animate: true }).run()
  return cy
}

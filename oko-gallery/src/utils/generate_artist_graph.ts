import type { User } from '@/types/oko.ts'

// composables/useLayout.ts
import dagre from '@dagrejs/dagre'
import { useVueFlow, Position } from '@vue-flow/core'
import type { GraphNode, GraphEdge } from '@vue-flow/core'
import { ref } from 'vue'

export type Direction = 'LR' | 'TB' | 'RL' | 'BT'

export function useLayout() {
  const { findNode } = useVueFlow()
  const previousDirection = ref<Direction>('LR')

  function layout(nodes: GraphNode[], edges: GraphEdge[], direction: Direction = 'LR',
                  windowHeight = window.innerHeight, windowWidth = window.innerWidth) {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({ rankdir: direction , nodesep: 50, ranksep: 100})

    const isHorizontal = direction === 'LR'
    previousDirection.value = direction

    for (const node of nodes) {
      const domNode = findNode(node.id)
      dagreGraph.setNode(node.id, {
        width: domNode?.dimensions.width || 100,
        height: domNode?.dimensions.height || 100
      })
    }

    for (const edge of edges) {
      dagreGraph.setEdge(edge.source, edge.target)
    }

    dagre.layout(dagreGraph)

    // Get bounds of the graph
    const graphNodes = nodes.map(n => dagreGraph.node(n.id))
    const minX = Math.min(...graphNodes.map(n => n.x))
    const maxX = Math.max(...graphNodes.map(n => n.x))
    const minY = Math.min(...graphNodes.map(n => n.y))
    const maxY = Math.max(...graphNodes.map(n => n.y))

    const graphCenter = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    }

    const viewportCenter = {
      x: windowWidth / 2.2,
      y: windowHeight / 2.2,
    }
    const dx = viewportCenter.x - graphCenter.x
    const dy = viewportCenter.y - graphCenter.y


    return nodes.map((node) => {
      const { x, y } = dagreGraph.node(node.id)
      return {
        ...node,
        position: { x: x + dx, y: y + dy },
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        targetPosition: isHorizontal ? Position.Left : Position.Top
      }
    })
  }

  return {
    layout
  }
}


export interface ArtistNodeData extends User {
  thumbnail: string,
  label: string,
  type: string,
}

export function generateArtistGraph(artists: User[]) {
  const genreCounts = new Map<string, number>()
  for (const artist of artists) {
    for (const genre of artist.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
    }
  }

  const topGenres = new Set(
    [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g)
  )

  const scoredArtists = artists.map((a) => ({
    ...a,
    score: a.genres.filter((g) => topGenres.has(g)).length
  }))

  const sorted = scoredArtists.sort((a, b) => b.score - a.score)

  const nodes = sorted.map((a, i) => ({
    id: a.id.toString(),
    position: { x: 0, y: 0 },
    data: {
      ...a,
      label: `${a.first_name} ${a.last_name}`,
      thumbnail: (a.profile_picture && 'file_thumbnail' in a.profile_picture)
        ? a.profile_picture.file_thumbnail
        : undefined
    },
    type: 'artistNode'
  }))
  const edges = []
  for (let i = 0; i < artists.length; i++) {
    for (let j = i + 1; j < artists.length; j++) {
      const shared = intersectionSize(artists[i].genres, artists[j].genres)
      if (shared >= 1) {
        edges.push({
          id: `e${artists[i].id}-${artists[j].id}`,
          source: artists[i].id.toString(),
          target: artists[j].id.toString()
        })
      }
    }
  }

  return { nodes, edges }
}

function intersectionSize(a: string[], b: string[]) {
  const set = new Set(a)
  return b.filter((x) => set.has(x)).length
}

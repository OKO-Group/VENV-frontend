<template>
  <v-container fluid class="pa-0  graph-layout">
    <!-- Top Toolbar -->
    <div class="graph-toolbar-wrapper">
      <GraphToolbar @toggleView="toggleView" @search="filterNodes" />
    </div>

    <!-- Main Content: Graph + Sidebar -->
    <div class="graph-main">
      <div ref="cyContainer" class="graph-container" />
      <GraphSidebar :node="selectedNode" v-model:open="sidebarOpen" />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import GraphToolbar from './GraphToolbar.vue'
import GraphSidebar from './GraphSidebar.vue'
import { useCytoscapeGraph } from '@/composables/useCytoGraph'
import cytoscape from 'cytoscape'

export interface NodeData {
  id: string
  name: string
  avatar: string
  bio?: string
  followers: number
  gallery?: string[]
}
export interface SocialGraphData {
  nodes: Array<NodeData>,
  edges: Array<{
    source: string
    target: string
    type?: 'follow' | 'friend' | 'blocked'
  }>
}
const props = defineProps<{ graphData: SocialGraphData }>()

const cyContainer = ref<HTMLElement | null>(null)
const cy = ref<cytoscape.Core & void | null>(null)

const selectedNode = ref<NodeData | null>(null)
const sidebarOpen = ref(false)
const nodeIndex = new Map<string, cytoscape.NodeSingular>();

onMounted(() => {
  if (cyContainer.value) {
    cy.value = useCytoscapeGraph(cyContainer.value, props.graphData, (nodeData) => {
      selectedNode.value = nodeData
      sidebarOpen.value = true
    })
    // Build once; keeps strong refs to NodeSingular objects

    cy.value.nodes().forEach(n => {
      // normalise case for case-insensitive search
      nodeIndex.set(n.data('id').toLowerCase(), n);
    });

  }
})

function toggleView() {
  // logic to toggle between graph/media view
}

function filterNodes(query: string) {
  // fast bail-out on empty input
  const q = query.trim().toLowerCase();
  const graph = cy.value;
  if (!graph) return;

  // Restore everything first (cheap, single op)
  graph.nodes('.fade').removeClass('fade');

  if (!q) return;          // show all on empty string

  // Collect matching nodes via the map
  const matches: cytoscape.NodeSingular[] = [];

  // Exact-or-substring?  Use whichever you need
  for (const [id, node] of nodeIndex) {
    if (id.includes(q) || node.data('name').includes(q) || node.data('type').includes(q)) matches.push(node);
  }

  // Convert array → collection once
  const matched = graph.collection(matches);

  // All non-matches in one shot
  graph.nodes().difference(matched).addClass('fade');
}
</script>

<style scoped>
.graph-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Toolbar always at the top */
.graph-toolbar-wrapper {
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* Flex area for graph and sidebar */
.graph-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Graph fills left side */
.graph-container {
  flex: 1;
  height: 100%;
  position: relative;
}

/* Optional: subtle fade class for search highlighting */
.faded {
  opacity: 0.2;
  transition: opacity 0.3s ease;
}
</style>

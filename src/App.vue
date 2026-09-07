<template>
  <div id="app">
    <router-view />
    <BetaBar />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'
import BetaBar from './components/BetaBar.vue'

const theme = useThemeStore()
onMounted(() => theme.apply())
</script>

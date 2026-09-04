<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'

const theme = useThemeStore()
onMounted(() => theme.apply())
</script>

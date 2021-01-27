<template>
    <Renderer msg="Runiverse!"/>
</template>

<script>

import Renderer from "@/components/Renderer";

export default {
  name: 'App',
  components: {
      Renderer,
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
html, body {
    height: 100%;
    margin: 0;
    overflow: hidden;
}
</style>
